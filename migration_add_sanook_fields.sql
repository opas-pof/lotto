-- Migration: เพิ่มฟิลด์สำหรับข้อมูลจาก Sanook
-- รัน SQL นี้ใน Supabase SQL Editor เพื่ออัพเดทตารางที่มีอยู่แล้ว

-- เพิ่มฟิลด์ animal_name (ชื่อนามสัตว์)
ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS animal_name TEXT;

-- เพิ่มฟิลด์ phathana_numbers (หวยลาวพัฒนา 5 ชุด)
ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS phathana_numbers TEXT[];

-- เพิ่ม comment เพื่ออธิบายฟิลด์
COMMENT ON COLUMN lottery_results.animal_name IS 'ชื่อนามสัตว์จาก Sanook';
COMMENT ON COLUMN lottery_results.phathana_numbers IS 'หวยลาวพัฒนา 5 ชุด (array ของ 2 หลัก) จาก Sanook';
