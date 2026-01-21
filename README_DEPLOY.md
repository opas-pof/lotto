# 🚀 คู่มือ Deploy สำหรับ Production

## ⚠️ หมายเหตุสำคัญ

**ไฟล์ `.bat` เหมาะสำหรับ Windows local development เท่านั้น!**

สำหรับ production/deployment ต้องใช้วิธีอื่น:

---

## 🌐 Deploy บน Cloud Services

### 1. Render (แนะนำ) ⭐

**รองรับ Cron Jobs อัตโนมัติ**

1. สร้างบัญชีที่ [render.com](https://render.com)
2. สร้าง **Background Worker** ใหม่
3. เชื่อมต่อ GitHub repository
4. ตั้งค่า:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python scheduler.py`
   - **Plan**: Free

5. สร้าง **Cron Job**:
   - ไปที่ Dashboard → Cron Jobs
   - สร้าง Cron Job ใหม่
   - **Schedule**: `30 13 * * 1,3,5` (UTC time: Mon, Wed, Fri at 13:30 = 20:30 น. ไทย)
   - **Command**: `python scheduler.py`

**หรือใช้ไฟล์ `render_cron.yaml`** (ดูในไฟล์)

---

### 2. Railway

1. สร้างบัญชีที่ [railway.app](https://railway.app)
2. สร้าง New Project → Deploy from GitHub
3. Railway จะ detect Python อัตโนมัติ
4. ตั้งค่า **Start Command**: `python scheduler.py`

**สำหรับ Cron:**
- ใช้ Railway Cron หรือ
- ใช้ external service เช่น [cron-job.org](https://cron-job.org)

---

### 3. Fly.io

1. ติดตั้ง Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. สร้าง `fly.toml`:
```toml
[app]
  name = "lottery-scraper"

[build]

[deploy]
  release_command = "python scheduler.py"

[[services]]
  internal_port = 8080
  protocol = "tcp"
```

4. Deploy: `fly deploy`

**สำหรับ Cron:**
- ใช้ `fly cron schedule` หรือ
- ใช้ external cron service

---

### 4. Heroku

1. ติดตั้ง Heroku CLI
2. สร้าง `Procfile`:
```
worker: python scheduler.py
```

3. Deploy:
```bash
heroku create lottery-scraper
git push heroku main
```

**สำหรับ Cron:**
- ใช้ Heroku Scheduler addon

---

## 🐧 Linux/Mac (VPS/Server)

### ใช้ Cron

1. แก้ไข crontab:
```bash
crontab -e
```

2. เพิ่มบรรทัดนี้:
```bash
# รันทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น. (ปรับ timezone ตาม server)
30 20 * * 1,3,5 cd /path/to/lotto && python scheduler.py >> scraper.log 2>&1
```

3. บันทึกและออก

**ดูไฟล์ `cron_schedule.txt` สำหรับตัวอย่างเพิ่มเติม**

---

## 🪟 Windows Server

### ใช้ Task Scheduler

1. เปิด Task Scheduler
2. สร้าง Task ใหม่
3. ตั้งค่า:
   - **Trigger**: Weekly, Mon, Wed, Fri, 20:30
   - **Action**: Start a program
   - **Program**: `python`
   - **Arguments**: `scheduler.py`
   - **Start in**: `C:\path\to\lotto`

---

## 📝 ไฟล์ที่ใช้สำหรับ Production

### ไฟล์หลัก:
- ✅ `scheduler.py` - Script สำหรับรันแบบ scheduled (มี logging)
- ✅ `scraper.py` - ดึงข้อมูลจาก API
- ✅ `database_simple.py` - จัดการ database
- ✅ `requirements.txt` - Dependencies

### ไฟล์ config:
- ✅ `render_cron.yaml` - สำหรับ Render
- ✅ `railway.json` - สำหรับ Railway
- ✅ `cron_schedule.txt` - ตัวอย่าง cron schedule

### ไฟล์ที่ไม่ใช้ใน Production:
- ❌ `*.bat` - สำหรับ Windows local เท่านั้น
- ❌ `main.py` - สำหรับ local testing (ใช้ `scheduler.py` แทน)

---

## 🔧 Environment Variables

ตั้งค่าตัวแปรสิ่งแวดล้อม (ถ้าต้องการ):

- `DATABASE_URL` - สำหรับ PostgreSQL (ถ้าใช้)
- `LOG_LEVEL` - ระดับ logging (INFO, DEBUG, ERROR)

---

## 📊 Monitoring

### ดู Logs:

**Render:**
- ไปที่ Dashboard → Logs

**Railway:**
- ไปที่ Dashboard → Deployments → View Logs

**Local:**
- ดูไฟล์ `scraper.log`

---

## ✅ Checklist ก่อน Deploy

- [ ] ทดสอบ `scheduler.py` ใน local ก่อน
- [ ] ตรวจสอบ timezone ของ server
- [ ] ตั้งค่า cron schedule ให้ถูกต้อง
- [ ] ตรวจสอบ logs หลัง deploy
- [ ] ทดสอบรัน manual ครั้งแรก

---

## 🎯 สรุป

1. **Local Development**: ใช้ `.bat` files
2. **Production**: ใช้ `scheduler.py` + Cron/Task Scheduler
3. **Cloud Services**: ใช้ Render/Railway/Fly.io ที่มี cron built-in

**ไม่ต้องกด `.bat` files ใน production!** ระบบจะรันอัตโนมัติตาม schedule ที่ตั้งไว้
