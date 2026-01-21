#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script สำหรับดูข้อมูลผลหวยที่ scrap มา
"""

try:
    from database_simple import DatabaseManager
except ImportError:
    from database import DatabaseManager
import sys

def main():
    print("=" * 60)
    print("ข้อมูลผลหวยที่ scrap มา")
    print("=" * 60)
    
    db = DatabaseManager()
    
    try:
        # ตรวจสอบว่ามีข้อมูลหรือไม่
        import sqlite3
        conn = sqlite3.connect("lottery.db")
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM lottery_results")
        total_count = cursor.fetchone()[0]
        conn.close()
        
        if total_count == 0:
            print("\n⚠️  ยังไม่มีข้อมูลใน database")
            print("กรุณารัน 'รันโปรแกรม.bat' ก่อนเพื่อ scrap ข้อมูล")
            db.close()
            return
        
        print(f"\n📊 จำนวนข้อมูลทั้งหมด: {total_count} รายการ")
        print("=" * 60)
        
        # แสดงข้อมูลหวยพัฒนาล่าสุด 10 รายการ
        print("\n🎲 หวยพัฒนา (ล่าสุด 10 รายการ):")
        print("-" * 60)
        conn = sqlite3.connect("lottery.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT round_date, round_number, win_number 
            FROM lottery_results 
            WHERE lottery_type = 'phathana' 
            ORDER BY round_date DESC 
            LIMIT 10
        """)
        phathana_results = cursor.fetchall()
        
        if phathana_results:
            for i, result in enumerate(phathana_results, 1):
                date_str = result[0][:10] if result[0] else 'N/A'
                round_num = result[1] if result[1] else 'N/A'
                win_num = result[2] if result[2] else 'ยังไม่ออก'
                print(f"{i:2d}. วันที่: {date_str:10s} | รอบ: {round_num:5s} | เลขที่ออก: {win_num}")
        else:
            print("   ยังไม่มีข้อมูล")
        
        # แสดงข้อมูลหวยลาสีล่าสุด 10 รายการ
        print("\n🎯 หวยลาสี (ล่าสุด 10 รายการ):")
        print("-" * 60)
        cursor.execute("""
            SELECT round_date, round_number, win_number 
            FROM lottery_results 
            WHERE lottery_type = 'lasi' 
            ORDER BY round_date DESC 
            LIMIT 10
        """)
        lasi_results = cursor.fetchall()
        
        if lasi_results:
            for i, result in enumerate(lasi_results, 1):
                date_str = result[0][:10] if result[0] else 'N/A'
                round_num = result[1] if result[1] else 'N/A'
                win_num = result[2] if result[2] else 'ยังไม่ออก'
                print(f"{i:2d}. วันที่: {date_str:10s} | รอบ: {round_num:5s} | เลขที่ออก: {win_num}")
        else:
            print("   ยังไม่มีข้อมูล")
        
        conn.close()
        
        # แสดงข้อมูลล่าสุด
        print("\n" + "=" * 60)
        print("ข้อมูลล่าสุด:")
        print("=" * 60)
        
        latest_phathana = db.get_latest_result('phathana')
        if latest_phathana:
            print(f"\n🎲 หวยพัฒนา:")
            date_str = latest_phathana.get('round_date', '')[:10] if isinstance(latest_phathana, dict) else latest_phathana.round_date.strftime('%Y-%m-%d')
            print(f"   วันที่: {date_str}")
            print(f"   รอบที่: {latest_phathana.get('round_number', '') if isinstance(latest_phathana, dict) else latest_phathana.round_number}")
            print(f"   เลขที่ออก: {latest_phathana.get('win_number', '') if isinstance(latest_phathana, dict) else latest_phathana.win_number}")
            print(f"   รอบ ID: {latest_phathana.get('round_id', '') if isinstance(latest_phathana, dict) else latest_phathana.round_id}")
        
        latest_lasi = db.get_latest_result('lasi')
        if latest_lasi:
            print(f"\n🎯 หวยลาสี:")
            date_str = latest_lasi.get('round_date', '')[:10] if isinstance(latest_lasi, dict) else latest_lasi.round_date.strftime('%Y-%m-%d')
            print(f"   วันที่: {date_str}")
            print(f"   รอบที่: {latest_lasi.get('round_number', '') if isinstance(latest_lasi, dict) else latest_lasi.round_number}")
            print(f"   เลขที่ออก: {latest_lasi.get('win_number', '') if isinstance(latest_lasi, dict) else latest_lasi.win_number}")
            print(f"   รอบ ID: {latest_lasi.get('round_id', '') if isinstance(latest_lasi, dict) else latest_lasi.round_id}")
        
        print("\n" + "=" * 60)
        print("✅ เสร็จสิ้น")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
