#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API endpoint สำหรับ Vercel/Serverless deployment
"""

from http.server import BaseHTTPRequestHandler
from scraper import LotteryScraper
from database import DatabaseManager
import json
import os

def handler(request):
    """Handler สำหรับ serverless function"""
    scraper = LotteryScraper()
    db = DatabaseManager()
    
    try:
        # ดึงข้อมูลผลหวยทั้งสองประเภท
        all_results = scraper.get_all_results()
        
        saved_counts = {}
        
        # บันทึกข้อมูลหวยพัฒนา
        if all_results['phathana']:
            saved_counts['phathana'] = db.save_lottery_results(
                all_results['phathana'], 
                'phathana'
            )
        
        # บันทึกข้อมูลหวยลาสี
        if all_results['lasi']:
            saved_counts['lasi'] = db.save_lottery_results(
                all_results['lasi'], 
                'lasi'
            )
        
        db.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Scraping completed',
                'saved': saved_counts
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        db.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }, ensure_ascii=False)
        }
