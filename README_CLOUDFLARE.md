# ระบบ Scrap ข้อมูลผลหวย - Cloudflare Worker

โปรเจกต์นี้ถูกแปลงจาก Python เป็น JavaScript/TypeScript เพื่อรันบน **Cloudflare Workers** พร้อม **Supabase** (PostgreSQL) database

## คุณสมบัติ

- ✅ ดึงข้อมูลผลหวยพัฒนา (ຜົນຫວຍພັດທະນາ)
- ✅ ดึงข้อมูลผลหวยลาสี (ຜົນຫວຍລາສີ)
- ✅ เก็บข้อมูลลง Supabase (PostgreSQL)
- ✅ ป้องกันข้อมูลซ้ำ (อัพเดทข้อมูลที่มีอยู่แล้ว)
- ✅ รันอัตโนมัติผ่าน Cron Triggers (ทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น.)
- ✅ API endpoints สำหรับดูข้อมูลและ trigger scraping แบบ manual

## ความต้องการของระบบ

- Node.js 18 หรือสูงกว่า
- npm หรือ yarn
- Cloudflare account (ฟรี)
- Supabase account (ฟรี)

## การติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. สร้าง Supabase Project และ Database

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. สร้าง project ใหม่
3. รัน SQL จากไฟล์ `supabase_schema.sql` ใน SQL Editor
4. ดึง API Keys จาก Project Settings > API

ดูรายละเอียดเพิ่มเติมใน [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

ดูรายละเอียดเพิ่มเติมใน [README_ENV.md](./README_ENV.md)

## การใช้งาน

### Development (Local)

```bash
npm run dev
```

Worker จะรันที่ `http://localhost:8787`

### Deploy ไปยัง Cloudflare

```bash
npm run deploy
```

## API Endpoints

### 1. Health Check

```
GET /
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "lotto-scraper",
  "timestamp": "2024-11-27T13:30:00.000Z"
}
```

### 2. ดึงข้อมูลผลหวย

```
GET /api/results
GET /api/results?type=phathana
GET /api/results?type=lasi
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "source_id": 12345,
      "round_id": 100,
      "round_date": "2024-11-27 20:30:00",
      "round_number": "001",
      "win_number": "12345",
      "lottery_type": "phathana",
      ...
    }
  ]
}
```

### 3. Trigger Scraping แบบ Manual

```
POST /api/scrape
```

**Response:**
```json
{
  "success": true,
  "message": "Scraping completed",
  "saved": {
    "phathana": 5,
    "lasi": 3
  }
}
```

## Cron Schedule

Worker จะรันอัตโนมัติผ่าน Cron Triggers:

- **วัน**: จันทร์, พุธ, ศุกร์
- **เวลา**: 20:30 น. (UTC+7) = 13:30 UTC

ตั้งค่าใน `wrangler.toml`:
```toml
[triggers]
crons = ["30 13 * * 1,3,5"]
```

## โครงสร้างโปรเจกต์

```
lotto/
├── src/
│   ├── index.ts        # Main worker file (HTTP + Cron handlers)
│   ├── scraper.ts      # Class สำหรับ scrap ข้อมูลจาก API
│   └── database.ts     # Class สำหรับจัดการ D1 database
├── schema.sql          # Database schema
├── wrangler.toml       # Cloudflare Worker config
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── README_CLOUDFLARE.md # ไฟล์นี้
```

## การ Migrate จาก Python

### ความแตกต่างหลัก:

1. **Database**: 
   - Python: SQLAlchemy + SQLite/PostgreSQL
   - JavaScript: Supabase (PostgreSQL)

2. **HTTP Client**:
   - Python: `requests` library
   - JavaScript: `fetch` API (built-in)

3. **Scheduling**:
   - Python: Cron jobs / Task Scheduler
   - JavaScript: Cloudflare Cron Triggers

4. **Deployment**:
   - Python: Render/Railway/Fly.io
   - JavaScript: Cloudflare Workers (ฟรี tier)

## ข้อดีของ Cloudflare Workers + Supabase

- ✅ **Cloudflare Workers ฟรี tier**: 100,000 requests/วัน
- ✅ **Supabase ฟรี tier**: 500MB database, 2GB bandwidth
- ✅ **เร็ว**: Edge computing, รันใกล้ผู้ใช้
- ✅ **ไม่ต้องจัดการ server**: Serverless
- ✅ **PostgreSQL**: ฐานข้อมูลที่แข็งแกร่งและยืดหยุ่น
- ✅ **Cron Triggers**: รองรับ scheduled tasks
- ✅ **Row Level Security**: ความปลอดภัยระดับ database

## หมายเหตุ

- Supabase ใช้ PostgreSQL ซึ่งเหมาะสำหรับข้อมูลขนาดใหญ่
- Cron Triggers ใช้ UTC time ต้องคำนวณเวลาท้องถิ่นให้ถูกต้อง
- ใช้ Service Role Key สำหรับเขียนข้อมูล (bypass RLS)

## Troubleshooting

### Database ไม่พบ

ตรวจสอบว่า:
1. สร้าง Supabase project แล้ว
2. รัน SQL จาก `supabase_schema.sql` แล้ว
3. ตั้งค่า environment variables ใน `.env.local` แล้ว

### Error: "relation 'lottery_results' does not exist"

**แก้ไข:** ยังไม่ได้สร้างตาราง - รัน SQL จาก `supabase_schema.sql` ใน Supabase SQL Editor

### Error: "permission denied for table lottery_results"

**แก้ไข:** 
- ตรวจสอบว่าใช้ **Service Role Key** สำหรับเขียนข้อมูล
- ตรวจสอบ RLS policy สำหรับอ่านข้อมูล

### Cron ไม่ทำงาน

ตรวจสอบว่า:
1. Deploy worker แล้ว (`npm run deploy`)
2. Cron schedule ใน `wrangler.toml` ถูกต้อง
3. ตั้งค่า secrets ใน Cloudflare แล้ว (`wrangler secret put`)
4. ตรวจสอบใน Cloudflare Dashboard > Workers > Triggers

## ข้อมูลเพิ่มเติม

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) - คู่มือการตั้งค่า Supabase
- [README_ENV.md](./README_ENV.md) - คู่มือการตั้งค่า Environment Variables
