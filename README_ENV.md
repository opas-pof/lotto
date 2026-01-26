# การตั้งค่า Environment Variables

## สำหรับ Local Development

### 1. สร้างไฟล์ `.env.local`

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจกต์ (ข้างๆ `package.json`)

### 2. ใส่ค่าตามนี้:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. ถ้าคุณ copy `.env.local` จาก Next.js project

**⚠️ ต้องแก้ไข:**

- ลบ `NEXT_PUBLIC_` prefix ออก
- เปลี่ยนจาก:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- เป็น:
  ```env
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  ```

**เหตุผล:** `NEXT_PUBLIC_` เป็น prefix เฉพาะ Next.js สำหรับ expose variables ไปยัง client-side แต่ Cloudflare Worker ไม่ต้องการ prefix นี้

### 4. รัน local development

```bash
npm run dev
```

Wrangler จะโหลด environment variables จาก `.env.local` อัตโนมัติ

---

## สำหรับ Production (Cloudflare)

### ⚠️ ปัญหาที่พบบ่อย: Variables หายไปหลัง Deploy

**สาเหตุ:**
- เมื่อ deploy ด้วย `wrangler deploy` ถ้า `wrangler.toml` มี `[vars]` section (แม้เป็น comment) อาจทำให้ variables ที่ตั้งใน Dashboard หายไป
- Variables ใน Dashboard จะถูกเขียนทับด้วย `wrangler.toml` เมื่อ deploy

**วิธีแก้ไข:** ใช้ **Secrets** แทน Variables (แนะนำ) เพราะจะไม่หายไปเมื่อ deploy

---

### วิธีที่ 1: ใช้ Wrangler Secrets (แนะนำที่สุด) ⭐

**ข้อดี:**
- ✅ ไม่หายไปเมื่อ deploy
- ✅ ปลอดภัยกว่า (encrypted)
- ✅ ไม่ต้องกังวลเรื่อง `wrangler.toml`

**ขั้นตอน:**

```bash
# ตั้งค่า secrets (จะให้ paste ค่าเข้าไปทีละตัว)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

**ตัวอย่างการใช้งาน:**
```bash
$ wrangler secret put SUPABASE_URL
Enter the secret value: https://hnbsusnlvdurxzncdbjv.supabase.co
✨ Success! Uploaded secret SUPABASE_URL
```

**ตรวจสอบ secrets ที่ตั้งไว้:**
```bash
wrangler secret list
```

**ลบ secret:**
```bash
wrangler secret delete SUPABASE_URL
```

---

### วิธีที่ 2: ใช้ Cloudflare Dashboard (ไม่แนะนำ)

⚠️ **ข้อควรระวัง:** Variables ที่ตั้งใน Dashboard อาจหายไปเมื่อ deploy ด้วย `wrangler deploy`

**ขั้นตอน:**
1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก **Workers & Pages** > `lotto-worker`
3. ไปที่ **Settings** > **Variables and Secrets**
4. เพิ่ม **Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**หรือใช้ Secrets ใน Dashboard:**
1. ไปที่ **Settings** > **Variables and Secrets**
2. คลิก **Add secret**
3. ใส่ชื่อและค่า (จะถูก encrypt อัตโนมัติ)

---

### วิธีที่ 3: ใช้ wrangler.toml [vars] (ไม่แนะนำสำหรับ sensitive data)

⚠️ **ไม่แนะนำ** เพราะ:
- ต้อง commit ค่าเข้า git (ไม่ปลอดภัย)
- อาจถูกเขียนทับเมื่อ deploy

**ถ้าต้องการใช้วิธีนี้:**
```toml
[vars]
SUPABASE_URL = "https://hnbsusnlvdurxzncdbjv.supabase.co"
SUPABASE_ANON_KEY = "your-key-here"
SUPABASE_SERVICE_ROLE_KEY = "your-key-here"
```

**⚠️ ห้าม commit `wrangler.toml` ที่มี secrets จริง!**

---

## วิธีแก้ไขเมื่อ Variables หายไป

### สถานการณ์: ตั้งค่า Variables ใน Dashboard แล้ว แต่หายไปหลัง deploy

**วิธีแก้ไข:**

1. **ลบ `[vars]` section ออกจาก `wrangler.toml`** (ถ้ามี):
   ```toml
   # ลบหรือ comment ส่วนนี้
   # [vars]
   # SUPABASE_URL = "..."
   ```

2. **ใช้ Secrets แทน:**
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

3. **หรือตั้งค่า Secrets ใน Dashboard:**
   - ไปที่ **Settings** > **Variables and Secrets**
   - คลิก **Add secret** แทน **Add variable**

**ทำไมต้องใช้ Secrets?**
- Secrets จะไม่ถูกเขียนทับเมื่อ deploy
- ปลอดภัยกว่า (encrypted)
- เป็น best practice สำหรับ sensitive data

---

## ไฟล์ที่เกี่ยวข้อง

- `.env.local` - สำหรับ local development (ไม่ commit ขึ้น git)
- `.env.example` - ตัวอย่าง template (commit ขึ้น git ได้)
- `wrangler.toml` - config สำหรับ Cloudflare Worker

---

## Security Notes

- ⚠️ **ห้าม commit `.env.local` ขึ้น git!**
- ✅ ใช้ `SUPABASE_SERVICE_ROLE_KEY` สำหรับเขียนข้อมูล (bypass RLS)
- ✅ ใช้ `SUPABASE_ANON_KEY` สำหรับอ่านข้อมูล (ต้องมี RLS policy ที่เหมาะสม)
