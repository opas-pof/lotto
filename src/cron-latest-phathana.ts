import { LotteryScraper } from './scraper';
import { SanookScraper, SanookLotteryResult } from './sanook-scraper';
import { DatabaseManager } from './database';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * แปลง roundDate (ISO/date string จาก laodl) ให้เป็น YYYY-MM-DD (เวลาไทย) สำหรับจับคู่กับ Sanook
 * อิง logic เดิมของโปรเจกต์เดิม เพื่อไม่ให้เกิดการเลื่อนวันจากการแปลง timezone
 */
function toThaiDate(dateString: string): string {
  const date = new Date(dateString);

  const isUTC =
    dateString.includes('Z') ||
    dateString.includes('+00:00') ||
    dateString.includes('+0000') ||
    dateString.match(/\+00:00$/) ||
    dateString.match(/\+0000$/);

  if (isUTC) {
    const thaiDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return thaiDate.toISOString().split('T')[0];
  }

  // กรณีที่ string ไม่มี timezone indicator: ให้คงพฤติกรรมเดิมของโปรเจกต์
  const utcTime = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  const thaiDate = new Date(utcTime + 7 * 60 * 60 * 1000);
  return thaiDate.toISOString().split('T')[0];
}

function pickLatestByRoundDate(results: Array<{ roundDate: string }>): number {
  let latestIdx = 0;
  let latestTime = -Infinity;
  for (let i = 0; i < results.length; i++) {
    const t = new Date(results[i].roundDate).getTime();
    if (t > latestTime) {
      latestTime = t;
      latestIdx = i;
    }
  }
  return latestIdx;
}

async function findSanookByThaiDate(sanookScraper: SanookScraper, targetThaiDate: string) {
  const { results } = await sanookScraper.scrapeResults();
  return results.find((r: SanookLotteryResult) => r.date === targetThaiDate) || null;
}

/**
 * Cron ใหม่ (K=1):
 * - ดึง laodl เฉพาะงวดล่าสุด 1 งวด
 * - upsert ลง DB โดยปล่อย win_number/ค่าว่าง (ไม่ทับค่าจริง)
 * - enrich Sanook เฉพาะวันที่เดียว (และจะ update เฉพาะเมื่อได้ค่าจริง)
 */
export async function runCronLatestPhathana(env: Env): Promise<void> {
  const scraper = new LotteryScraper();
  const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const sanookScraper = new SanookScraper();

  try {
    console.log('[CRON] Fetch latest phathana (K=1) from laodl...');
    const phathanaResults = await scraper.getPhathanaResults();
    if (!phathanaResults || phathanaResults.length === 0) {
      console.warn('[CRON] No phathana results from laodl');
      return;
    }

    const latestIdx = pickLatestByRoundDate(phathanaResults);
    const latest = phathanaResults[latestIdx];

    const targetThaiDate = toThaiDate(latest.roundDate);
    console.log(`[CRON] Latest roundDate=${latest.roundDate} (thaiDate=${targetThaiDate})`);

    // Upsert 1 งวดเพื่อสร้าง placeholder (ถ้า winNumber ว่าง) และค่อยอัปเดตเมื่อมีค่าจริง
    await db.saveLotteryResults([latest], 'phathana');

    // Enrich Sanook เฉพาะวันเดียว
    const sanook = await findSanookByThaiDate(sanookScraper, targetThaiDate);
    if (!sanook) {
      console.warn(`[CRON][Sanook] No matching Sanook for date=${targetThaiDate}`);
      return;
    }

    const hasRealAnimal = !!sanook.animalName && !sanook.animalName.match(/^x+$/i);
    const hasRealPhathanaSets = Array.isArray(sanook.phathanaNumbers) && sanook.phathanaNumbers.length > 0;

    if (hasRealAnimal && hasRealPhathanaSets) {
      await db.updateSanookData(targetThaiDate, sanook.animalName, sanook.phathanaNumbers, 'phathana');
      console.log(`[CRON][Sanook] Updated animal_name/phathana_numbers for ${targetThaiDate}`);
    } else {
      // ไม่อัปเดตเมื่อเป็น placeholder เพื่อเลี่ยงการทับค่าจริงที่อาจมีอยู่แล้ว
      console.warn(`[CRON][Sanook] Skip update (placeholder/missing) for ${targetThaiDate}`);
    }
  } catch (error) {
    console.error('[CRON] Error:', error);
    throw error;
  }
}

