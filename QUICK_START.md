# Quick Start - ก่อน Commit

## ขั้นตอนง่ายๆ

### 1. ติดตั้ง Dependencies
```bash
pip install -r requirements.txt
```

### 2. ทดสอบ (แนะนำ)
```bash
python test_scraper.py
```

### 3. Commit
```bash
git add .
git commit -m "Initial commit: Lottery scraper"
git push origin main
```

## คำตอบสั้นๆ

**Q: ต้อง run code อะไรก่อน commit หรือไม่?**

**A: ไม่จำเป็น แต่แนะนำให้:**
1. ✅ รัน `python test_scraper.py` เพื่อทดสอบ
2. ✅ ตรวจสอบว่าไม่มี syntax error
3. ✅ ตรวจสอบว่าไฟล์ที่ ignore ถูกต้อง (ดู `.gitignore`)

**ถ้าไม่มี Python ติดตั้ง:** สามารถ commit ได้เลย (GitHub จะไม่รันโค้ดให้)

**ถ้ามี Python:** แนะนำให้ทดสอบก่อนเพื่อให้แน่ใจว่าโค้ดทำงานได้
