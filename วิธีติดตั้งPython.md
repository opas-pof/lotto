# 🐍 วิธีติดตั้ง Python (สำหรับผู้เริ่มต้น)

## ⚠️ ปัญหาที่พบ

ถ้าเห็น error แบบนี้:
```
pip: The term 'pip' is not recognized
python: The term 'python' is not recognized
```

**หมายความว่า:** Python ยังไม่ได้ติดตั้ง หรือไม่ได้ add to PATH

---

## 📥 วิธีติดตั้ง Python (แบบละเอียด)

### ขั้นตอนที่ 1: ดาวน์โหลด Python

1. เปิดเว็บเบราว์เซอร์
2. ไปที่: **https://www.python.org/downloads/**
3. คลิกปุ่ม **"Download Python 3.x.x"** (ตัวเลขล่าสุด)
4. รอให้ดาวน์โหลดเสร็จ

### ขั้นตอนที่ 2: ติดตั้ง Python

1. เปิดไฟล์ที่ดาวน์โหลดมา (ชื่อประมาณ `python-3.11.x.exe`)

2. **สำคัญมาก!** ⚠️
   - ติ๊กถูกที่ **"Add Python to PATH"** ✅
   - ถ้าไม่ติ๊ก โปรแกรมจะรันไม่ได้!

3. คลิก **"Install Now"**

4. รอให้ติดตั้งเสร็จ (ประมาณ 2-3 นาที)

5. คลิก **"Close"** เมื่อเสร็จ

### ขั้นตอนที่ 3: ตรวจสอบว่าติดตั้งสำเร็จ

1. กด `Windows + R`
2. พิมพ์ `cmd` แล้วกด Enter
3. พิมพ์คำสั่งนี้:
   ```
   python --version
   ```
4. ถ้าเห็นตัวเลขเวอร์ชัน (เช่น `Python 3.11.5`) = **สำเร็จ!** ✅
5. พิมพ์คำสั่งนี้:
   ```
   pip --version
   ```
6. ถ้าเห็นตัวเลขเวอร์ชัน = **สำเร็จ!** ✅

---

## 🔧 ถ้ายังไม่ได้ (แก้ไข PATH แบบ Manual)

### วิธีที่ 1: ติดตั้งใหม่ (แนะนำ)

1. ไปที่ **Control Panel** → **Uninstall a program**
2. หา **Python** แล้ว **Uninstall**
3. ติดตั้งใหม่ตามขั้นตอนข้างบน
4. **อย่าลืมติ๊ก "Add Python to PATH"** ✅

### วิธีที่ 2: เพิ่ม PATH เอง

1. ค้นหา **"Environment Variables"** ใน Windows Search
2. คลิก **"Edit the system environment variables"**
3. คลิก **"Environment Variables..."**
4. ในส่วน **"System variables"** หา **"Path"** แล้วคลิก **"Edit"**
5. คลิก **"New"** แล้วเพิ่ม:
   ```
   C:\Users\[ชื่อผู้ใช้]\AppData\Local\Programs\Python\Python311
   C:\Users\[ชื่อผู้ใช้]\AppData\Local\Programs\Python\Python311\Scripts
   ```
   (เปลี่ยน `[ชื่อผู้ใช้]` เป็นชื่อผู้ใช้ของคุณ และ `Python311` เป็นเวอร์ชันที่ติดตั้ง)
6. คลิก **OK** ทั้งหมด
7. **ปิด Command Prompt แล้วเปิดใหม่**

---

## ✅ ตรวจสอบอีกครั้ง

เปิด Command Prompt ใหม่ แล้วพิมพ์:

```bash
python --version
pip --version
```

ถ้าเห็นตัวเลขทั้งสอง = **พร้อมใช้งานแล้ว!** 🎉

---

## 🚀 ต่อไป

เมื่อติดตั้ง Python สำเร็จแล้ว:

1. Double click ที่ **`ติดตั้งครั้งแรก.bat`**
2. รอให้ติดตั้ง dependencies เสร็จ
3. Double click ที่ **`รันโปรแกรม.bat`**
4. โปรแกรมจะ scrap ข้อมูลหวยให้อัตโนมัติ!

---

## ❓ ยังไม่ได้อีก?

### ลองวิธีนี้:

1. **รีสตาร์ทคอมพิวเตอร์** (บางครั้งต้องรีสตาร์ท)
2. **ติดตั้ง Python ใหม่** (ลบเก่าออกก่อน)
3. **ใช้ Python จาก Microsoft Store**:
   - เปิด Microsoft Store
   - ค้นหา "Python 3.11"
   - ติดตั้ง
   - (วิธีนี้จะ add PATH ให้อัตโนมัติ)

---

## 📞 ต้องการความช่วยเหลือ?

ถ้ายังติดปัญหา:
- ดู error message ที่เห็น
- ถ่ายภาพหน้าจอ error
- ตรวจสอบว่า Python ติดตั้งแล้วหรือยัง
