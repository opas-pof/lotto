/**
 * Scraper สำหรับดึงข้อมูลผลหวยจาก laodl.com
 */

export interface LotteryResult {
  id: number;
  roundId: number;
  roundDate: string;
  roundNumber?: string;
  winNumber?: string;
  lotNumber?: number;
  yearId?: number;
  isCloseSale?: boolean;
  roundStatus?: number;
  isjackpot?: boolean;
}

export interface ApiResponse {
  status: number;
  error: boolean;
  msg?: string;
  resultData?: LotteryResult[];
}

export class LotteryScraper {
  private readonly BASE_URL = "https://laodl.com/api/website/laolot/WinPrizeHistory";
  
  // ประเภทหวย
  static readonly TYPE_PHATHANA = 1; // หวยพัฒนา
  static readonly TYPE_LASI = 2;      // หวยลาสี
  
  /**
   * ดึงข้อมูลผลหวยจาก API
   * 
   * @param lotteryType ประเภทหวย (1 = หวยพัฒนา, 2 = หวยลาสี)
   * @returns List ของข้อมูลผลหวย หรือ null ถ้าเกิด error
   */
  async fetchLotteryData(lotteryType: number): Promise<LotteryResult[] | null> {
    try {
      const url = `${this.BASE_URL}?type=${lotteryType}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.status === 200 && data.error === false) {
        return data.resultData || [];
      } else {
        console.error(`Error: ${data.msg || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error(`Request error: ${error}`);
      return null;
    }
  }
  
  /**
   * ดึงข้อมูลผลหวยพัฒนา
   */
  async getPhathanaResults(): Promise<LotteryResult[] | null> {
    return this.fetchLotteryData(LotteryScraper.TYPE_PHATHANA);
  }
  
  /**
   * ดึงข้อมูลผลหวยลาสี
   */
  async getLasiResults(): Promise<LotteryResult[] | null> {
    return this.fetchLotteryData(LotteryScraper.TYPE_LASI);
  }
  
  /**
   * ดึงข้อมูลผลหวยทั้งสองประเภท
   */
  async getAllResults(): Promise<{
    phathana: LotteryResult[] | null;
    lasi: LotteryResult[] | null;
  }> {
    const [phathana, lasi] = await Promise.all([
      this.getPhathanaResults(),
      this.getLasiResults()
    ]);
    
    return { phathana, lasi };
  }
}
