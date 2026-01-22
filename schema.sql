-- สร้างตารางสำหรับเก็บข้อมูลผลหวย
CREATE TABLE IF NOT EXISTS lottery_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER UNIQUE NOT NULL,
    round_id INTEGER NOT NULL,
    round_date TEXT NOT NULL,
    round_number TEXT,
    win_number TEXT,
    lot_number INTEGER,
    year_id INTEGER,
    lottery_type TEXT NOT NULL,
    is_close_sale INTEGER DEFAULT 0,
    round_status INTEGER,
    is_jackpot INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_source_id ON lottery_results(source_id);
CREATE INDEX IF NOT EXISTS idx_round_id ON lottery_results(round_id);
CREATE INDEX IF NOT EXISTS idx_round_date ON lottery_results(round_date);
CREATE INDEX IF NOT EXISTS idx_lottery_type ON lottery_results(lottery_type);
