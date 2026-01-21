# คู่มือการ Deploy

## 1. Render (แนะนำ)

### วิธี Deploy:

1. สร้างบัญชีที่ [render.com](https://render.com)
2. สร้าง New **Background Worker**
3. เชื่อมต่อ GitHub repository
4. ตั้งค่า:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Plan**: Free

### Scheduled Jobs (Cron):

สำหรับรันอัตโนมัติตามเวลา ใช้ **Cron Job**:
- ไปที่ Dashboard → Cron Jobs
- สร้าง Cron Job ใหม่
- ตั้งค่า schedule เช่น: `0 */6 * * *` (ทุก 6 ชั่วโมง)

---

## 2. Railway

### วิธี Deploy:

1. สร้างบัญชีที่ [railway.app](https://railway.app)
2. สร้าง New Project → Deploy from GitHub
3. Railway จะ detect Python อัตโนมัติ
4. ตั้งค่า **Start Command**: `python main.py`

### Scheduled Jobs:

ใช้ Railway Cron หรือ external service เช่น:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)

---

## 3. Fly.io

### วิธี Deploy:

1. ติดตั้ง Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. สร้าง app: `fly launch`
4. Deploy: `fly deploy`

### Scheduled Jobs:

ใช้ `fly cron` หรือสร้าง `fly.toml`:
```toml
[processes]
  app = "python main.py"
  
[[services]]
  processes = ["app"]
```

---

## 4. Vercel (Serverless)

### วิธี Deploy:

1. ติดตั้ง Vercel CLI: `npm i -g vercel`
2. สร้าง `api/scraper.py`:
```python
from http.server import BaseHTTPRequestHandler
from scraper import LotteryScraper
from database import DatabaseManager
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        scraper = LotteryScraper()
        db = DatabaseManager()
        # ... scrap logic ...
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())
```

3. Deploy: `vercel`

---

## 5. ใช้ Cloudflare Workers (ทางอ้อม)

ถ้าต้องการใช้ Cloudflare Workers ต้อง:
1. Host Python API ที่อื่น (Render/Railway)
2. สร้าง Cloudflare Worker ที่เรียก API นั้น

### ตัวอย่าง Worker (JavaScript):

```javascript
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch('https://your-python-api.render.com/scrape');
    return response;
  },
};
```

---

## หมายเหตุ Database

### SQLite (ปัจจุบัน):
- ใช้ได้กับ single instance
- ข้อมูลจะหายถ้า container restart (ถ้าไม่ใช้ persistent storage)

### แนะนำเปลี่ยนเป็น PostgreSQL:
- Render, Railway, Fly.io รองรับ PostgreSQL
- ข้อมูลถาวรและรองรับ concurrent access

### ตัวอย่างเปลี่ยนเป็น PostgreSQL:

แก้ไข `database.py`:
```python
# เปลี่ยนจาก
db_url = "sqlite:///lottery.db"

# เป็น
db_url = os.getenv('DATABASE_URL', 'postgresql://user:pass@host/db')
```

---

## Environment Variables

ตั้งค่าตัวแปรสิ่งแวดล้อม:
- `DATABASE_URL`: สำหรับ PostgreSQL (ถ้าใช้)
- `PYTHON_VERSION`: เวอร์ชัน Python

---

## การทดสอบ Local

```bash
# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน
python main.py
```
