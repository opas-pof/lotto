/**
 * Scraper สำหรับดึงข้อมูลผลหวยจาก Sanook
 * https://www.sanook.com/news/laolotto/
 */

export interface SanookLotteryResult {
  date: string; // วันที่ในรูปแบบ YYYY-MM-DD
  animalName: string; // ชื่อนามสัตว์
  phathanaNumbers: string[]; // หวยลาวพัฒนา 5 ชุด (แต่ละชุดเป็น 2 หลัก)
  phathanaNumbersRaw: string; // หวยลาวพัฒนา 10 หลัก (เก็บไว้สำหรับ reference)
}

export class SanookScraper {
  private readonly BASE_URL = "https://www.sanook.com/news/laolotto/";
  
  /**
   * แปลงวันที่ไทยเป็น YYYY-MM-DD
   * เช่น "26 มกราคม 2569" -> "2026-01-26"
   */
  private parseThaiDate(dateStr: string): string | null {
    try {
      const monthMap: Record<string, string> = {
        'มกราคม': '01',
        'กุมภาพันธ์': '02',
        'มีนาคม': '03',
        'เมษายน': '04',
        'พฤษภาคม': '05',
        'มิถุนายน': '06',
        'กรกฎาคม': '07',
        'สิงหาคม': '08',
        'กันยายน': '09',
        'ตุลาคม': '10',
        'พฤศจิกายน': '11',
        'ธันวาคม': '12'
      };
      
      // ตัวอย่าง: "26 มกราคม 2569" หรือ "ตรวจหวยลาว งวดประจำวันที่ 23 มกราคม 2569"
      const match = dateStr.match(/(\d{1,2})\s+([ก-๙]+)\s+(\d{4})/);
      if (!match) return null;
      
      const day = match[1].padStart(2, '0');
      const month = monthMap[match[2]];
      const year = parseInt(match[3]) - 543; // แปลง พ.ศ. เป็น ค.ศ.
      
      if (!month) return null;
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing Thai date:', error);
      return null;
    }
  }
  
  /**
   * แปลงหวยลาวพัฒนา 10 หลักเป็น 5 ชุด 2 หลัก
   * เช่น "0744170426" -> ["07", "44", "17", "04", "26"]
   */
  private parsePhathanaNumbers(raw: string): string[] {
    if (!raw || raw.length !== 10) {
      return [];
    }
    
    const numbers: string[] = [];
    for (let i = 0; i < 10; i += 2) {
      numbers.push(raw.substring(i, i + 2));
    }
    
    return numbers;
  }
  
  /**
   * ดึงข้อมูลจาก HTML
   * @returns Object ที่มี results และ debugLogs
   */
  async scrapeResults(): Promise<{ results: SanookLotteryResult[]; debugLogs: string[] }> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const results: SanookLotteryResult[] = [];
      const debugLogs: string[] = [];
      
      // Debug: ตรวจสอบว่า HTML มีข้อมูลหรือไม่
      const hasHistorySection = html.includes('ตรวจหวยลาวย้อนหลัง');
      const hasPhathana = html.includes('หวยลาวพัฒนา');
      const log1 = `HTML length: ${html.length}, hasHistorySection: ${hasHistorySection}, hasPhathana: ${hasPhathana}`;
      console.log(log1);
      debugLogs.push(log1);
      
      // Parse HTML - หา section "ตรวจหวยลาวย้อนหลัง"
      // Pattern สำหรับหาแต่ละงวด: "ตรวจหวยลาว งวดประจำวันที่23 มกราคม2569" (ไม่มี space บางจุด)
      // จาก HTML จริง: "## [ตรวจหวยลาว งวดประจำวันที่23 มกราคม2569**]"
      // ใช้ pattern ที่ยืดหยุ่นกว่า: "งวดประจำวันที่" ตามด้วยตัวเลข (อาจมีหรือไม่มี space)
      // Pattern: "งวดประจำวันที่" + ตัวเลข + ชื่อเดือน + ปี (อาจไม่มี space, อาจมี HTML tag)
      const drawPattern = /งวดประจำวันที่\s*(\d{1,2})\s*([ก-๙]+)\s*(\d{4})/g;
      const draws: Array<{ date: string; index: number }> = [];
      
      let match;
      while ((match = drawPattern.exec(html)) !== null) {
        // รวมวันที่เป็น string เดียว: "23 มกราคม 2569"
        const dateStr = `${match[1]} ${match[2]} ${match[3]}`;
        draws.push({
          date: dateStr,
          index: match.index
        });
      }
      
      const log2 = `พบงวดทั้งหมด: ${draws.length} งวด`;
      console.log(log2);
      debugLogs.push(log2);
      
      // สำหรับแต่ละงวด ดึงข้อมูล
      for (let i = 0; i < draws.length; i++) {
        const startIndex = draws[i].index;
        const endIndex = i < draws.length - 1 ? draws[i + 1].index : html.length;
        // เพิ่ม section length เป็น 3000 เพื่อให้ครอบคลุมข้อมูลทั้งหมด
        const section = html.substring(startIndex, Math.min(startIndex + 3000, endIndex));
        
        // Debug: ดู section preview
        const sectionRaw = section.substring(0, Math.min(500, section.length))
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        
        const logSection = `[งวด ${i + 1}: ${draws[i].date}]\n` +
          `  Section length: ${section.length}\n` +
          `  Preview (first 500 chars): ${sectionRaw}...`;
        debugLogs.push(logSection);
        
        // วิธีใหม่: หา JSON data ที่ฝังอยู่ใน HTML
        // Pattern: "animalName":"xxx" และ "devNumberSet":{"type":"json","json":["xx","xx","xx","xx","xx"]}
        let animalName = '';
        let phathanaNumbers: string[] = [];
        let phathanaRaw = '';
        
        // หา animalName จาก JSON
        const animalNameMatch = section.match(/"animalName"\s*:\s*"([^"]+)"/);
        if (animalNameMatch && animalNameMatch[1]) {
          animalName = animalNameMatch[1].trim();
          debugLogs.push(`✅ พบ animalName: ${animalName}`);
        } else {
          debugLogs.push(`⚠️ ไม่พบ "animalName" ใน section`);
        }
        
        // หา devNumberSet จาก JSON
        const devNumberSetMatch = section.match(/"devNumberSet"\s*:\s*\{\s*"type"\s*:\s*"json"\s*,\s*"json"\s*:\s*\[([^\]]+)\]/);
        if (devNumberSetMatch && devNumberSetMatch[1]) {
          // Parse array: ["07","44","17","04","26"]
          const numbersStr = devNumberSetMatch[1];
          const numbersMatch = numbersStr.match(/"(\d{2})"/g);
          if (numbersMatch && numbersMatch.length === 5) {
            phathanaNumbers = numbersMatch.map(m => m.replace(/"/g, ''));
            phathanaRaw = phathanaNumbers.join('');
            debugLogs.push(`✅ พบ devNumberSet: ${phathanaNumbers.join(' ')} (raw: ${phathanaRaw})`);
          } else {
            debugLogs.push(`⚠️ พบ devNumberSet แต่ parse ไม่ได้: ${numbersStr}`);
          }
        } else {
          debugLogs.push(`⚠️ ไม่พบ "devNumberSet" ใน section`);
          
          // Fallback: ลองหา pattern อื่นๆ
          // Pattern: "devNumberSet":{...} (อาจมีรูปแบบอื่น)
          const devNumberSetAltMatch = section.match(/"devNumberSet"\s*:\s*\{[^}]*"json"\s*:\s*\[([^\]]+)\]/);
          if (devNumberSetAltMatch && devNumberSetAltMatch[1]) {
            const numbersStr = devNumberSetAltMatch[1];
            const numbersMatch = numbersStr.match(/"(\d{2})"/g);
            if (numbersMatch && numbersMatch.length === 5) {
              phathanaNumbers = numbersMatch.map(m => m.replace(/"/g, ''));
              phathanaRaw = phathanaNumbers.join('');
              debugLogs.push(`✅ พบ devNumberSet (alternative pattern): ${phathanaNumbers.join(' ')} (raw: ${phathanaRaw})`);
            }
          }
        }
        
        // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
        if (phathanaRaw && phathanaRaw.length === 10 && phathanaNumbers.length === 5) {
          const date = this.parseThaiDate(draws[i].date);
          if (date) {
            const log5 = `✅ พบข้อมูลงวด: ${date}, หวยลาวพัฒนา: ${phathanaNumbers.join(' ')}, ชื่อนามสัตว์: ${animalName || '(ไม่มี)'}`;
            console.log(log5);
            debugLogs.push(log5);
            results.push({
              date,
              animalName: animalName || '',
              phathanaNumbers: phathanaNumbers, // ใช้ข้อมูลจาก JSON โดยตรง
              phathanaNumbersRaw: phathanaRaw
            });
          } else {
            const log6 = `⚠️ ไม่สามารถ parse วันที่: ${draws[i].date}`;
            console.warn(log6);
            debugLogs.push(log6);
          }
        } else {
          const log7 = `⚠️ ไม่พบข้อมูลครบถ้วนในงวด: ${draws[i].date}\n` +
            `  phathanaRaw: ${phathanaRaw || '(ไม่พบ)'}, length: ${phathanaRaw ? phathanaRaw.length : 0}\n` +
            `  phathanaNumbers: ${phathanaNumbers.length > 0 ? phathanaNumbers.join(' ') : '(ไม่พบ)'}\n` +
            `  animalName: ${animalName || '(ไม่พบ)'}`;
          console.warn(log7);
          debugLogs.push(log7);
        }
      }
      
      const log8 = `ดึงข้อมูลสำเร็จ: ${results.length} งวด`;
      console.log(log8);
      debugLogs.push(log8);
      
      // ดึงข้อมูลงวดปัจจุบัน (ถ้ามี)
      // Pattern: "ตรวจหวยลาว26 มกราคม2569" (อาจไม่มี space)
      const currentDrawMatch = html.match(/ตรวจหวยลาว\s*(\d{1,2})\s+([ก-๙]+)\s*(\d{4})/);
      if (currentDrawMatch) {
        const dateStr = `${currentDrawMatch[1]} ${currentDrawMatch[2]} ${currentDrawMatch[3]}`;
        const currentDate = this.parseThaiDate(dateStr);
        if (currentDate) {
          // ตรวจสอบว่ามีข้อมูลแล้วหรือยัง
          const exists = results.find(r => r.date === currentDate);
          if (!exists) {
            // หาข้อมูลงวดปัจจุบัน (ก่อน section "ตรวจหวยลาวย้อนหลัง")
            const historyIndex = html.indexOf('ตรวจหวยลาวย้อนหลัง');
            const currentSection = historyIndex > 0 ? html.substring(0, historyIndex) : html;
            
            // ดึงข้อมูลจาก JSON (วิธีเดียวกับที่ใช้ในลูปหลัก)
            let currentAnimalName = '';
            let currentPhathanaNumbers: string[] = [];
            let currentPhathanaRaw = '';
            
            // หา animalName จาก JSON
            const currentAnimalNameMatch = currentSection.match(/"animalName"\s*:\s*"([^"]+)"/);
            if (currentAnimalNameMatch && currentAnimalNameMatch[1]) {
              currentAnimalName = currentAnimalNameMatch[1].trim();
            }
            
            // หา devNumberSet จาก JSON
            const currentDevNumberSetMatch = currentSection.match(/"devNumberSet"\s*:\s*\{\s*"type"\s*:\s*"json"\s*,\s*"json"\s*:\s*\[([^\]]+)\]/);
            if (currentDevNumberSetMatch && currentDevNumberSetMatch[1]) {
              const numbersStr = currentDevNumberSetMatch[1];
              const numbersMatch = numbersStr.match(/"(\d{2})"/g);
              if (numbersMatch && numbersMatch.length === 5) {
                currentPhathanaNumbers = numbersMatch.map(m => m.replace(/"/g, ''));
                currentPhathanaRaw = currentPhathanaNumbers.join('');
              }
            }
            
            // ถ้ามีข้อมูล (ไม่ใช่ placeholder xxx หรือ xx)
            if (currentPhathanaRaw && currentPhathanaRaw.length === 10 && 
                currentPhathanaNumbers.length === 5 && 
                !currentPhathanaRaw.match(/^x+$/i)) {
              const log9 = `✅ พบข้อมูลงวดปัจจุบัน: ${currentDate}, หวยลาวพัฒนา: ${currentPhathanaNumbers.join(' ')}, ชื่อนามสัตว์: ${currentAnimalName || '(ไม่มี)'}`;
              console.log(log9);
              debugLogs.push(log9);
              results.push({
                date: currentDate,
                animalName: currentAnimalName && !currentAnimalName.match(/^x+$/i) ? currentAnimalName : '',
                phathanaNumbers: currentPhathanaNumbers,
                phathanaNumbersRaw: currentPhathanaRaw
              });
            }
          }
        }
      }
      
      return { results, debugLogs };
    } catch (error) {
      const errorMsg = `Error scraping Sanook: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      return { results: [], debugLogs: [`❌ ${errorMsg}`] };
    }
  }
  
  /**
   * ดึงข้อมูลเฉพาะงวดล่าสุด (5 งวด)
   */
  async getLatestResults(limit: number = 5): Promise<{ results: SanookLotteryResult[]; debugLogs: string[] }> {
    const { results, debugLogs } = await this.scrapeResults();
    
    // เรียงตามวันที่จากใหม่ไปเก่า
    results.sort((a, b) => b.date.localeCompare(a.date));
    
    // เอาแค่ limit งวดล่าสุด
    return { results: results.slice(0, limit), debugLogs };
  }
}
