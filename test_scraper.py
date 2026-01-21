#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script สำหรับทดสอบ scraper ก่อน commit
"""

import sys
from scraper import LotteryScraper
from database import DatabaseManager

def test_scraper():
    """ทดสอบการดึงข้อมูลจาก API"""
    print("=" * 50)
    print("ทดสอบ Scraper")
    print("=" * 50)
    
    scraper = LotteryScraper()
    
    # ทดสอบดึงข้อมูลหวยพัฒนา
    print("\n1. ทดสอบดึงข้อมูลหวยพัฒนา...")
    phathana_data = scraper.get_phathana_results()
    
    if phathana_data:
        print(f"   ✓ สำเร็จ - พบข้อมูล {len(phathana_data)} รายการ")
        if len(phathana_data) > 0:
            print(f"   ตัวอย่างข้อมูลล่าสุด: {phathana_data[0].get('winNumber', 'N/A')}")
    else:
        print("   ✗ ล้มเหลว - ไม่สามารถดึงข้อมูลได้")
        return False
    
    # ทดสอบดึงข้อมูลหวยลาสี
    print("\n2. ทดสอบดึงข้อมูลหวยลาสี...")
    lasi_data = scraper.get_lasi_results()
    
    if lasi_data:
        print(f"   ✓ สำเร็จ - พบข้อมูล {len(lasi_data)} รายการ")
        if len(lasi_data) > 0:
            print(f"   ตัวอย่างข้อมูลล่าสุด: {lasi_data[0].get('winNumber', 'N/A')}")
    else:
        print("   ✗ ล้มเหลว - ไม่สามารถดึงข้อมูลได้")
        return False
    
    return True

def test_database():
    """ทดสอบการเชื่อมต่อ database"""
    print("\n" + "=" * 50)
    print("ทดสอบ Database")
    print("=" * 50)
    
    try:
        db = DatabaseManager()
        print("   ✓ เชื่อมต่อ database สำเร็จ")
        
        # ทดสอบ query
        latest = db.get_latest_result('phathana')
        if latest:
            print(f"   ✓ Query ข้อมูลสำเร็จ - พบข้อมูลล่าสุด: {latest.win_number}")
        else:
            print("   ⚠ ไม่พบข้อมูลใน database (ปกติถ้ายังไม่เคยรัน main.py)")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"   ✗ ล้มเหลว - {e}")
        return False

def main():
    """รันการทดสอบทั้งหมด"""
    print("\n" + "=" * 50)
    print("การทดสอบก่อน Commit")
    print("=" * 50)
    
    results = []
    
    # ทดสอบ scraper
    results.append(("Scraper", test_scraper()))
    
    # ทดสอบ database
    results.append(("Database", test_database()))
    
    # สรุปผล
    print("\n" + "=" * 50)
    print("สรุปผลการทดสอบ")
    print("=" * 50)
    
    all_passed = True
    for name, result in results:
        status = "✓ ผ่าน" if result else "✗ ไม่ผ่าน"
        print(f"{name}: {status}")
        if not result:
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("✓ ทุกการทดสอบผ่าน - พร้อม commit!")
        return 0
    else:
        print("✗ มีการทดสอบที่ไม่ผ่าน - กรุณาตรวจสอบก่อน commit")
        return 1

if __name__ == "__main__":
    sys.exit(main())
