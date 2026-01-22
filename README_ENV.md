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

### วิธีที่ 1: ใช้ Wrangler Secrets (แนะนำ)

```bash
# ตั้งค่า secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

เมื่อรันคำสั่ง จะให้คุณ paste ค่าเข้าไป

### วิธีที่ 2: ใช้ Cloudflare Dashboard

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก Workers & Pages > lotto-worker
3. ไปที่ Settings > Variables
4. เพิ่ม Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

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
