# คู่มือการตั้งค่า Supabase

## ขั้นตอนการ Setup

### 1. สร้าง Supabase Project

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. คลิก "New Project"
3. ตั้งชื่อ project และเลือก region
4. รอให้ project สร้างเสร็จ (ประมาณ 2-3 นาที)

### 2. สร้าง Database Table

#### วิธีที่ 1: ใช้ SQL Editor (แนะนำ)

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คัดลอก SQL จากไฟล์ `supabase_schema.sql`
3. วางใน SQL Editor
4. คลิก **Run** หรือกด `Ctrl+Enter`

#### วิธีที่ 2: ใช้ Table Editor

1. ไปที่ **Table Editor**
2. คลิก **New Table**
3. ตั้งชื่อตาราง: `lottery_results`
4. เพิ่ม columns ตามนี้:

| Column Name | Type | Default | Nullable | Unique |
|------------|------|---------|----------|--------|
| id | bigserial | - | No | Primary Key |
| source_id | integer | - | No | Yes |
| round_id | integer | - | No | No |
| round_date | timestamptz | - | No | No |
| round_number | text | - | Yes | No |
| win_number | text | - | Yes | No |
| lot_number | integer | - | Yes | No |
| year_id | integer | - | Yes | No |
| lottery_type | text | - | No | No |
| is_close_sale | boolean | false | No | No |
| round_status | integer | - | Yes | No |
| is_jackpot | boolean | false | No | No |
| created_at | timestamptz | NOW() | No | No |
| updated_at | timestamptz | NOW() | No | No |

5. ตั้ง `source_id` เป็น **Unique Constraint**
6. สร้าง **Indexes**:
   - `idx_lottery_results_source_id` on `source_id`
   - `idx_lottery_results_round_id` on `round_id`
   - `idx_lottery_results_round_date` on `round_date` (DESC)
   - `idx_lottery_results_lottery_type` on `lottery_type`

### 3. ตั้งค่า Row Level Security (RLS)

1. ไปที่ **Authentication** > **Policies**
2. เลือกตาราง `lottery_results`
3. เปิดใช้งาน **Row Level Security**
4. สร้าง Policy:
   - **Policy Name**: `Allow public read access`
   - **Allowed Operation**: `SELECT`
   - **Policy Definition**: `true` (ทุกคนอ่านได้)

**หมายเหตุ:** 
- สำหรับเขียนข้อมูล ใช้ **Service Role Key** ซึ่งจะ bypass RLS
- ไม่ต้องสร้าง policy สำหรับ INSERT/UPDATE เพราะใช้ service role key

### 4. ดึง API Keys

1. ไปที่ **Project Settings** > **API**
2. คัดลอก:
   - **Project URL** → ใส่ใน `SUPABASE_URL`
   - **anon public** key → ใส่ใน `SUPABASE_ANON_KEY`
   - **service_role** key → ใส่ใน `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **เก็บเป็นความลับ!**

### 5. ตั้งค่า Environment Variables

#### Local Development

สร้างไฟล์ `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Production (Cloudflare)

```bash
# ตั้งค่า secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

## ตรวจสอบการ Setup

### ทดสอบการเชื่อมต่อ

1. รัน local development:
   ```bash
   npm run dev
   ```

2. ทดสอบ API:
   ```bash
   # Health check
   curl http://localhost:8787/health
   
   # Trigger scraping (ทดสอบการเขียนข้อมูล)
   curl -X POST http://localhost:8787/api/scrape
   
   # ดึงข้อมูล (ทดสอบการอ่านข้อมูล)
   curl http://localhost:8787/api/results
   ```

3. ตรวจสอบใน Supabase:
   - ไปที่ **Table Editor** > `lottery_results`
   - ควรเห็นข้อมูลที่ถูกบันทึก

---

## Troubleshooting

### Error: "relation 'lottery_results' does not exist"

**แก้ไข:** ยังไม่ได้สร้างตาราง - รัน SQL จาก `supabase_schema.sql`

### Error: "permission denied for table lottery_results"

**แก้ไข:** 
- ตรวจสอบว่าใช้ **Service Role Key** สำหรับเขียนข้อมูล
- ตรวจสอบ RLS policy สำหรับอ่านข้อมูล

### Error: "duplicate key value violates unique constraint"

**แก้ไข:** ปกติ - หมายความว่ามีข้อมูลอยู่แล้ว (upsert จะอัพเดทแทน)

---

## ข้อมูลเพิ่มเติม

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
