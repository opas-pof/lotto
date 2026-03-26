/**
 * จัดการการเชื่อมต่อและทำงานกับ Supabase (PostgreSQL) database
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { laodlRoundDateToUtcIso, roundDateToThaiYMD } from './thailand-date';

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

/** ไม่ใส่ generic Database แบบเขียนมือ — ต้องครบ GenericSchema ของ postgrest-js v2 (Tables + Views + Functions + Relationships ฯลฯ) ไม่งั้น .from() จะกลายเป็น never */
export class DatabaseManager {
  private supabase: SupabaseClient<any, 'public', any>;

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
        const roundDateIso = laodlRoundDateToUtcIso(resultData.roundDate);
        if (roundDateIso == null) {
          continue;
        }
        const roundDate = roundDateIso;
        
        // สร้าง payload — ฟิลด์ที่อาจเป็นค่าว่างจาก API (งวดรอผล) ใส่เฉพาะเมื่อมีค่า เพื่อไม่ให้ไปเขียนทับค่าเดิมใน DB
        const data: Record<string, unknown> = {
          source_id: resultData.id,
          round_id: resultData.roundId ?? null,
          round_date: roundDate,
          lot_number: resultData.lotNumber ?? null,
          year_id: resultData.yearId ?? null,
          lottery_type: lotteryType,
          is_close_sale: resultData.isCloseSale ?? false,
          round_status: resultData.roundStatus ?? null,
          is_jackpot: resultData.isjackpot ?? false,
          updated_at: new Date().toISOString()
        };
        if (resultData.roundNumber != null && resultData.roundNumber !== '') data.round_number = resultData.roundNumber;
        if (resultData.winNumber != null && resultData.winNumber !== '') data.win_number = resultData.winNumber;
        if (resultData.animalName != null && resultData.animalName !== '') data.animal_name = resultData.animalName;
        if (resultData.phathanaNumbers != null && resultData.phathanaNumbers.length > 0) data.phathana_numbers = resultData.phathanaNumbers;

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
   * date = YYYY-MM-DD ในเวลาไทย — หาแถวที่ round_date (UTC) แปลงเป็นวันไทยแล้วตรงกับ date
   */
  async updateSanookData(
    date: string, // YYYY-MM-DD (เวลาไทย)
    animalName: string | null,
    phathanaNumbers: string[] | null,
    lotteryType: string = 'phathana'
  ): Promise<number> {
    try {
      const { data: allRows, error: findError } = await this.supabase
        .from('lottery_results')
        .select('id, source_id, round_date')
        .eq('lottery_type', lotteryType)
        .order('round_date', { ascending: false })
        .limit(100);

      if (findError) {
        console.error('Error finding existing data for Sanook update:', findError);
        return 0;
      }
      if (!allRows || allRows.length === 0) return 0;

      let match = null;
      for (const row of allRows) {
        const rd = typeof row.round_date === 'string' ? row.round_date : String(row.round_date);
        const thaiDateStr = roundDateToThaiYMD(rd);
        if (thaiDateStr && thaiDateStr === date) {
          match = row;
          break;
        }
      }
      const existingData = match ? [match] : [];

      if (existingData.length === 0) {
        console.warn(`[Sanook] ไม่พบแถวใน DB สำหรับวันที่ ${date} (lottery_type=${lotteryType})`);
        return 0;
      }

      const rowId = existingData[0].id;
      const { error: updateError } = await this.supabase
        .from('lottery_results')
        .update({
          animal_name: animalName,
          phathana_numbers: phathanaNumbers,
          updated_at: new Date().toISOString()
        })
        .eq('id', rowId);

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
