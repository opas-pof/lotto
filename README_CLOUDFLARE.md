# ระบบ Scrap ข้อมูลผลหวย - Cloudflare Worker

โปรเจกต์นี้ถูกแปลงจาก Python เป็น JavaScript/TypeScript เพื่อรันบน **Cloudflare Workers** พร้อม **Cloudflare D1** database

## คุณสมบัติ

- ✅ ดึงข้อมูลผลหวยพัฒนา (ຜົນຫວຍພັດທະນາ)
- ✅ ดึงข้อมูลผลหวยลาสี (ຜົນຫວຍລາສີ)
- ✅ เก็บข้อมูลลง Cloudflare D1 database (SQLite)
- ✅ ป้องกันข้อมูลซ้ำ (อัพเดทข้อมูลที่มีอยู่แล้ว)
- ✅ รันอัตโนมัติผ่าน Cron Triggers (ทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น.)
- ✅ API endpoints สำหรับดูข้อมูลและ trigger scraping แบบ manual

## ความต้องการของระบบ

- Node.js 18 หรือสูงกว่า
- npm หรือ yarn
- Cloudflare account (ฟรี)

## การติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. สร้าง Cloudflare D1 Database

```bash
npm run db:create
```

คำสั่งนี้จะสร้าง D1 database และแสดง `database_id` ให้คุณคัดลอกไปใส่ใน `wrangler.toml`

### 3. ตั้งค่า wrangler.toml

เปิดไฟล์ `wrangler.toml` และใส่ `database_id` ที่ได้จากขั้นตอนที่ 2:

```toml
[[d1_databases]]
binding = "DB"
database_name = "lottery-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ใส่ตรงนี้
```

### 4. สร้าง database schema

```bash
# สำหรับ local development
npm run db:local

# สำหรับ production (หลังจาก deploy แล้ว)
npm run db:migrate
```

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
   - JavaScript: Cloudflare D1 (SQLite)

2. **HTTP Client**:
   - Python: `requests` library
   - JavaScript: `fetch` API (built-in)

3. **Scheduling**:
   - Python: Cron jobs / Task Scheduler
   - JavaScript: Cloudflare Cron Triggers

4. **Deployment**:
   - Python: Render/Railway/Fly.io
   - JavaScript: Cloudflare Workers (ฟรี tier)

## ข้อดีของ Cloudflare Workers

- ✅ **ฟรี tier**: 100,000 requests/วัน
- ✅ **เร็ว**: Edge computing, รันใกล้ผู้ใช้
- ✅ **ไม่ต้องจัดการ server**: Serverless
- ✅ **D1 Database**: SQLite-based, ฟรี 5GB storage
- ✅ **Cron Triggers**: รองรับ scheduled tasks

## หมายเหตุ

- D1 database ใช้ SQLite ซึ่งเหมาะสำหรับข้อมูลขนาดเล็กถึงกลาง
- สำหรับข้อมูลขนาดใหญ่ (มากกว่า 5GB) อาจต้องใช้ PostgreSQL แทน
- Cron Triggers ใช้ UTC time ต้องคำนวณเวลาท้องถิ่นให้ถูกต้อง

## Troubleshooting

### Database ไม่พบ

ตรวจสอบว่า:
1. สร้าง D1 database แล้ว (`npm run db:create`)
2. ใส่ `database_id` ใน `wrangler.toml` แล้ว
3. รัน migration แล้ว (`npm run db:migrate`)

### Cron ไม่ทำงาน

ตรวจสอบว่า:
1. Deploy worker แล้ว (`npm run deploy`)
2. Cron schedule ใน `wrangler.toml` ถูกต้อง
3. ตรวจสอบใน Cloudflare Dashboard > Workers > Triggers

## ข้อมูลเพิ่มเติม

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
