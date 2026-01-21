import requests
import json
from datetime import datetime
from typing import List, Dict, Optional

class LotteryScraper:
    """Scraper สำหรับดึงข้อมูลผลหวยจาก laodl.com"""
    
    BASE_URL = "https://laodl.com/api/website/laolot/WinPrizeHistory"
    
    # ประเภทหวย
    TYPE_PHATHANA = 1  # หวยพัฒนา
    TYPE_LASI = 2      # หวยลาสี
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_lottery_data(self, lottery_type: int) -> Optional[List[Dict]]:
        """
        ดึงข้อมูลผลหวยจาก API
        
        Args:
            lottery_type: ประเภทหวย (1 = หวยพัฒนา, 2 = หวยลาสี)
        
        Returns:
            List ของข้อมูลผลหวย หรือ None ถ้าเกิด error
        """
        try:
            url = f"{self.BASE_URL}?type={lottery_type}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 200 and data.get('error') == False:
                return data.get('resultData', [])
            else:
                print(f"Error: {data.get('msg', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return None
    
    def get_phathana_results(self) -> Optional[List[Dict]]:
        """ดึงข้อมูลผลหวยพัฒนา"""
        return self.fetch_lottery_data(self.TYPE_PHATHANA)
    
    def get_lasi_results(self) -> Optional[List[Dict]]:
        """ดึงข้อมูลผลหวยลาสี"""
        return self.fetch_lottery_data(self.TYPE_LASI)
    
    def get_all_results(self) -> Dict[str, Optional[List[Dict]]]:
        """ดึงข้อมูลผลหวยทั้งสองประเภท"""
        return {
            'phathana': self.get_phathana_results(),
            'lasi': self.get_lasi_results()
        }
