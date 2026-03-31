/**
 * Scraper สำหรับดึงข้อมูลผลหวยจาก laodl.com
 */

export interface LotteryResult {
  id: number;
  roundId: number;
  /** วันเวลางวดจาก API laodl (ISO string) — เป็นค่าต้นทางเดียวสำหรับ instant / วันที่งวด */
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
  resultData?: Record<string, unknown>[];
}

function readStr(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  return String(v);
}

/** แปลงแถวจาก JSON API ให้ได้ฟิลด์ที่โค้ดใช้ (รองรับ camelCase / snake_case) */
export function normalizeLaodlDrawRow(raw: Record<string, unknown>): LotteryResult | null {
  const id = raw.id;
  if (id == null || Number.isNaN(Number(id))) return null;
  const roundId = raw.roundId ?? raw.round_id;
  const roundDate = readStr(raw.roundDate ?? raw.round_date);
  if (!roundDate) return null;

  const winRaw = raw.winNumber ?? raw.win_number;
  const winNumber = winRaw != null && String(winRaw).trim() !== '' ? String(winRaw).trim() : undefined;

  return {
    id: Number(id),
    roundId: roundId != null ? Number(roundId) : Number(id),
    roundDate,
    roundNumber: readStr(raw.roundNumber ?? raw.round_number),
    winNumber,
    lotNumber: raw.lotNumber != null ? Number(raw.lotNumber) : raw.lot_number != null ? Number(raw.lot_number) : undefined,
    yearId: raw.yearId != null ? Number(raw.yearId) : raw.year_id != null ? Number(raw.year_id) : undefined,
    isCloseSale: Boolean(raw.isCloseSale ?? raw.is_close_sale),
    roundStatus: raw.roundStatus != null ? Number(raw.roundStatus) : raw.round_status != null ? Number(raw.round_status) : undefined,
    isjackpot: Boolean(raw.isjackpot ?? raw.is_jackpot)
  };
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
        const rawList = data.resultData || [];
        const out: LotteryResult[] = [];
        for (const item of rawList) {
          if (item && typeof item === 'object') {
            const row = normalizeLaodlDrawRow(item as Record<string, unknown>);
            if (row) out.push(row);
          }
        }
        return out;
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
