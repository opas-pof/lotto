# หมายเหตุเกี่ยวกับ Timezone

## Timezone ของ API ต้นทาง (laodl.com)

API ของ laodl.com ส่งวันที่มาในรูปแบบ ISO string แต่**ต้องตรวจสอบว่าใช้ timezone อะไร**

### วิธีตรวจสอบ:

1. เรียก API และดูรูปแบบวันที่ที่ได้:
   ```bash
   curl "https://laodl.com/api/website/laolot/WinPrizeHistory?type=1"
   ```

2. ตรวจสอบรูปแบบ:
   - ถ้ามี `Z` หรือ `+00:00` = **UTC**
   - ถ้าไม่มี timezone indicator = อาจเป็น **local time** (ต้องตรวจสอบ)

### สมมติฐานปัจจุบัน:

- **API ส่งวันที่มาเป็น UTC** (มี Z หรือ +00:00)
- **แปลงเป็นเวลาไทย (UTC+7)** เมื่อแสดงผล
- **เก็บใน Supabase เป็น UTC** (TIMESTAMPTZ จะจัดการอัตโนมัติ)

## การจัดการ Timezone ในโค้ด

### 1. เมื่อรับข้อมูลจาก API (`scraper.ts`)

- รับวันที่มาในรูปแบบ ISO string
- ไม่ต้องแปลงอะไร (เก็บเป็น string เดิม)

### 2. เมื่อบันทึกลง Supabase (`database.ts`)

- แปลงเป็น ISO string (UTC)
- Supabase TIMESTAMPTZ จะเก็บเป็น UTC อัตโนมัติ

### 3. เมื่อแสดงผล (`index.ts`)

- แปลงจาก UTC เป็นเวลาไทย (UTC+7) **ทุกครั้งที่แสดงผล**
- ใช้ `toThaiDate()` สำหรับแปลงวันที่
- ใช้ `toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })` สำหรับแสดงผล

## ตัวอย่างการแปลง

```javascript
// วันที่จาก API (UTC)
const apiDate = "2024-11-27T13:30:00Z";

// แปลงเป็นเวลาไทย (UTC+7)
const thaiDate = new Date(apiDate);
const thaiTime = new Date(thaiDate.getTime() + (7 * 60 * 60 * 1000));

// แสดงผล
const displayDate = thaiTime.toLocaleString('th-TH', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});
// ผลลัพธ์: "27/11/2567, 20:30"
```

## หมายเหตุสำคัญ

⚠️ **หวยออกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น. (ไทย)**

- เวลาไทย 20:30 = UTC 13:30
- Cron trigger ตั้งเป็น `30 13 * * 2,4,6` (จ, พ, ศ เวลา 13:30 UTC)

⚠️ **ต้องตรวจสอบว่า API ส่งวันที่มาใน timezone อะไร**

- ถ้า API ส่งมาเป็น UTC → ต้องบวก 7 ชั่วโมงเพื่อเป็นเวลาไทย
- ถ้า API ส่งมาเป็นเวลาไทยแล้ว → ไม่ต้องบวก

## การทดสอบ

1. เรียก API และดูรูปแบบวันที่:
   ```bash
   curl "https://laodl.com/api/website/laolot/WinPrizeHistory?type=1" | jq '.resultData[0].roundDate'
   ```

2. ตรวจสอบว่าเป็น UTC หรือ local time

3. ปรับโค้ดตามผลลัพธ์
