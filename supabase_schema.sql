-- สร้างตารางสำหรับเก็บข้อมูลผลหวยใน Supabase (PostgreSQL)
-- รัน SQL นี้ใน Supabase SQL Editor

-- สร้างตาราง lottery_results
CREATE TABLE IF NOT EXISTS lottery_results (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER UNIQUE NOT NULL,
    round_id INTEGER NOT NULL,
    round_date TIMESTAMPTZ NOT NULL,
    round_number TEXT,
    win_number TEXT,
    lot_number INTEGER,
    year_id INTEGER,
    lottery_type TEXT NOT NULL,
    is_close_sale BOOLEAN DEFAULT FALSE,
    round_status INTEGER,
    is_jackpot BOOLEAN DEFAULT FALSE,
    animal_name TEXT, -- ชื่อนามสัตว์ (จาก Sanook)
    phathana_numbers TEXT[], -- หวยลาวพัฒนา 5 ชุด (array ของ 2 หลัก)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_lottery_results_source_id ON lottery_results(source_id);
CREATE INDEX IF NOT EXISTS idx_lottery_results_round_id ON lottery_results(round_id);
CREATE INDEX IF NOT EXISTS idx_lottery_results_round_date ON lottery_results(round_date DESC);
CREATE INDEX IF NOT EXISTS idx_lottery_results_lottery_type ON lottery_results(lottery_type);

-- สร้าง function สำหรับอัพเดท updated_at อัตโนมัติ (ชื่อเฉพาะสำหรับ lottery_results)
CREATE OR REPLACE FUNCTION lottery_results_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger เพื่ออัพเดท updated_at อัตโนมัติเมื่อมีการ UPDATE
CREATE TRIGGER lottery_results_trigger_updated_at
    BEFORE UPDATE ON lottery_results
    FOR EACH ROW
    EXECUTE FUNCTION lottery_results_update_updated_at();

-- ตั้งค่า Row Level Security (RLS) - เปิดใช้งาน
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับอ่านข้อมูล (ทุกคนอ่านได้)
CREATE POLICY "lottery_results_public_read" ON lottery_results
    FOR SELECT
    USING (true);

-- สร้าง policy สำหรับเขียนข้อมูล (ใช้ service role key)
-- หมายเหตุ: ถ้าใช้ service role key จะ bypass RLS อยู่แล้ว
-- แต่ถ้าต้องการให้ anon key เขียนได้ ให้ uncomment policy นี้
-- CREATE POLICY "lottery_results_service_write" ON lottery_results
--     FOR INSERT
--     WITH CHECK (true);
-- 
-- CREATE POLICY "lottery_results_service_update" ON lottery_results
--     FOR UPDATE
--     USING (true);

-- หมายเหตุ:
-- - Service Role Key จะ bypass RLS policy ทั้งหมด (ใช้สำหรับ backend operations)
-- - Anon Key จะต้องผ่าน RLS policy (ใช้สำหรับ client-side)
-- - สำหรับโปรเจกต์นี้ ใช้ Service Role Key ในการเขียนข้อมูล
