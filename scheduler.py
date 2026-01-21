#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script สำหรับรัน scraper แบบ scheduled (สำหรับ production)
ใช้กับ cron jobs หรือ task schedulers
"""

from scraper import LotteryScraper
try:
    from database_simple import DatabaseManager
except ImportError:
    from database import DatabaseManager
import sys
import logging

# ตั้งค่า logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

def main():
    """รัน scraper และบันทึกข้อมูล"""
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("=" * 50)
        logger.info("เริ่มต้น Scrap ข้อมูลผลหวย")
        logger.info("=" * 50)
        
        scraper = LotteryScraper()
        db = DatabaseManager()
        
        # ดึงข้อมูลผลหวยทั้งสองประเภท
        logger.info("กำลังดึงข้อมูลผลหวย...")
        all_results = scraper.get_all_results()
        
        # บันทึกข้อมูลหวยพัฒนา
        if all_results['phathana']:
            count = len(all_results['phathana'])
            logger.info(f"พบข้อมูลหวยพัฒนา {count} รายการ")
            saved = db.save_lottery_results(all_results['phathana'], 'phathana')
            logger.info(f"บันทึกข้อมูลหวยพัฒนา {saved} รายการ")
        else:
            logger.warning("ไม่พบข้อมูลหวยพัฒนา")
        
        # บันทึกข้อมูลหวยลาสี
        if all_results['lasi']:
            count = len(all_results['lasi'])
            logger.info(f"พบข้อมูลหวยลาสี {count} รายการ")
            saved = db.save_lottery_results(all_results['lasi'], 'lasi')
            logger.info(f"บันทึกข้อมูลหวยลาสี {saved} รายการ")
        else:
            logger.warning("ไม่พบข้อมูลหวยลาสี")
        
        # แสดงข้อมูลล่าสุด
        latest_phathana = db.get_latest_result('phathana')
        if latest_phathana:
            date_str = latest_phathana.get('round_date', '')[:10] if isinstance(latest_phathana, dict) else latest_phathana.round_date.strftime('%Y-%m-%d')
            win_num = latest_phathana.get('win_number', '') if isinstance(latest_phathana, dict) else latest_phathana.win_number
            logger.info(f"หวยพัฒนาล่าสุด: {date_str} - {win_num}")
        
        latest_lasi = db.get_latest_result('lasi')
        if latest_lasi:
            date_str = latest_lasi.get('round_date', '')[:10] if isinstance(latest_lasi, dict) else latest_lasi.round_date.strftime('%Y-%m-%d')
            win_num = latest_lasi.get('win_number', '') if isinstance(latest_lasi, dict) else latest_lasi.win_number
            logger.info(f"หวยลาสีล่าสุด: {date_str} - {win_num}")
        
        logger.info("=" * 50)
        logger.info("เสร็จสิ้น!")
        logger.info("=" * 50)
        
        db.close()
        return 0
        
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาด: {e}", exc_info=True)
        db.close()
        return 1

if __name__ == "__main__":
    sys.exit(main())
