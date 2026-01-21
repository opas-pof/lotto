import sqlite3
from datetime import datetime
from typing import List, Dict, Optional

class DatabaseManager:
    """จัดการการเชื่อมต่อและทำงานกับ database (ใช้ SQLite โดยตรง)"""
    
    def __init__(self, db_path: str = "lottery.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._create_table()
    
    def _create_table(self):
        """สร้างตารางถ้ายังไม่มี"""
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lottery_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id INTEGER UNIQUE NOT NULL,
                round_id INTEGER NOT NULL,
                round_date TEXT NOT NULL,
                round_number TEXT,
                win_number TEXT,
                lot_number INTEGER,
                year_id INTEGER,
                lottery_type TEXT NOT NULL,
                is_close_sale INTEGER DEFAULT 0,
                round_status INTEGER,
                is_jackpot INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_id ON lottery_results(source_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_round_id ON lottery_results(round_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_round_date ON lottery_results(round_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lottery_type ON lottery_results(lottery_type)")
        self.conn.commit()
    
    def save_lottery_results(self, results: List[Dict], lottery_type: str) -> int:
        """บันทึกข้อมูลผลหวยลง database"""
        saved_count = 0
        cursor = self.conn.cursor()
        
        for result_data in results:
            try:
                # ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
                cursor.execute("SELECT id FROM lottery_results WHERE source_id = ?", 
                             (result_data['id'],))
                existing = cursor.fetchone()
                
                # แปลงวันที่
                round_date = result_data['roundDate'].replace('T', ' ').replace('Z', '')
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                if existing:
                    # อัพเดทข้อมูลที่มีอยู่
                    cursor.execute("""
                        UPDATE lottery_results SET
                            round_id = ?, round_date = ?, round_number = ?,
                            win_number = ?, lot_number = ?, year_id = ?,
                            is_close_sale = ?, round_status = ?, is_jackpot = ?,
                            updated_at = ?
                        WHERE source_id = ?
                    """, (
                        result_data.get('roundId'),
                        round_date,
                        result_data.get('roundNumber'),
                        result_data.get('winNumber'),
                        result_data.get('lotNumber'),
                        result_data.get('yearId'),
                        1 if result_data.get('isCloseSale', False) else 0,
                        result_data.get('roundStatus'),
                        1 if result_data.get('isjackpot', False) else 0,
                        now,
                        result_data['id']
                    ))
                else:
                    # สร้างข้อมูลใหม่
                    cursor.execute("""
                        INSERT INTO lottery_results (
                            source_id, round_id, round_date, round_number,
                            win_number, lot_number, year_id, lottery_type,
                            is_close_sale, round_status, is_jackpot
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        result_data['id'],
                        result_data.get('roundId'),
                        round_date,
                        result_data.get('roundNumber'),
                        result_data.get('winNumber'),
                        result_data.get('lotNumber'),
                        result_data.get('yearId'),
                        lottery_type,
                        1 if result_data.get('isCloseSale', False) else 0,
                        result_data.get('roundStatus'),
                        1 if result_data.get('isjackpot', False) else 0
                    ))
                
                saved_count += 1
                
            except Exception as e:
                print(f"Error saving result {result_data.get('id')}: {e}")
                continue
        
        try:
            self.conn.commit()
            print(f"บันทึกข้อมูล {lottery_type} จำนวน {saved_count} รายการ")
        except Exception as e:
            self.conn.rollback()
            print(f"Error committing to database: {e}")
            saved_count = 0
        
        return saved_count
    
    def get_latest_result(self, lottery_type: str) -> Optional[Dict]:
        """ดึงข้อมูลผลหวยล่าสุด"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM lottery_results 
            WHERE lottery_type = ? 
            ORDER BY round_date DESC 
            LIMIT 1
        """, (lottery_type,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    
    def close(self):
        """ปิดการเชื่อมต่อ database"""
        self.conn.close()
