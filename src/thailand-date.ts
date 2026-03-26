/**
 * วันเวลางวดหวย — ยึดจากฟิลด์ `roundDate` ที่ laodl ส่งมาเท่านั้น (ไม่สร้างวันที่เอง)
 *
 * - เก็บใน DB: ใช้ instant เดียวกับที่ parse จาก string → UTC ISO (ดู database.saveLotteryResults)
 * - วันปฏิทินไทย (จับคู่ Sanook / เทียบ "วันนี้"): ใช้ Intl + timeZone Asia/Bangkok จาก instant นั้น
 */

/**
 * วันนี้ YYYY-MM-DD ตาม Asia/Bangkok
 */
export function getBangkokTodayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/**
 * จาก `roundDate` ที่ laodl ส่งมา → วันที่ปฏิทินใน Asia/Bangkok (YYYY-MM-DD)
 * ถ้า parse ไม่ได้คืน '' (ผู้เรียกควรข้ามแถวนั้น)
 */
export function roundDateToThaiYMD(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) {
    console.warn('[laodl] roundDate parse ไม่ได้:', dateString);
    return '';
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * instant เดียวกับที่ laodl ระบุ — เก็บลง TIMESTAMPTZ เป็น UTC ISO
 */
export function laodlRoundDateToUtcIso(roundDate: string): string | null {
  const d = new Date(roundDate);
  if (Number.isNaN(d.getTime())) {
    console.warn('[laodl] roundDate ไม่ถูกต้อง:', roundDate);
    return null;
  }
  return d.toISOString();
}

export function filterByThaiCalendarNotAfterToday<T extends { roundDate: string }>(
  results: T[]
): T[] {
  const today = getBangkokTodayYMD();
  return results.filter((r) => {
    const ymd = roundDateToThaiYMD(r.roundDate);
    return ymd !== '' && ymd <= today;
  });
}

export function pickLatestRoundDateIndex<T extends { roundDate: string }>(results: T[]): number {
  let latestIdx = 0;
  let latestTime = -Infinity;
  for (let i = 0; i < results.length; i++) {
    const t = new Date(results[i].roundDate).getTime();
    if (Number.isNaN(t)) continue;
    if (t > latestTime) {
      latestTime = t;
      latestIdx = i;
    }
  }
  return latestIdx;
}
