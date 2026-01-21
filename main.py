#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script หลักสำหรับ scrap ข้อมูลผลหวยจาก laodl.com
"""

from scraper import LotteryScraper
from database import DatabaseManager
import sys

def main():
    print("=" * 50)
    print("ระบบ Scrap ข้อมูลผลหวยจาก laodl.com")
    print("=" * 50)
    
    # สร้าง scraper และ database manager
    scraper = LotteryScraper()
    db = DatabaseManager()
    
    try:
        # ดึงข้อมูลผลหวยทั้งสองประเภท
        print("\nกำลังดึงข้อมูลผลหวย...")
        all_results = scraper.get_all_results()
        
        # บันทึกข้อมูลหวยพัฒนา
        if all_results['phathana']:
            print(f"\nพบข้อมูลหวยพัฒนา {len(all_results['phathana'])} รายการ")
            db.save_lottery_results(all_results['phathana'], 'phathana')
        else:
            print("\nไม่พบข้อมูลหวยพัฒนา")
        
        # บันทึกข้อมูลหวยลาสี
        if all_results['lasi']:
            print(f"\nพบข้อมูลหวยลาสี {len(all_results['lasi'])} รายการ")
            db.save_lottery_results(all_results['lasi'], 'lasi')
        else:
            print("\nไม่พบข้อมูลหวยลาสี")
        
        # แสดงข้อมูลล่าสุด
        print("\n" + "=" * 50)
        print("ข้อมูลผลหวยล่าสุด:")
        print("=" * 50)
        
        latest_phathana = db.get_latest_result('phathana')
        if latest_phathana:
            print(f"\nหวยพัฒนา:")
            print(f"  วันที่: {latest_phathana.round_date.strftime('%Y-%m-%d')}")
            print(f"  รอบที่: {latest_phathana.round_number}")
            print(f"  เลขที่ออก: {latest_phathana.win_number}")
        
        latest_lasi = db.get_latest_result('lasi')
        if latest_lasi:
            print(f"\nหวยลาสี:")
            print(f"  วันที่: {latest_lasi.round_date.strftime('%Y-%m-%d')}")
            print(f"  รอบที่: {latest_lasi.round_number}")
            print(f"  เลขที่ออก: {latest_lasi.win_number}")
        
        print("\n" + "=" * 50)
        print("เสร็จสิ้น!")
        print("=" * 50)
        
    except KeyboardInterrupt:
        print("\n\nถูกยกเลิกโดยผู้ใช้")
        sys.exit(1)
    except Exception as e:
        print(f"\nเกิดข้อผิดพลาด: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
