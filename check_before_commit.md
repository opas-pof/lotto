# Checklist ก่อน Commit ขึ้น GitHub

## 1. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

## 2. ทดสอบการทำงาน

### วิธีที่ 1: รัน Test Script (แนะนำ)
```bash
python test_scraper.py
```

### วิธีที่ 2: รัน Main Script
```bash
python main.py
```

ควรเห็นผลลัพธ์:
- ✓ ดึงข้อมูลหวยพัฒนาได้
- ✓ ดึงข้อมูลหวยลาสีได้
- ✓ บันทึกข้อมูลลง database ได้

## 3. ตรวจสอบไฟล์ที่จะ Commit

### ไฟล์ที่ควร Commit:
- ✅ `scraper.py`
- ✅ `database.py`
- ✅ `main.py`
- ✅ `requirements.txt`
- ✅ `README.md`
- ✅ `DEPLOY.md`
- ✅ `.gitignore`
- ✅ `test_scraper.py`
- ✅ `render.yaml` (ถ้าใช้ Render)
- ✅ `Procfile` (ถ้าใช้ Heroku/Railway)
- ✅ `runtime.txt`

### ไฟล์ที่ห้าม Commit (อยู่ใน .gitignore):
- ❌ `lottery.db` (SQLite database)
- ❌ `__pycache__/`
- ❌ `*.pyc`
- ❌ `venv/` หรือ `env/`

## 4. ตรวจสอบ Syntax

```bash
# ตรวจสอบ Python syntax (ถ้ามี flake8 หรือ pylint)
python -m py_compile scraper.py database.py main.py
```

## 5. Commit และ Push

```bash
# ตรวจสอบสถานะ
git status

# เพิ่มไฟล์
git add .

# Commit
git commit -m "Initial commit: Lottery scraper for laodl.com"

# Push ขึ้น GitHub
git push origin main
```

## หมายเหตุ

- **ไม่จำเป็นต้องรันโค้ดก่อน commit** แต่แนะนำให้ทดสอบเพื่อให้แน่ใจว่าโค้ดทำงานได้
- ถ้าโค้ดมี syntax error จะไม่สามารถ commit ได้ (Git จะตรวจสอบ)
- การทดสอบก่อน commit ช่วยให้มั่นใจว่าโค้ดทำงานได้จริง
