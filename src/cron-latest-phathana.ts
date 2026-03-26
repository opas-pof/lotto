import { LotteryScraper } from './scraper';
import { SanookScraper, SanookLotteryResult } from './sanook-scraper';
import { DatabaseManager } from './database';
import {
  getBangkokTodayYMD,
  roundDateToThaiYMD,
  filterByThaiCalendarNotAfterToday,
  pickLatestRoundDateIndex
} from './thailand-date';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/** สรุปผลรันชุดเดียวกับ Cron (ใช้ตอบ HTTP manual / log) */
export interface CronLatestPhathanaReport {
  ok: boolean;
  message: string;
  laodl: { done: boolean; count: number; eligibleCount?: number; skippedFuture?: number; error?: string };
  latest?: {
    sourceId: number;
    roundId?: number;
    roundDate: string;
    thaiDate: string;
    winNumber?: string;
  };
  database: { savedCount: number };
  sanook?: {
    attempted: boolean;
    matched: boolean;
    updated: boolean;
    note?: string;
  };
}

async function findSanookByThaiDate(sanookScraper: SanookScraper, targetThaiDate: string) {
  const { results } = await sanookScraper.scrapeResults();
  return results.find((r: SanookLotteryResult) => r.date === targetThaiDate) || null;
}

/**
 * Cron (K=1):
 * - ดึง laodl แล้วเลือกเฉพาะงวดที่วันที่ออก (ปฏิทินไทย) ไม่เกิน "วันนี้" — ไม่เอางวดอนาคตที่ API อาจแทรกมา
 * - จากนั้นเลือกงวดล่าสุด 1 งวด → upsert ลง DB → Sanook
 */
export async function runCronLatestPhathana(env: Env): Promise<CronLatestPhathanaReport> {
  const scraper = new LotteryScraper();
  const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const sanookScraper = new SanookScraper();

  const report: CronLatestPhathanaReport = {
    ok: false,
    message: '',
    laodl: { done: false, count: 0 },
    database: { savedCount: 0 },
    sanook: { attempted: false, matched: false, updated: false }
  };

  try {
    console.log('[CRON] Fetch latest phathana (K=1) from laodl...');
    const phathanaResults = await scraper.getPhathanaResults();

    if (phathanaResults === null) {
      report.laodl = { done: true, count: 0, error: 'getPhathanaResults returned null (API error or invalid response)' };
      report.message = 'ไม่ได้ข้อมูลจาก laodl (null)';
      return report;
    }

    report.laodl = { done: true, count: phathanaResults.length };

    if (phathanaResults.length === 0) {
      report.message = 'laodl ส่งรายการว่าง';
      console.warn('[CRON] No phathana results from laodl');
      return report;
    }

    const todayBangkok = getBangkokTodayYMD();
    const eligible = filterByThaiCalendarNotAfterToday(phathanaResults);
    const skipped = phathanaResults.length - eligible.length;
    report.laodl.eligibleCount = eligible.length;
    report.laodl.skippedFuture = skipped;

    if (eligible.length === 0) {
      report.message = `ทุกงวดใน laodl เป็นวันอนาคต (ปฏิทินไทย วันนี้=${todayBangkok}) — ไม่บันทึก DB`;
      console.warn(`[CRON] All ${phathanaResults.length} rows are after today (Bangkok); skipped`);
      return report;
    }

    if (skipped > 0) {
      console.log(`[CRON] Ignored ${skipped} future draw row(s); using ${eligible.length} eligible row(s)`);
    }

    const latestIdx = pickLatestRoundDateIndex(eligible);
    const latest = eligible[latestIdx];

    const targetThaiDate = roundDateToThaiYMD(latest.roundDate);
    if (!targetThaiDate) {
      report.message = 'roundDate จาก laodl แปลงเป็นปฏิทินไทยไม่ได้ (ค่าไม่ถูกต้อง)';
      return report;
    }
    report.latest = {
      sourceId: latest.id,
      roundId: latest.roundId,
      roundDate: latest.roundDate,
      thaiDate: targetThaiDate,
      winNumber: latest.winNumber
    };
    console.log(`[CRON] Latest eligible roundDate=${latest.roundDate} (thaiDate=${targetThaiDate}, today Bangkok=${todayBangkok})`);

    const savedCount = await db.saveLotteryResults([latest], 'phathana');
    report.database.savedCount = savedCount;

    if (savedCount < 1) {
      report.message = 'ดึง laodl ได้แล้ว แต่บันทึกลง DB ไม่สำเร็จ (savedCount=0) — ดู log Error saving result';
      return report;
    }

    report.sanook = { attempted: true, matched: false, updated: false };

    const sanook = await findSanookByThaiDate(sanookScraper, targetThaiDate);
    if (!sanook) {
      report.sanook.note = `No matching Sanook for date=${targetThaiDate}`;
      console.warn(`[CRON][Sanook] No matching Sanook for date=${targetThaiDate}`);
      report.ok = true;
      report.message = 'บันทึก laodl ลง DB แล้ว แต่ไม่จับคู่ Sanook ได้';
      return report;
    }

    report.sanook.matched = true;

    const hasRealAnimal = !!sanook.animalName && !sanook.animalName.match(/^x+$/i);
    const hasRealPhathanaSets = Array.isArray(sanook.phathanaNumbers) && sanook.phathanaNumbers.length > 0;

    if (hasRealAnimal && hasRealPhathanaSets) {
      await db.updateSanookData(targetThaiDate, sanook.animalName, sanook.phathanaNumbers, 'phathana');
      report.sanook.updated = true;
      report.sanook.note = 'Updated animal_name / phathana_numbers';
      console.log(`[CRON][Sanook] Updated animal_name/phathana_numbers for ${targetThaiDate}`);
      report.ok = true;
      report.message = 'สำเร็จ: บันทึก laodl + อัปเดต Sanook';
      return report;
    }

    report.sanook.note = 'Skip update (placeholder/missing Sanook fields)';
    console.warn(`[CRON][Sanook] Skip update (placeholder/missing) for ${targetThaiDate}`);
    report.ok = true;
    report.message = 'บันทึก laodl แล้ว — ข้ามอัปเดต Sanook (ข้อมูล placeholder)';
    return report;
  } catch (error) {
    console.error('[CRON] Error:', error);
    report.message = error instanceof Error ? error.message : String(error);
    throw error;
  }
}
