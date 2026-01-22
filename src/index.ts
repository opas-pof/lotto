/**
 * Cloudflare Worker - ระบบ Scrap ข้อมูลผลหวยจาก laodl.com
 */

import { LotteryScraper } from './scraper';
import { DatabaseManager } from './database';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export default {
  /**
   * จัดการ HTTP requests
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // API endpoint สำหรับดูข้อมูล
    if (url.pathname === '/api/results' || url.pathname === '/api/results/') {
      return handleGetResults(request, env);
    }
    
    // API endpoint สำหรับ trigger scraping แบบ manual
    if (url.pathname === '/api/scrape' || url.pathname === '/api/scrape/') {
      if (request.method === 'POST') {
        return handleScrape(env);
      } else {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Health check
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        service: 'lotto-scraper',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  /**
   * จัดการ Cron Triggers (scheduled tasks)
   * รันทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30 น. (UTC+7)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron trigger fired at:', new Date().toISOString());
    
    const scraper = new LotteryScraper();
    const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    try {
      // ดึงข้อมูลผลหวยทั้งสองประเภท
      console.log('กำลังดึงข้อมูลผลหวย...');
      const allResults = await scraper.getAllResults();
      
      const savedCounts: Record<string, number> = {};
      
      // บันทึกข้อมูลหวยพัฒนา
      if (allResults.phathana && allResults.phathana.length > 0) {
        console.log(`พบข้อมูลหวยพัฒนา ${allResults.phathana.length} รายการ`);
        savedCounts.phathana = await db.saveLotteryResults(allResults.phathana, 'phathana');
        console.log(`บันทึกข้อมูลหวยพัฒนา ${savedCounts.phathana} รายการ`);
      } else {
        console.warn('ไม่พบข้อมูลหวยพัฒนา');
      }
      
      // บันทึกข้อมูลหวยลาสี
      if (allResults.lasi && allResults.lasi.length > 0) {
        console.log(`พบข้อมูลหวยลาสี ${allResults.lasi.length} รายการ`);
        savedCounts.lasi = await db.saveLotteryResults(allResults.lasi, 'lasi');
        console.log(`บันทึกข้อมูลหวยลาสี ${savedCounts.lasi} รายการ`);
      } else {
        console.warn('ไม่พบข้อมูลหวยลาสี');
      }
      
      // แสดงข้อมูลล่าสุด
      const latestPhathana = await db.getLatestResult('phathana');
      if (latestPhathana) {
        const dateStr = latestPhathana.round_date?.substring(0, 10) || '';
        console.log(`หวยพัฒนาล่าสุด: ${dateStr} - ${latestPhathana.win_number}`);
      }
      
      const latestLasi = await db.getLatestResult('lasi');
      if (latestLasi) {
        const dateStr = latestLasi.round_date?.substring(0, 10) || '';
        console.log(`หวยลาสีล่าสุด: ${dateStr} - ${latestLasi.win_number}`);
      }
      
      console.log('เสร็จสิ้น!');
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      throw error;
    }
  }
};

/**
 * จัดการ GET /api/results - ดึงข้อมูลผลหวย
 */
async function handleGetResults(request: Request, env: Env): Promise<Response> {
  try {
    const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const url = new URL(request.url);
    
    // รับ query parameter สำหรับ filter
    const type = url.searchParams.get('type'); // 'phathana' หรือ 'lasi'
    
    const results = await db.getAllResults(type || undefined);
    
    return new Response(JSON.stringify({
      success: true,
      count: results.length,
      data: results
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}

/**
 * จัดการ POST /api/scrape - trigger scraping แบบ manual
 */
async function handleScrape(env: Env): Promise<Response> {
  const scraper = new LotteryScraper();
  const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // ดึงข้อมูลผลหวยทั้งสองประเภท
    const allResults = await scraper.getAllResults();
    
    const savedCounts: Record<string, number> = {};
    
    // บันทึกข้อมูลหวยพัฒนา
    if (allResults.phathana && allResults.phathana.length > 0) {
      savedCounts.phathana = await db.saveLotteryResults(allResults.phathana, 'phathana');
    }
    
    // บันทึกข้อมูลหวยลาสี
    if (allResults.lasi && allResults.lasi.length > 0) {
      savedCounts.lasi = await db.saveLotteryResults(allResults.lasi, 'lasi');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Scraping completed',
      saved: savedCounts
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}
