# ระบบ Scrap ข้อมูลผลหวยจาก laodl.com

โปรเจกต์นี้ใช้สำหรับ scrap ข้อมูลผลหวยจากเว็บไซต์ https://laodl.com/ และเก็บลง database

## คุณสมบัติ

- ดึงข้อมูลผลหวยพัฒนา (ຜົນຫວຍພັດທະນາ)
- ดึงข้อมูลผลหวยลาสี (ຜົນຫວຍລາສີ)
- เก็บข้อมูลลง SQLite database
- ป้องกันข้อมูลซ้ำ (อัพเดทข้อมูลที่มีอยู่แล้ว)

## ความต้องการของระบบ

- Python 3.7 หรือสูงกว่า

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
pip install -r requirements.txt
```

## การใช้งาน

รัน script หลัก:
```bash
python main.py
```

## โครงสร้างโปรเจกต์

```
lotto/
├── scraper.py          # Class สำหรับ scrap ข้อมูลจาก API
├── database.py         # Class สำหรับจัดการ database
├── main.py             # Script หลัก
├── requirements.txt    # Python dependencies
├── README.md           # ไฟล์นี้
└── lottery.db          # SQLite database (จะถูกสร้างอัตโนมัติ)
```

## ข้อมูลที่เก็บ

- round_id: ID รอบหวย
- round_date: วันที่ออกผล
- round_number: หมายเลขรอบ
- win_number: เลขที่ออก
- lottery_type: ประเภทหวย (phathana หรือ lasi)
- และข้อมูลอื่นๆ

## การ Deploy

โปรเจกต์นี้สามารถ deploy ได้หลายแพลตฟอร์ม:

- **Render** (แนะนำ) - รองรับ Background Workers และ Cron Jobs
- **Railway** - ใช้งานง่าย มี free tier
- **Fly.io** - รองรับ scheduled tasks
- **Vercel** - สำหรับ serverless functions

**⚠️ หมายเหตุ:** ไฟล์ `.bat` เหมาะสำหรับ Windows local development เท่านั้น  
สำหรับ production ใช้ `scheduler.py` + Cron/Task Scheduler

ดูรายละเอียดเพิ่มเติมใน [README_DEPLOY.md](README_DEPLOY.md)

### หมายเหตุเกี่ยวกับ Cloudflare Workers

**Cloudflare Workers ไม่รองรับ Python โดยตรง** (รองรับ JavaScript/TypeScript เท่านั้น)

ทางเลือก:
1. ใช้ Render/Railway/Fly.io แทน (แนะนำ)
2. แปลงเป็น JavaScript/TypeScript
3. Host Python API ที่อื่น แล้วใช้ Cloudflare Worker เรียก API นั้น

## หมายเหตุ

- ข้อมูลจะถูกเก็บใน SQLite database ชื่อ `lottery.db` (local)
- สำหรับ production แนะนำใช้ PostgreSQL (ตั้งค่า `DATABASE_URL` environment variable)
- ถ้ามีข้อมูลอยู่แล้วจะถูกอัพเดทแทนการสร้างใหม่
- Database URL สามารถตั้งค่าผ่าน environment variable `DATABASE_URL`
