# วิธีการทำงานของระบบ Scraping

## 📍 URL หลัก (`/` หรือ `/health`)

**❌ ไม่ได้รัน script ดูดข้อมูล**

URL นี้เป็นแค่ **Health Check** เท่านั้น:
- ตรวจสอบว่า Worker ทำงานอยู่
- แสดงสถานะ `status: "ok"`
- **ไม่มีการดูดข้อมูล**

---

## 🔄 วิธีดูดข้อมูลมี 3 วิธี:

### 1. **Cron Trigger (อัตโนมัติ)** ⏰

**เมื่อไหร่:** ทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น. (ไทย)

**ดูดอะไร:**
- ✅ **ดูดเฉพาะ 5 รายการล่าสุด** (เรียงตาม roundDate จากใหม่ไปเก่า)
- ✅ ดึงข้อมูลหวยพัฒนาจาก API แล้วเลือก 5 รายการล่าสุด
- ✅ บันทึกลง Supabase (อัพเดทข้อมูลซ้ำอัตโนมัติ)

**โค้ดที่ทำงาน:**
```typescript
// scheduled function
const allResults = await scraper.getAllResults();
// ดึงข้อมูลทั้งหมดจาก API
```

---

## ⏰ เมื่อถึงเวลาที่ตั้งไว้ Cron จะทำอะไร?

### 📅 เวลาที่ตั้งไว้:
- **Schedule:** `30 13 * * 2,4,6` (ใน `wrangler.toml`)
- **ความหมาย:** ทุกวันจันทร์(2), พุธ(4), ศุกร์(6) เวลา 13:30 UTC
- **เวลาไทย:** 20:30 น. (UTC+7)

### 🔄 ขั้นตอนการทำงาน (อัตโนมัติ):

เมื่อถึงเวลา 20:30 น. (จ, พ, ศ) Cloudflare จะ:

#### 1️⃣ **Trigger Scheduled Function**
```
Cron trigger fired at: 2026-01-26T13:30:00.000Z
```

#### 2️⃣ **ดึงข้อมูลจาก API**
```typescript
const phathanaResults = await scraper.getPhathanaResults();
// เรียก API: https://laodl.com/api/website/laolot/WinPrizeHistory?type=1
// ได้ข้อมูลหวยพัฒนาทั้งหมดที่มีใน API
```
**Log:**
```
กำลังดึงข้อมูลผลหวย...
```

#### 3️⃣ **เลือก 5 รายการล่าสุด**
```typescript
// เรียงตาม roundDate จากใหม่ไปเก่า และเอาแค่ 5 รายการล่าสุด
const sortedResults = phathanaResults
  .sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())
  .slice(0, 5);
```
**Log (ถ้ามีข้อมูล):**
```
พบข้อมูลหวยพัฒนา 50 รายการ (เลือก 5 รายการล่าสุด)
```

#### 4️⃣ **บันทึกลง Supabase**
```typescript
savedCounts.phathana = await db.saveLotteryResults(sortedResults, 'phathana');
// บันทึกข้อมูลใหม่ และอัพเดทข้อมูลซ้ำ (ใช้ source_id เป็น unique key)
```
**Log:**
```
บันทึกข้อมูลหวยพัฒนา 5 รายการ
```

#### 5️⃣ **แสดงข้อมูลล่าสุด**
```typescript
const latestPhathana = await db.getLatestResult('phathana');
console.log(`หวยพัฒนาล่าสุด: 2026-01-26 20:30 น. - 12345`);
```
**Log:**
```
หวยพัฒนาล่าสุด: 2026-01-26 20:30 น. - 12345
```

#### 6️⃣ **เสร็จสิ้น**
```
เสร็จสิ้น!
```

---

### 📊 สรุปสิ่งที่เกิดขึ้น:

| ขั้นตอน | สิ่งที่ทำ | ผลลัพธ์ |
|---------|----------|---------|
| 1. Trigger | Cloudflare เรียก scheduled function | Function เริ่มทำงาน |
| 2. ดึงข้อมูล | เรียก API laodl.com | ได้ข้อมูลหวยพัฒนาทั้งหมด |
| 3. เลือก 5 รายการล่าสุด | เรียงตาม roundDate และ slice(0, 5) | ได้ 5 รายการล่าสุด |
| 4. บันทึก | บันทึกลง Supabase | ข้อมูลใหม่ถูกบันทึก/อัพเดท |
| 5. Log | แสดงผลใน Cloudflare Logs | เห็นขั้นตอนการทำงาน |

---

### 🔍 ตรวจสอบว่า Cron ทำงานหรือไม่:

#### วิธีที่ 1: ดู Logs ใน Cloudflare Dashboard
1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เลือก **Workers & Pages** > `lotto-worker`
3. ไปที่ **Logs** tab
4. ดู logs หลังจากเวลา 20:30 น. (จ, พ, ศ):
   ```
   Cron trigger fired at: 2026-01-26T13:30:00.000Z
   กำลังดึงข้อมูลผลหวย...
   พบข้อมูลหวยพัฒนา 50 รายการ (เลือก 5 รายการล่าสุด)
   บันทึกข้อมูลหวยพัฒนา 5 รายการ
   หวยพัฒนาล่าสุด: 2026-01-26 20:30 น. - 12345
   เสร็จสิ้น!
   ```

#### วิธีที่ 2: ตรวจสอบใน Supabase
1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. ไปที่ **Table Editor** > `lottery_results`
3. ดูข้อมูลล่าสุด (เรียงตาม `created_at` หรือ `round_date`)
4. ควรเห็นข้อมูลใหม่หลังจากเวลา 20:30 น.

#### วิธีที่ 3: เรียก API ดูข้อมูล
```bash
curl https://lotto-worker.opas-d74.workers.dev/api/results
```
ดูว่ามีข้อมูลใหม่หรือไม่

---

### ⚠️ ข้อควรระวัง:

1. **Cron ทำงานอัตโนมัติ** - ไม่ต้องทำอะไร เพียงรอเวลา
2. **ดูดเฉพาะ 5 รายการล่าสุด** - เรียงตาม roundDate จากใหม่ไปเก่า (ต่างจาก Manual Page ที่ดูดตามวันที่ที่เลือก)
3. **ดึงเฉพาะหวยพัฒนา** - ไม่ดึงหวยลาสี
4. **อัพเดทข้อมูลซ้ำ** - ถ้ามีข้อมูลเดิมจะถูกอัพเดท (ใช้ `source_id` เป็น unique key)
5. **ถ้า API ล้มเหลว** - จะเห็น error ใน logs แต่ cron จะรันครั้งถัดไปตามปกติ
6. **Timezone** - Cron ใช้ UTC แต่แสดงผลเป็นเวลาไทยใน logs

---

### 🛠️ วิธีทดสอบ Cron โดยไม่ต้องรอเวลา:

ดูใน [TESTING.md](./TESTING.md) ส่วน "ทดสอบ Scheduled Event โดยไม่ต้องรอ Cron"

---

### 2. **Manual Control Page** (`/manual`) 🖱️

**เมื่อไหร่:** เมื่อคุณเข้าไปกดปุ่ม

**ขั้นตอน:**
1. เปิด `https://lotto-worker.opas-d74.workers.dev/manual`
2. คลิก **"โหลดวันที่ที่มี"** → ดึงวันที่ที่มีใน API
3. **เลือกวันที่** จาก dropdown
4. คลิก **"Scrape หวยพัฒนา"**

**ดูดอะไร:**
- ✅ **ดูดเฉพาะวันที่ที่เลือก** (filter ตามวันที่)
- ✅ ดึงข้อมูลหวยพัฒนาสำหรับวันที่นั้น
- ✅ บันทึกลง Supabase

**เงื่อนไข:**
- ⚠️ **ต้องเลือกวันที่ก่อน** (ปุ่มจะ disabled จนกว่าจะเลือก)
- ⚠️ ดูดเฉพาะหวยพัฒนา (ไม่มีหวยลาสีแล้ว)

---

### 3. **API Endpoint** (`POST /api/scrape`) 🔌

**เมื่อไหร่:** เมื่อเรียก API

**วิธีใช้:**

#### ดูดทั้งหมด (ไม่ filter วันที่):
```bash
curl -X POST https://lotto-worker.opas-d74.workers.dev/api/scrape
```

#### ดูดเฉพาะวันที่:
```bash
curl -X POST https://lotto-worker.opas-d74.workers.dev/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-01-26", "type": "phathana"}'
```

**ดูดอะไร:**
- ✅ ถ้า**ไม่ระบุ date** = ดูดเฉพาะ 5 รายการล่าสุด (เรียงตาม roundDate)
- ✅ ถ้า**ระบุ date** = ดูดเฉพาะวันที่นั้น (อาจได้น้อยกว่า 5 รายการ)
- ✅ **ดึงเฉพาะหวยพัฒนา** - ไม่ดึงหวยลาสี

---

## 📊 การดูดข้อมูลจาก API

### API ที่ใช้:
```
https://laodl.com/api/website/laolot/WinPrizeHistory?type=1
```

**type:**
- `1` = หวยพัฒนา (ຜົນຫວຍພັດທະນາ)
- `2` = หวยลาสี (ຜົນຫວຍລາສີ) - **ไม่ใช้แล้ว**

### ข้อมูลที่ได้:
- API จะส่งข้อมูล**ทั้งหมด**ที่มีมาให้ (ไม่มี pagination)
- แต่ละรายการมี:
  - `roundDate` - วันที่/เวลา
  - `roundNumber` - รอบที่
  - `winNumber` - เลขที่ออก
  - `isjackpot` - เป็น jackpot หรือไม่

### การ Filter:

#### 1. **ดูด 5 รายการล่าสุด** (ไม่ระบุ date):
```typescript
// Cron หรือ POST /api/scrape (ไม่ระบุ date)
const phathanaResults = await scraper.getPhathanaResults();
// เรียงตาม roundDate จากใหม่ไปเก่า และเอาแค่ 5 รายการล่าสุด
const sortedResults = phathanaResults
  .sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime())
  .slice(0, 5);
```

#### 2. **ดูดเฉพาะวันที่** (filter):
```typescript
// Manual page หรือ POST /api/scrape (ระบุ date)
const allResults = await scraper.getPhathanaResults();
const filtered = allResults.filter(item => {
  const itemDate = toThaiDate(item.roundDate);
  return itemDate === targetDate; // เช่น "2026-01-26"
});
```

---

## 📝 สรุปเงื่อนไข

| วิธี | ต้องเลือกวันที่? | ดูดอะไร | เมื่อไหร่ |
|-----|----------------|---------|----------|
| **Cron** | ❌ ไม่ต้อง | 5 รายการล่าสุด | อัตโนมัติ (จ, พ, ศ 20:30) |
| **Manual Page** | ✅ ต้องเลือก | เฉพาะวันที่ | เมื่อกดปุ่ม |
| **API** | ⚠️ ไม่บังคับ | 5 รายการล่าสุด หรือเฉพาะวันที่ | เมื่อเรียก API |

---

## 🔍 ตรวจสอบว่าดูดข้อมูลหรือไม่

### วิธีที่ 1: ดู Logs ใน Cloudflare Dashboard
1. ไปที่ **Workers & Pages** > `lotto-worker`
2. ไปที่ **Logs** tab
3. ดูข้อความ:
   ```
   กำลังดึงข้อมูลผลหวย...
   พบข้อมูลหวยพัฒนา X รายการ
   บันทึกข้อมูลหวยพัฒนา X รายการ
   ```

### วิธีที่ 2: ตรวจสอบใน Supabase
1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. ไปที่ **Table Editor** > `lottery_results`
3. ดูว่ามีข้อมูลใหม่หรือไม่

### วิธีที่ 3: เรียก API ดูข้อมูล
```bash
curl https://lotto-worker.opas-d74.workers.dev/api/results
```

---

## ⚠️ ข้อควรระวัง

1. **URL หลัก (`/`) ไม่ได้ดูดข้อมูล** - เป็นแค่ health check
2. **Manual Page ต้องเลือกวันที่** - ปุ่มจะ disabled จนกว่าจะเลือก
3. **API ดูดทั้งหมดถ้าไม่ระบุ date** - ระวัง quota
4. **ข้อมูลซ้ำจะถูกอัพเดท** - ใช้ `source_id` เป็น unique key
