from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from typing import List, Dict, Optional
import os

Base = declarative_base()

class LotteryResult(Base):
    """Model สำหรับเก็บข้อมูลผลหวย"""
    __tablename__ = 'lottery_results'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, unique=True, nullable=False, index=True)  # id จาก API
    round_id = Column(Integer, nullable=False, index=True)
    round_date = Column(DateTime, nullable=False, index=True)
    round_number = Column(String(50))
    win_number = Column(String(10))  # เลขที่ออก
    lot_number = Column(Integer)
    year_id = Column(Integer)
    lottery_type = Column(String(20), nullable=False, index=True)  # 'phathana' หรือ 'lasi'
    is_close_sale = Column(Boolean, default=False)
    round_status = Column(Integer)
    is_jackpot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f"<LotteryResult(round_id={self.round_id}, win_number={self.win_number}, type={self.lottery_type})>"

class DatabaseManager:
    """จัดการการเชื่อมต่อและทำงานกับ database"""
    
    def __init__(self, db_url: str = None):
        """
        Args:
            db_url: Database URL (ถ้าไม่ระบุจะใช้ DATABASE_URL จาก environment หรือ SQLite)
        """
        if db_url is None:
            # ใช้ DATABASE_URL จาก environment variable (สำหรับ production)
            # หรือใช้ SQLite สำหรับ local development
            db_url = os.getenv('DATABASE_URL', 'sqlite:///lottery.db')
        
        # แก้ไข PostgreSQL URL สำหรับ SQLAlchemy (ถ้าใช้ Heroku/Render)
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        
        self.engine = create_engine(db_url, echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def save_lottery_results(self, results: List[Dict], lottery_type: str) -> int:
        """
        บันทึกข้อมูลผลหวยลง database
        
        Args:
            results: List ของข้อมูลผลหวยจาก API
            lottery_type: ประเภทหวย ('phathana' หรือ 'lasi')
        
        Returns:
            จำนวนข้อมูลที่บันทึก
        """
        saved_count = 0
        
        for result_data in results:
            try:
                # ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
                existing = self.session.query(LotteryResult).filter_by(
                    source_id=result_data['id']
                ).first()
                
                if existing:
                    # อัพเดทข้อมูลที่มีอยู่
                    existing.round_id = result_data.get('roundId')
                    existing.round_date = datetime.fromisoformat(result_data['roundDate'].replace('Z', '+00:00'))
                    existing.round_number = result_data.get('roundNumber')
                    existing.win_number = result_data.get('winNumber')
                    existing.lot_number = result_data.get('lotNumber')
                    existing.year_id = result_data.get('yearId')
                    existing.is_close_sale = result_data.get('isCloseSale', False)
                    existing.round_status = result_data.get('roundStatus')
                    existing.is_jackpot = result_data.get('isjackpot', False)
                    existing.updated_at = datetime.now()
                else:
                    # สร้างข้อมูลใหม่
                    lottery_result = LotteryResult(
                        source_id=result_data['id'],
                        round_id=result_data.get('roundId'),
                        round_date=datetime.fromisoformat(result_data['roundDate'].replace('Z', '+00:00')),
                        round_number=result_data.get('roundNumber'),
                        win_number=result_data.get('winNumber'),
                        lot_number=result_data.get('lotNumber'),
                        year_id=result_data.get('yearId'),
                        lottery_type=lottery_type,
                        is_close_sale=result_data.get('isCloseSale', False),
                        round_status=result_data.get('roundStatus'),
                        is_jackpot=result_data.get('isjackpot', False)
                    )
                    self.session.add(lottery_result)
                
                saved_count += 1
                
            except Exception as e:
                print(f"Error saving result {result_data.get('id')}: {e}")
                continue
        
        try:
            self.session.commit()
            print(f"บันทึกข้อมูล {lottery_type} จำนวน {saved_count} รายการ")
        except Exception as e:
            self.session.rollback()
            print(f"Error committing to database: {e}")
            saved_count = 0
        
        return saved_count
    
    def get_latest_result(self, lottery_type: str) -> Optional[LotteryResult]:
        """ดึงข้อมูลผลหวยล่าสุด"""
        return self.session.query(LotteryResult).filter_by(
            lottery_type=lottery_type
        ).order_by(LotteryResult.round_date.desc()).first()
    
    def close(self):
        """ปิดการเชื่อมต่อ database"""
        self.session.close()
