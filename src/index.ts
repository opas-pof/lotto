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
    
    // Manual control page
    if (url.pathname === '/manual' || url.pathname === '/manual.html') {
      return handleManualPage();
    }
    
    // API endpoint สำหรับดูข้อมูล
    if (url.pathname === '/api/results' || url.pathname === '/api/results/') {
      return handleGetResults(request, env);
    }
    
    // API endpoint สำหรับดึงวันที่ที่มี (สำหรับเลือก scrape)
    if (url.pathname === '/api/available-dates' || url.pathname === '/api/available-dates/') {
      return handleGetAvailableDates(env);
    }
    
    // API endpoint สำหรับ trigger scraping แบบ manual
    if (url.pathname === '/api/scrape' || url.pathname === '/api/scrape/') {
      if (request.method === 'POST') {
        return handleScrape(request, env);
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
      // ดึงข้อมูลผลหวยพัฒนา
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
      
      // แสดงข้อมูลล่าสุด (แปลงเป็นเวลาไทย)
      const latestPhathana = await db.getLatestResult('phathana');
      if (latestPhathana) {
        const date = new Date(latestPhathana.round_date);
        const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        const dateStr = thaiDate.toISOString().split('T')[0];
        const timeStr = thaiDate.toLocaleTimeString('th-TH', { 
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`หวยพัฒนาล่าสุด: ${dateStr} ${timeStr} น. - ${latestPhathana.win_number}`);
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
    const type = url.searchParams.get('type'); // 'phathana'
    
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
 * จัดการ GET /manual - แสดงหน้า manual control
 */
async function handleManualPage(): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual Scrape - Lotto Scraper</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        button {
            flex: 1;
            min-width: 150px;
            padding: 15px 30px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .btn-scrape {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-scrape:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-view {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }

        .btn-view:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(245, 87, 108, 0.4);
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .status {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: none;
        }

        .status.show {
            display: block;
        }

        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .status.loading {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .result {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            display: none;
        }

        .result.show {
            display: block;
        }

        .result h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }

        .result-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }

        .result-item strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .data-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        .data-table th {
            background: #667eea;
            color: white;
            font-weight: 600;
        }

        .data-table tr:hover {
            background: #f5f5f5;
        }

        .count-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-left: 10px;
        }

        .date-selector {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .date-selector h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 16px;
        }

        .date-controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        select {
            flex: 1;
            min-width: 200px;
            padding: 12px;
            font-size: 14px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: white;
            cursor: pointer;
        }

        select:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-load {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
        }

        .btn-load:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(17, 153, 142, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎰 Manual Scrape Control</h1>
        <p class="subtitle">ใช้สำหรับ trigger scraping แบบ manual และทดสอบระบบ</p>

        <div class="date-selector">
            <h3>📅 เลือกวันที่สำหรับ Scrape</h3>
            <div class="date-controls">
                <button class="btn-load" id="btnLoadDates" onclick="loadAvailableDates()">
                    <span id="loadIcon">🔄</span>
                    <span id="loadText">โหลดวันที่ที่มี</span>
                </button>
                <select id="dateSelect" disabled>
                    <option value="">-- เลือกวันที่ --</option>
                </select>
            </div>
            <div class="date-controls" style="margin-top: 15px;">
                <button class="btn-scrape" id="btnScrapePhathana" onclick="triggerScrape('phathana')" disabled style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <span id="scrapePhathanaIcon">🚀</span>
                    <span id="scrapePhathanaText">Scrape หวยพัฒนา</span>
                </button>
            </div>
        </div>

        <div class="button-group">
            <button class="btn-view" id="btnView" onclick="viewResults()">
                <span id="viewIcon">👁️</span>
                <span id="viewText">ดูข้อมูล</span>
            </button>
        </div>

        <div id="status" class="status"></div>

        <div id="result" class="result"></div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        
        async function loadAvailableDates() {
            const btn = document.getElementById('btnLoadDates');
            const dateSelect = document.getElementById('dateSelect');
            const btnScrape = document.getElementById('btnScrape');
            const status = document.getElementById('status');
            const loadIcon = document.getElementById('loadIcon');
            const loadText = document.getElementById('loadText');

            btn.disabled = true;
            loadIcon.innerHTML = '<div class="spinner"></div>';
            loadText.textContent = 'กำลังโหลด...';
            
            status.className = 'status loading show';
            status.textContent = '⏳ กำลังดึงวันที่ที่มีจาก API...';
            dateSelect.disabled = true;
            dateSelect.innerHTML = '<option value="">-- กำลังโหลด... --</option>';

            try {
                const response = await fetch(\`\${API_BASE}/api/available-dates\`);
                const data = await response.json();

                if (response.ok && data.success && data.dates && data.dates.length > 0) {
                    status.className = 'status success show';
                    status.textContent = \`✅ พบ \${data.dates.length} วันที่\`;
                    
                    // เติมข้อมูลลง dropdown
                    dateSelect.innerHTML = '<option value="">-- เลือกวันที่ --</option>';
                    data.dates.forEach(date => {
                        const option = document.createElement('option');
                        option.value = date;
                        // แปลงวันที่เป็นรูปแบบไทย (เวลาไทย UTC+7)
                        const dateObj = new Date(date + 'T00:00:00Z'); // ใช้ UTC
                        const thaiDate = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // แปลงเป็นเวลาไทย
                        const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
                        const dayIndex = thaiDate.getUTCDay();
                        const dayName = dayNames[dayIndex];
                        const dateStr = thaiDate.toLocaleDateString('th-TH', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        });
                        option.textContent = \`\${dayName} \${dateStr} (\${date})\`;
                        dateSelect.appendChild(option);
                    });
                    
                    dateSelect.disabled = false;
                    dateSelect.addEventListener('change', function() {
                        const hasValue = !!this.value;
                        document.getElementById('btnScrapePhathana').disabled = !hasValue;
                    });
                } else {
                    throw new Error(data.error || 'ไม่พบวันที่');
                }
            } catch (error) {
                status.className = 'status error show';
                status.textContent = \`❌ เกิดข้อผิดพลาด: \${error.message}\`;
                dateSelect.innerHTML = '<option value="">-- ไม่สามารถโหลดได้ --</option>';
            } finally {
                btn.disabled = false;
                loadIcon.textContent = '🔄';
                loadText.textContent = 'โหลดวันที่ที่มี';
            }
        }
        
        async function triggerScrape(lotteryType) {
            const dateSelect = document.getElementById('dateSelect');
            const selectedDate = dateSelect.value;
            
            if (!selectedDate) {
                alert('กรุณาเลือกวันที่ก่อน');
                return;
            }
            
            const btn = document.getElementById('btnScrapePhathana');
            const status = document.getElementById('status');
            const result = document.getElementById('result');
            const scrapeIcon = document.getElementById('scrapePhathanaIcon');
            const scrapeText = document.getElementById('scrapePhathanaText');
            
            const typeName = 'หวยพัฒนา (ຜົນຫວຍພັດທະນາ)';

            btn.disabled = true;
            scrapeIcon.innerHTML = '<div class="spinner"></div>';
            scrapeText.textContent = 'กำลังดึงข้อมูล...';
            
            status.className = 'status loading show';
            status.textContent = \`⏳ กำลังดึงข้อมูล\${typeName} สำหรับวันที่ \${selectedDate}...\`;
            result.classList.remove('show');

            try {
                const response = await fetch(\`\${API_BASE}/api/scrape\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        date: selectedDate,
                        type: lotteryType
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    status.className = 'status success show';
                    status.textContent = \`✅ ดึงข้อมูล\${typeName} สำเร็จสำหรับวันที่ \${selectedDate}!\`;
                    
                    result.classList.add('show');
                    const savedCount = data.saved?.[lotteryType] || 0;
                    const scrapedItems = data.data?.[lotteryType] || [];
                    
                    let resultHTML = \`
                        <h3>ผลลัพธ์การ Scrape \${typeName} <span class="count-badge">\${savedCount} รายการ</span></h3>
                        <div class="result-item">
                            <strong>วันที่:</strong> \${selectedDate}
                        </div>
                    \`;
                    
                    // แสดงข้อมูลที่ scrape มา
                    if (scrapedItems.length > 0) {
                        resultHTML += \`
                            <div class="result-item" style="margin-top: 15px;">
                                <strong>\${typeName} - \${savedCount} รายการ</strong>
                                <table class="data-table" style="margin-top: 10px;">
                                    <thead>
                                        <tr>
                                            <th>วันที่/เวลา (ไทย)</th>
                                            <th>รอบที่</th>
                                            <th>เลขที่ออก</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        \${scrapedItems.map(item => {
                                            // แปลงเป็นเวลาไทย (UTC+7)
                                            // API ส่งวันที่มาในรูปแบบ ISO string
                                            // ต้องตรวจสอบว่าเป็น UTC หรือ local time
                                            const date = new Date(item.roundDate);
                                            
                                            // ตรวจสอบ timezone ของ API
                                            // ถ้า dateString มี Z หรือ +00:00 = UTC
                                            // ถ้าไม่มี = อาจเป็น local time (ต้องตรวจสอบ)
                                            const isUTC = item.roundDate.includes('Z') || 
                                                         item.roundDate.includes('+00:00') ||
                                                         item.roundDate.includes('+0000');
                                            
                                            let thaiDate;
                                            if (isUTC) {
                                                // แปลงจาก UTC เป็นเวลาไทย (UTC+7)
                                                thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
                                            } else {
                                                // ถ้าไม่มี timezone indicator
                                                // สมมติว่าเป็น UTC และแปลงเป็นเวลาไทย
                                                thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
                                            }
                                            
                                            const dateStr = thaiDate.toLocaleString('th-TH', {
                                                timeZone: 'Asia/Bangkok',
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                weekday: 'short'
                                            });
                                            
                                            // แสดงวันในภาษาไทย
                                            const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
                                            const dayIndex = thaiDate.getUTCDay();
                                            const dayName = dayNames[dayIndex];
                                            
                                            return \`
                                                <tr>
                                                    <td>\${dayName} \${dateStr}</td>
                                                    <td>\${item.roundNumber || '-'}</td>
                                                    <td><strong style="font-size: 18px; color: #667eea;">\${item.winNumber || '-'}</strong></td>
                                                    <td>\${item.isJackpot ? '🎯 Jackpot' : '✓'}</td>
                                                </tr>
                                            \`;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        \`;
                    } else {
                        resultHTML += \`
                            <div class="result-item">
                                <strong>\${typeName}</strong>
                                ไม่พบข้อมูลสำหรับวันที่ \${selectedDate}
                            </div>
                        \`;
                    }
                    
                    resultHTML += \`
                        <p style="margin-top: 15px; color: #666; font-size: 14px;">
                            💡 ข้อมูลถูกบันทึกลง Supabase แล้ว สามารถดูข้อมูลได้โดยคลิกปุ่ม "ดูข้อมูล"
                        </p>
                    \`;
                    
                    result.innerHTML = resultHTML;
                } else {
                    throw new Error(data.error || 'เกิดข้อผิดพลาด');
                }
            } catch (error) {
                status.className = 'status error show';
                status.textContent = \`❌ เกิดข้อผิดพลาด: \${error.message}\`;
                
                result.classList.add('show');
                result.innerHTML = \`
                    <h3>❌ เกิดข้อผิดพลาด</h3>
                    <p style="color: #721c24;">\${error.message}</p>
                    <p style="margin-top: 10px; color: #666; font-size: 14px;">
                        💡 ตรวจสอบว่า:
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            <li>Worker ทำงานอยู่</li>
                            <li>Environment variables ตั้งค่าถูกต้อง</li>
                            <li>Supabase table สร้างแล้ว</li>
                        </ul>
                    </p>
                \`;
            } finally {
                btn.disabled = !dateSelect.value;
                scrapeIcon.textContent = '🚀';
                scrapeText.textContent = 'Scrape หวยพัฒนา';
            }
        }

        async function viewResults() {
            const btn = document.getElementById('btnView');
            const status = document.getElementById('status');
            const result = document.getElementById('result');
            const viewIcon = document.getElementById('viewIcon');
            const viewText = document.getElementById('viewText');

            btn.disabled = true;
            viewIcon.innerHTML = '<div class="spinner"></div>';
            viewText.textContent = 'กำลังโหลด...';
            
            status.className = 'status loading show';
            status.textContent = '⏳ กำลังดึงข้อมูลจาก Supabase...';
            result.classList.remove('show');

            try {
                const response = await fetch(\`\${API_BASE}/api/results\`);
                const data = await response.json();

                if (response.ok && data.success) {
                    status.className = 'status success show';
                    status.textContent = \`✅ พบข้อมูล \${data.count} รายการ\`;

                    if (data.data && data.data.length > 0) {
                        const phathana = data.data.filter(item => item.lottery_type === 'phathana');

                        let tableHTML = \`
                            <h3>ข้อมูลผลหวย <span class="count-badge">\${data.count} รายการ</span></h3>
                            
                            <h4 style="margin-top: 20px; margin-bottom: 10px; color: #667eea;">
                                หวยพัฒนา (ຜົນຫວຍພັດທະນາ) - \${phathana.length} รายการ
                            </h4>
                        \`;

                        if (phathana.length > 0) {
                            tableHTML += \`
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>วันที่</th>
                                            <th>รอบที่</th>
                                            <th>เลขที่ออก</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        \${phathana.slice(0, 10).map(item => {
                                            // แปลงเป็นเวลาไทย (UTC+7)
                                            // ข้อมูลจาก Supabase เก็บเป็น UTC (TIMESTAMPTZ)
                                            const date = new Date(item.round_date);
                                            const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
                                            const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
                                            const dayIndex = thaiDate.getUTCDay();
                                            const dayName = dayNames[dayIndex];
                                            const dateStr = thaiDate.toLocaleString('th-TH', {
                                                timeZone: 'Asia/Bangkok',
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                            return \`
                                                <tr>
                                                    <td>\${dayName} \${dateStr}</td>
                                                    <td>\${item.round_number || '-'}</td>
                                                    <td><strong style="font-size: 18px; color: #667eea;">\${item.win_number || '-'}</strong></td>
                                                    <td>\${item.is_jackpot ? '🎯 Jackpot' : '✓'}</td>
                                                </tr>
                                            \`;
                                        }).join('')}
                                    </tbody>
                                </table>
                                \${phathana.length > 10 ? \`<p style="margin-top: 10px; color: #666;">แสดง 10 รายการล่าสุด จากทั้งหมด \${phathana.length} รายการ</p>\` : ''}
                            \`;
                        }

                        result.innerHTML = tableHTML;
                    } else {
                        result.innerHTML = \`
                            <h3>📭 ยังไม่มีข้อมูล</h3>
                            <p style="color: #666; margin-top: 10px;">
                                ยังไม่มีข้อมูลในฐานข้อมูล กรุณาคลิกปุ่ม "Trigger Scrape" เพื่อดึงข้อมูล
                            </p>
                        \`;
                    }

                    result.classList.add('show');
                } else {
                    throw new Error(data.error || 'เกิดข้อผิดพลาด');
                }
            } catch (error) {
                status.className = 'status error show';
                status.textContent = \`❌ เกิดข้อผิดพลาด: \${error.message}\`;
                
                result.classList.add('show');
                result.innerHTML = \`
                    <h3>❌ เกิดข้อผิดพลาด</h3>
                    <p style="color: #721c24;">\${error.message}</p>
                \`;
            } finally {
                btn.disabled = false;
                viewIcon.textContent = '👁️';
                viewText.textContent = 'ดูข้อมูล';
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

/**
 * แปลงวันที่เป็นเวลาไทย (UTC+7)
 * API laodl.com ส่งวันที่มาในรูปแบบ ISO string (อาจเป็น UTC หรือ local time)
 * ต้องแปลงเป็นเวลาไทยเสมอ
 */
function toThaiDate(dateString: string): string {
  // สร้าง Date object จาก string
  const date = new Date(dateString);
  
  // ตรวจสอบว่า dateString มี timezone indicator หรือไม่
  // ถ้ามี Z หรือ +00:00 หรือ +0000 แสดงว่าเป็น UTC
  const isUTC = dateString.includes('Z') || 
                dateString.includes('+00:00') || 
                dateString.includes('+0000') ||
                dateString.match(/\+00:00$/) ||
                dateString.match(/\+0000$/);
  
  if (isUTC) {
    // แปลงจาก UTC เป็นเวลาไทย (UTC+7)
    const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    return thaiDate.toISOString().split('T')[0]; // YYYY-MM-DD
  } else {
    // ถ้าไม่มี timezone indicator อาจเป็น local time
    // แต่เพื่อความปลอดภัย ให้ assume ว่าเป็น UTC และแปลงเป็นเวลาไทย
    // (เพราะ JavaScript Date จะ interpret เป็น local time ถ้าไม่มี timezone)
    // ใช้วิธี: สร้าง Date object แล้วแปลงเป็น UTC ก่อน แล้วค่อยบวก 7 ชั่วโมง
    const utcTime = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const thaiDate = new Date(utcTime + (7 * 60 * 60 * 1000));
    return thaiDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

/**
 * แปลงวันที่เป็นเวลาไทยสำหรับแสดงผล
 */
function formatThaiDateTime(dateString: string): string {
  const date = new Date(dateString);
  // เพิ่ม 7 ชั่วโมงเพื่อแปลงเป็นเวลาไทย
  const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return thaiDate.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  });
}

/**
 * จัดการ GET /api/available-dates - ดึงวันที่ที่มีใน API (สำหรับเลือก scrape)
 */
async function handleGetAvailableDates(env: Env): Promise<Response> {
  const scraper = new LotteryScraper();
  
  try {
    // ดึงข้อมูลผลหวยทั้งสองประเภท
    const allResults = await scraper.getAllResults();
    
    // รวบรวมวันที่ทั้งหมด (unique) - แปลงเป็นเวลาไทย
    const dates = new Set<string>();
    
    if (allResults.phathana) {
      allResults.phathana.forEach(item => {
        const date = toThaiDate(item.roundDate); // แปลงเป็นเวลาไทย
        dates.add(date);
      });
    }
    
    // เรียงวันที่จากใหม่ไปเก่า
    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
    
    return new Response(JSON.stringify({
      success: true,
      dates: sortedDates,
      count: sortedDates.length
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
 * รองรับ parameters: date (YYYY-MM-DD) และ type ('phathana')
 * ถ้าไม่ระบุ type จะ scrape หวยพัฒนา (สำหรับ cron)
 */
async function handleScrape(request: Request, env: Env): Promise<Response> {
  const scraper = new LotteryScraper();
  const db = new DatabaseManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // รับ parameters จาก request body หรือ query string
    const url = new URL(request.url);
    let targetDate: string | null = null;
    let targetType: string | null = null;
    
    // ลองอ่านจาก request body ก่อน (JSON)
    try {
      const bodyJson = await request.json().catch(() => null);
      if (bodyJson && typeof bodyJson === 'object' && bodyJson !== null) {
        const body = bodyJson as { date?: string; type?: string };
        if (body.date) targetDate = body.date;
        if (body.type) targetType = body.type; // 'phathana'
      }
    } catch {
      // ถ้าไม่มี body หรือไม่ใช่ JSON ให้อ่านจาก query string
      targetDate = url.searchParams.get('date');
      targetType = url.searchParams.get('type');
    }
    
    // ดึงข้อมูลผลหวยตาม type ที่ระบุ
    let phathanaResults: any[] | null = null;
    
    if (targetType === 'phathana') {
      phathanaResults = await scraper.getPhathanaResults();
    } else {
      // ไม่ระบุ type = ดึงหวยพัฒนา (สำหรับ cron)
      const allResults = await scraper.getAllResults();
      phathanaResults = allResults.phathana;
    }
    
    // Filter ตามวันที่ถ้ามีการระบุ
    if (targetDate) {
      if (phathanaResults) {
        phathanaResults = phathanaResults.filter(item => {
          const itemDate = toThaiDate(item.roundDate);
          return itemDate === targetDate;
        });
      }
    }
    
    const savedCounts: Record<string, number> = {};
    const scrapedData: {
      phathana: Array<{
        roundDate: string;
        roundNumber?: string;
        winNumber?: string;
        isJackpot?: boolean;
      }>;
    } = {
      phathana: []
    };
    
    // บันทึกข้อมูลหวยพัฒนา
    if (phathanaResults && phathanaResults.length > 0) {
      savedCounts.phathana = await db.saveLotteryResults(phathanaResults, 'phathana');
      // เก็บข้อมูลที่ scrape มาเพื่อแสดงผล
      scrapedData.phathana = phathanaResults.map(item => ({
        roundDate: item.roundDate,
        roundNumber: item.roundNumber,
        winNumber: item.winNumber,
        isJackpot: item.isjackpot
      }));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: targetDate 
        ? `Scraping completed for date: ${targetDate}${targetType ? ` (${targetType})` : ''}` 
        : 'Scraping completed',
      date: targetDate || null,
      type: targetType || null,
      saved: savedCounts,
      data: scrapedData
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
