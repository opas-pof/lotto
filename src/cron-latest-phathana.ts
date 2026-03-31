import { LotteryScraper } from './scraper';
import { SanookScraper, SanookLotteryResult } from './sanook-scraper';
import { DatabaseManager } from './database';
import {
  getBangkokTodayYMD,
  roundDateToThaiYMD,
  filterByThaiCalendarNotAfterToday,
  pickLatestRoundDateIndex
} from './thailand-date';

const SYNC_LAST_N_ELIGIBLE = 5;

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
  synced?: {
    sourceIds: number[];
    thaiDates: string[];
  };
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
    matchedDates: string[];
    updatedCount: number;
    lastNote?: string;
  };
}

/**
 * ซิงก์งวดที่ผ่านเงื่อนไขแล้วหลายงวด (ไม่ใช่แค่งวดเดียว) เพื่อให้ win_number จาก laodl ถูกเติมเมื่อ API อัปเดตหลังรอบก่อนรันก่อนประกาศผล
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
    sanook: { attempted: false, matchedDates: [], updatedCount: 0 }
  };

  try {
    console.log(`[CRON] Fetch phathana from laodl, will sync up to ${SYNC_LAST_N_ELIGIBLE} eligible draws...`);
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

    const sorted = [...eligible].sort((a, b) => new Date(b.roundDate).getTime() - new Date(a.roundDate).getTime());
    const batch = sorted.slice(0, SYNC_LAST_N_ELIGIBLE);
    const latestIdxInBatch = pickLatestRoundDateIndex(batch);
    const latest = batch[latestIdxInBatch];

    const targetThaiDateLatest = roundDateToThaiYMD(latest.roundDate);
    if (!targetThaiDateLatest) {
      report.message = 'roundDate จาก laodl แปลงเป็นปฏิทินไทยไม่ได้ (ค่าไม่ถูกต้อง)';
      return report;
    }

    report.latest = {
      sourceId: latest.id,
      roundId: latest.roundId,
      roundDate: latest.roundDate,
      thaiDate: targetThaiDateLatest,
      winNumber: latest.winNumber
    };
    report.synced = {
      sourceIds: batch.map((r) => r.id),
      thaiDates: batch.map((r) => roundDateToThaiYMD(r.roundDate)).filter((d): d is string => d !== '')
    };

    console.log(
      `[CRON] Sync ${batch.length} draw(s) to DB (latest roundDate=${latest.roundDate}, thai=${targetThaiDateLatest}, today Bangkok=${todayBangkok})`
    );

    const savedCount = await db.saveLotteryResults(batch, 'phathana');
    report.database.savedCount = savedCount;

    if (savedCount < 1) {
      report.message = 'ดึง laodl ได้แล้ว แต่บันทึกลง DB ไม่สำเร็จ (savedCount=0) — ดู log Error saving result';
      return report;
    }

    report.sanook = { attempted: true, matchedDates: [], updatedCount: 0 };

    const { results: sanookResults } = await sanookScraper.scrapeResults();

    for (const row of batch) {
      const thai = roundDateToThaiYMD(row.roundDate);
      if (!thai) continue;

      const sanook = sanookResults.find((r: SanookLotteryResult) => r.date === thai) || null;
      if (!sanook) {
        console.warn(`[CRON][Sanook] No matching row for thaiDate=${thai}`);
        continue;
      }

      report.sanook.matchedDates.push(thai);

      const hasRealAnimal = !!sanook.animalName && !sanook.animalName.match(/^x+$/i);
      const hasRealPhathanaSets = Array.isArray(sanook.phathanaNumbers) && sanook.phathanaNumbers.length > 0;

      if (hasRealAnimal && hasRealPhathanaSets) {
        await db.updateSanookData(thai, sanook.animalName, sanook.phathanaNumbers, 'phathana');
        report.sanook.updatedCount += 1;
        report.sanook.lastNote = `Updated Sanook for ${thai}`;
        console.log(`[CRON][Sanook] Updated animal_name/phathana_numbers for ${thai}`);
      } else {
        console.warn(`[CRON][Sanook] Skip update (placeholder/missing) for ${thai}`);
        report.sanook.lastNote = `Skip placeholder for ${thai}`;
      }
    }

    report.ok = true;
    report.message =
      report.sanook.updatedCount > 0
        ? `สำเร็จ: บันทึก laodl ${savedCount} แถว + อัปเดต Sanook ${report.sanook.updatedCount} วัน`
        : `บันทึก laodl ${savedCount} แถวแล้ว — Sanook อัปเดต ${report.sanook.updatedCount} วัน (หรือไม่จับคู่)`;
    return report;
  } catch (error) {
    console.error('[CRON] Error:', error);
    report.message = error instanceof Error ? error.message : String(error);
    throw error;
  }
}
