/**
 * จัดการการเชื่อมต่อและทำงานกับ Supabase (PostgreSQL) database
 */

import { createClient } from '@supabase/supabase-js';

export interface LotteryResultRow {
  id?: number;
  source_id: number;
  round_id: number;
  round_date: string;
  round_number?: string | null;
  win_number?: string | null;
  lot_number?: number | null;
  year_id?: number | null;
  lottery_type: string;
  is_close_sale: boolean;
  round_status?: number | null;
  is_jackpot: boolean;
  animal_name?: string | null; // ชื่อนามสัตว์ (จาก Sanook)
  phathana_numbers?: string[] | null; // หวยลาวพัฒนา 5 ชุด (array ของ 2 หลัก)
  created_at?: string;
  updated_at?: string;
}

export class DatabaseManager {
  private supabase: ReturnType<typeof createClient>;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  /**
   * บันทึกข้อมูลผลหวยลง database
   * 
   * @param results List ของข้อมูลผลหวยจาก API
   * @param lotteryType ประเภทหวย ('phathana' หรือ 'lasi')
   * @returns จำนวนข้อมูลที่บันทึก
   */
  async saveLotteryResults(
    results: Array<{
      id: number;
      roundId?: number;
      roundDate: string;
      roundNumber?: string;
      winNumber?: string;
      lotNumber?: number;
      yearId?: number;
      isCloseSale?: boolean;
      roundStatus?: number;
      isjackpot?: boolean;
      animalName?: string; // ชื่อนามสัตว์ (จาก Sanook)
      phathanaNumbers?: string[]; // หวยลาวพัฒนา 5 ชุด (array ของ 2 หลัก)
    }>,
    lotteryType: string
  ): Promise<number> {
    let savedCount = 0;
    
    for (const resultData of results) {
      try {
        // แปลงวันที่ - เก็บเป็น UTC ใน database (PostgreSQL TIMESTAMPTZ)
        // API laodl.com ส่งวันที่มาในรูปแบบ ISO string
        // เก็บเป็น UTC ใน database (PostgreSQL จะจัดการ timezone อัตโนมัติ)
        // เมื่อ query กลับมาจะได้เป็น UTC แล้วต้องแปลงเป็นเวลาไทยตอนแสดงผล
        
        // ตรวจสอบว่า dateString มี timezone indicator หรือไม่
        const isUTC = resultData.roundDate.includes('Z') || 
                     resultData.roundDate.includes('+00:00') ||
                     resultData.roundDate.includes('+0000') ||
                     resultData.roundDate.match(/\+00:00$/) ||
                     resultData.roundDate.match(/\+0000$/);
        
        let roundDate: string;
        
        if (isUTC) {
          // เป็น UTC แล้ว ใช้ได้เลย
          roundDate = new Date(resultData.roundDate).toISOString();
        } else {
          // ถ้าไม่มี timezone indicator
          // สร้าง Date object แล้วแปลงเป็น UTC ISO string
          // PostgreSQL TIMESTAMPTZ จะเก็บเป็น UTC อัตโนมัติ
          const date = new Date(resultData.roundDate);
          roundDate = date.toISOString();
        }
        
        const data: Record<string, unknown> = {
          source_id: resultData.id,
          round_id: resultData.roundId || null,
          round_date: roundDate,
          round_number: resultData.roundNumber || null,
          win_number: resultData.winNumber || null,
          lot_number: resultData.lotNumber || null,
          year_id: resultData.yearId || null,
          lottery_type: lotteryType,
          is_close_sale: resultData.isCloseSale || false,
          round_status: resultData.roundStatus || null,
          is_jackpot: resultData.isjackpot || false,
          updated_at: new Date().toISOString()
        };
        // สำคัญ: ใส่ animal_name / phathana_numbers ใน payload เฉพาะเมื่อมีค่า (จาก Sanook)
        // ข้อมูลจาก DLL (scraper.ts LotteryResult) ไม่มีฟิลด์เหล่านี้ → key จะไม่ถูกใส่ → ตอน upsert UPDATE จะไม่แตะคอลัมน์นี้
        if (resultData.animalName !== undefined) data.animal_name = resultData.animalName;
        if (resultData.phathanaNumbers !== undefined) data.phathana_numbers = resultData.phathanaNumbers;

        // ใช้ upsert (INSERT ... ON CONFLICT UPDATE) สำหรับ Supabase
        const { error } = await this.supabase
          .from('lottery_results')
          .upsert(data, {
            onConflict: 'source_id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error(`Error saving result ${resultData.id}: ${error.message}`);
          continue;
        }
        
        savedCount++;
      } catch (error) {
        console.error(`Error saving result ${resultData.id}: ${error}`);
        continue;
      }
    }
    
    console.log(`บันทึกข้อมูล ${lotteryType} จำนวน ${savedCount} รายการ`);
    return savedCount;
  }
  
  /**
   * ดึงข้อมูลผลหวยล่าสุด
   */
  async getLatestResult(lotteryType: string): Promise<LotteryResultRow | null> {
    const { data, error } = await this.supabase
      .from('lottery_results')
      .select('*')
      .eq('lottery_type', lotteryType)
      .order('round_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as LotteryResultRow;
  }
  
  /**
   * ดึงข้อมูลผลหวยทั้งหมด (สำหรับ API endpoint)
   */
  async getAllResults(lotteryType?: string): Promise<LotteryResultRow[]> {
    let query = this.supabase
      .from('lottery_results')
      .select('*')
      .order('round_date', { ascending: false });
    
    if (lotteryType) {
      query = query.eq('lottery_type', lotteryType);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      return [];
    }
    
    return data as LotteryResultRow[];
  }
  
  /**
   * อัพเดทข้อมูลจาก Sanook (animal_name และ phathana_numbers)
   * หาแถวจาก round_date อยู่ในช่วงวันที่ YYYY-MM-DD (UTC) และ lottery_type
   */
  async updateSanookData(
    date: string, // YYYY-MM-DD
    animalName: string | null,
    phathanaNumbers: string[] | null,
    lotteryType: string = 'phathana'
  ): Promise<number> {
    try {
      const startDate = new Date(date + 'T00:00:00.000Z').toISOString();
      const endDate = new Date(date + 'T23:59:59.999Z').toISOString();

      const { data: existingData, error: findError } = await this.supabase
        .from('lottery_results')
        .select('id, source_id, round_date')
        .eq('lottery_type', lotteryType)
        .gte('round_date', startDate)
        .lte('round_date', endDate)
        .order('round_date', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding existing data for Sanook update:', findError);
        return 0;
      }

      if (!existingData || existingData.length === 0) {
        console.warn(`[Sanook] ไม่พบแถวใน DB สำหรับวันที่ ${date} (lottery_type=${lotteryType})`);
        return 0;
      }

      const { error: updateError } = await this.supabase
        .from('lottery_results')
        .update({
          animal_name: animalName,
          phathana_numbers: phathanaNumbers,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id);

      if (updateError) {
        console.error('Error updating Sanook data:', updateError);
        return 0;
      }

      console.log(`[Sanook] อัพเดทแถว id=${existingData[0].id} วันที่ ${date} (animal=${animalName ?? 'null'}, phathana=${phathanaNumbers?.length ?? 0} ชุด)`);
      return 1;
    } catch (error) {
      console.error('Error updating Sanook data:', error);
      return 0;
    }
  }
}
