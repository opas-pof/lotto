# คู่มือการทดสอบระบบ

## ขั้นตอนการทดสอบหลังจากสร้าง Table แล้ว

### 1. ตรวจสอบ Environment Variables

ตรวจสอบว่าไฟล์ `.env.local` มีค่าครบถ้วน:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. รัน Local Development

```bash
npm install
npm run dev
```

ควรเห็นข้อความ:
```
⬣ wrangler dev

⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

### 3. ทดสอบ Manual Control Page (แนะนำ)

เปิดเบราว์เซอร์ไปที่:

```
http://localhost:8787/manual
```

**คุณสมบัติ:**
- 🚀 **ปุ่ม Trigger Scrape** - สำหรับ trigger scraping แบบ manual
- 👁️ **ปุ่มดูข้อมูล** - สำหรับดูข้อมูลที่บันทึกใน Supabase
- ✅ แสดงผลลัพธ์แบบ real-time
- 📊 แสดงข้อมูลในรูปแบบตาราง

**เหมาะสำหรับ:**
- ทดสอบว่าระบบทำงานถูกต้อง
- Trigger scraping เมื่อ cron ไม่ทำงาน
- ตรวจสอบข้อมูลที่บันทึกใน Supabase

### 4. ทดสอบ API Endpoints

#### 4.1 Health Check

```bash
curl http://localhost:8787/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "lotto-scraper",
  "timestamp": "2024-11-27T13:30:00.000Z"
}
```

#### 4.2 ทดสอบการดึงข้อมูล (อ่านจาก Supabase)

```bash
curl http://localhost:8787/api/results
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

ถ้ายังไม่มีข้อมูล จะได้ array ว่าง (ปกติ)

#### 4.3 ทดสอบการ Scrape (เขียนข้อมูลลง Supabase)

```bash
curl -X POST http://localhost:8787/api/scrape
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Scraping completed",
  "saved": {
    "phathana": 10,
    "lasi": 8
  }
}
```

**หมายเหตุ:** ตัวเลขอาจแตกต่างกันขึ้นอยู่กับข้อมูลที่ดึงมา

### 5. ตรวจสอบข้อมูลใน Supabase

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. เลือก Project ของคุณ
3. ไปที่ **Table Editor** > `lottery_results`
4. ควรเห็นข้อมูลที่ถูกบันทึกแล้ว

**ตรวจสอบ:**
- มีข้อมูลหวยพัฒนา (`lottery_type = 'phathana'`)
- มีข้อมูลหวยลาสี (`lottery_type = 'lasi'`)
- ข้อมูลมี `source_id`, `round_date`, `win_number` ครบถ้วน

### 6. ทดสอบการดึงข้อมูลอีกครั้ง

```bash
curl http://localhost:8787/api/results
```

ตอนนี้ควรเห็นข้อมูลที่เพิ่งบันทึก:

```json
{
  "success": true,
  "count": 18,
  "data": [
    {
      "id": 1,
      "source_id": 12345,
      "round_id": 100,
      "round_date": "2024-11-27T13:30:00.000Z",
      "round_number": "001",
      "win_number": "12345",
      "lottery_type": "phathana",
      ...
    },
    ...
  ]
}
```

### 7. ทดสอบ Filter ตาม Type

```bash
# ดึงเฉพาะหวยพัฒนา
curl "http://localhost:8787/api/results?type=phathana"

# ดึงเฉพาะหวยลาสี
curl "http://localhost:8787/api/results?type=lasi"
```

---

## ทดสอบ Production (Cloudflare)

### 1. Deploy Worker

```bash
npm run deploy
```

### 2. ทดสอบ Manual Control Page บน Production

เปิดเบราว์เซอร์ไปที่:

```
https://lotto-worker.your-subdomain.workers.dev/manual
```

### 3. ทดสอบ API บน Production

```bash
# Health check
curl https://lotto-worker.your-subdomain.workers.dev/health

# Trigger scraping
curl -X POST https://lotto-worker.your-subdomain.workers.dev/api/scrape

# ดึงข้อมูล
curl https://lotto-worker.your-subdomain.workers.dev/api/results
```

### 4. ตรวจสอบ Cron Trigger

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก **Workers & Pages** > `lotto-worker`
3. ไปที่ **Triggers** tab
4. ตรวจสอบว่า Cron expression ถูกต้อง:
   - **Schedule**: `30 13 * * 1,3,5`
   - **Description**: "At 01:30 PM UTC, only on Monday, Wednesday, and Friday"
   - **Next Run**: ควรแสดงวันจันทร์, พุธ, หรือศุกร์ เวลา 13:30 UTC (20:30 น. ไทย)

### 5. ตรวจสอบ Logs

1. ไปที่ **Workers & Pages** > `lotto-worker`
2. ไปที่ **Logs** tab
3. หลังจาก Cron trigger ทำงาน ควรเห็น logs:
   ```
   Cron trigger fired at: 2024-11-27T13:30:00.000Z
   กำลังดึงข้อมูลผลหวย...
   พบข้อมูลหวยพัฒนา 10 รายการ
   บันทึกข้อมูลหวยพัฒนา 10 รายการ
   ...
   ```

---

## Troubleshooting

### Error: "Failed to fetch" หรือ Connection Error

**แก้ไข:**
- ตรวจสอบว่า Supabase URL ถูกต้อง
- ตรวจสอบว่า API keys ถูกต้อง
- ตรวจสอบ Network connection

### Error: "relation 'lottery_results' does not exist"

**แก้ไข:**
- ตรวจสอบว่าได้รัน SQL จาก `supabase_schema.sql` แล้ว
- ตรวจสอบว่า table อยู่ใน project ที่ถูกต้อง

### Error: "permission denied for table lottery_results"

**แก้ไข:**
- ตรวจสอบว่าใช้ **Service Role Key** สำหรับเขียนข้อมูล
- ตรวจสอบ RLS policy สำหรับอ่านข้อมูล

### ไม่มีข้อมูลใน Supabase หลังจาก scrape

**ตรวจสอบ:**
1. ดู Console logs ใน terminal
2. ตรวจสอบว่า API ของ laodl.com ทำงานปกติ
3. ตรวจสอบ Supabase logs ใน Dashboard

### Cron ไม่ทำงาน

**ตรวจสอบ:**
1. Deploy worker แล้ว (`npm run deploy`)
2. Cron expression ถูกต้องใน `wrangler.toml`
3. ตรวจสอบใน Cloudflare Dashboard > Triggers
4. ตรวจสอบ Logs ว่ามี error หรือไม่

---

## Checklist การทดสอบ

- [ ] สร้าง table ใน Supabase แล้ว
- [ ] ตั้งค่า environment variables ใน `.env.local` แล้ว
- [ ] รัน `npm run dev` สำเร็จ
- [ ] Health check ทำงาน (`/health`)
- [ ] ดึงข้อมูลได้ (`/api/results`)
- [ ] Scrape ข้อมูลได้ (`POST /api/scrape`)
- [ ] ข้อมูลถูกบันทึกใน Supabase
- [ ] Deploy ไปยัง Cloudflare แล้ว
- [ ] ตั้งค่า secrets ใน Cloudflare แล้ว
- [ ] Cron trigger ตั้งค่าถูกต้อง
- [ ] ทดสอบ API บน production ได้

---

## ตัวอย่างการทดสอบแบบครบวงจร

```bash
# 1. Health check
curl http://localhost:8787/health

# 2. Scrape ข้อมูล (เขียนลง Supabase)
curl -X POST http://localhost:8787/api/scrape

# 3. ตรวจสอบข้อมูลที่บันทึก
curl http://localhost:8787/api/results | jq '.count'

# 4. ดูข้อมูลหวยพัฒนาล่าสุด
curl "http://localhost:8787/api/results?type=phathana" | jq '.data[0]'

# 5. ดูข้อมูลหวยลาสีล่าสุด
curl "http://localhost:8787/api/results?type=lasi" | jq '.data[0]'
```

**หมายเหตุ:** ต้องติดตั้ง `jq` สำหรับ format JSON output:
```bash
# macOS
brew install jq

# Windows (ใช้ Git Bash หรือ WSL)
# หรือใช้ PowerShell แทน
```
