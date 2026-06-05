-- =====================================================================
-- ระบบยืม-คืนอุปกรณ์กีฬา จภ.เชียงราย — Supabase Setup Script
-- รันใน Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. ตาราง students (ข้อมูลนักเรียน)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id          SERIAL       PRIMARY KEY,
  student_id  TEXT         NOT NULL UNIQUE,
  title       TEXT         NOT NULL DEFAULT 'นาย',
  first_name  TEXT         NOT NULL,
  last_name   TEXT         NOT NULL DEFAULT '',
  class_name  TEXT         NOT NULL DEFAULT '',
  class_no    INT          NOT NULL DEFAULT 0,
  role        TEXT         NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. ตาราง equipment (อุปกรณ์กีฬา)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT         NOT NULL,
  cat         TEXT         NOT NULL DEFAULT 'ทั่วไป',
  total       INT          NOT NULL DEFAULT 0,
  avail       INT          NOT NULL DEFAULT 0,
  status      TEXT         NOT NULL DEFAULT 'available',
  icon        TEXT         NOT NULL DEFAULT '⚽',
  description TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. ตาราง borrow_requests (คำขอยืม)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS borrow_requests (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     TEXT         NOT NULL,
  student_name   TEXT         NOT NULL,
  classroom      TEXT         NOT NULL DEFAULT '',
  class_no       INT          NOT NULL DEFAULT 0,
  equipment_id   UUID         NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  equipment_name TEXT         NOT NULL,
  quantity       INT          NOT NULL DEFAULT 1 CHECK (quantity > 0),
  borrow_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  return_date    DATE         NOT NULL,
  purpose        TEXT         NOT NULL DEFAULT '',
  status         TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','active','returned','overdue','rejected')),
  returned_date  DATE,
  condition      TEXT,
  note           TEXT         DEFAULT '',
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. RPC: login_student
--    เรียกผ่าน anon key ได้ — SECURITY DEFINER ใช้สิทธิ owner query students
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION login_student(p_student_id TEXT, p_first_name TEXT)
RETURNS TABLE (
  student_id  TEXT,
  title       TEXT,
  first_name  TEXT,
  last_name   TEXT,
  class_name  TEXT,
  class_no    INT,
  role        TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    student_id,
    title,
    first_name,
    last_name,
    class_name,
    class_no,
    role
  FROM students
  WHERE student_id = p_student_id
    AND first_name = p_first_name
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION login_student(TEXT, TEXT) TO anon;

-- ─────────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

-- students: ห้ามอ่านตรง (ใช้ผ่าน RPC เท่านั้น)
-- ไม่ต้องสร้าง SELECT policy → anon ไม่มีสิทธิ์อ่านโดยตรง

-- equipment: อ่านได้ทุกคน (ไม่ต้อง auth)
CREATE POLICY "equipment_read_all" ON equipment
  FOR SELECT USING (true);

-- borrow_requests: anon insert ได้ (นักเรียนส่งคำขอ)
CREATE POLICY "borrow_requests_insert" ON borrow_requests
  FOR INSERT WITH CHECK (true);

-- borrow_requests: anon อ่านได้ทุก row (frontend filter by student_id เอง)
CREATE POLICY "borrow_requests_select_all" ON borrow_requests
  FOR SELECT USING (true);

-- borrow_requests: anon อัปเดตได้ (สำหรับครูอนุมัติ/บันทึกคืน — ปรับ policy นี้ภายหลังถ้าต้องการ)
CREATE POLICY "borrow_requests_update" ON borrow_requests
  FOR UPDATE USING (true);

-- Grant table access to anon
GRANT SELECT ON equipment TO anon;
GRANT SELECT, INSERT, UPDATE ON borrow_requests TO anon;

-- ─────────────────────────────────────────────────────────────────────
-- 6. ข้อมูลตัวอย่าง — ลบออกได้เมื่อมีข้อมูลจริง
-- ─────────────────────────────────────────────────────────────────────

-- นักเรียนตัวอย่าง (เพิ่มตาม src/data/students.js)
INSERT INTO students (student_id, title, first_name, last_name, class_name, class_no, role)
VALUES
  ('05272', 'นาย', 'ปิยเชษฐ์', '', '', 0, 'student')
ON CONFLICT (student_id) DO NOTHING;

-- อุปกรณ์ตัวอย่าง
INSERT INTO equipment (name, cat, total, avail, status, icon, description) VALUES
  ('ลูกฟุตบอล',          'ฟุตบอล',     10,  8, 'available', '⚽', 'ลูกฟุตบอลมาตรฐาน'),
  ('ลูกบาสเกตบอล',       'บาสเกตบอล',   6,  5, 'available', '🏀', 'ลูกบาสเกตบอล'),
  ('ลูกวอลเลย์บอล',      'วอลเลย์บอล',  8,  6, 'available', '🏐', 'ลูกวอลเลย์บอล'),
  ('แบดมินตัน ชุด',      'แบดมินตัน',  20, 16, 'available', '🏸', 'ไม้แบดมินตัน + ลูกขนไก่'),
  ('ไม้ปิงปอง คู่',      'ปิงปอง',     10,  9, 'available', '🏓', 'ไม้ปิงปองพร้อมลูก'),
  ('ตาข่ายแบดมินตัน',   'แบดมินตัน',   4,  4, 'available', '🥅', 'ตาข่ายสำหรับแบดมินตัน'),
  ('เสื้อกีฬา',          'ทั่วไป',     30, 25, 'available', '👕', 'เสื้อกีฬาสีขาว'),
  ('นกหวีด',             'ทั่วไป',     15, 14, 'available', '🔔', 'นกหวีดพลาสติก'),
  ('กรวยฝึกซ้อม',       'ทั่วไป',     20, 18, 'available', '🔺', 'กรวยพลาสติกสีส้ม'),
  ('สายวัด',             'ทั่วไป',      5,  3, 'available', '📏', 'สายวัดระยะ 50m')
ON CONFLICT DO NOTHING;
