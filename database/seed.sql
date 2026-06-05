-- ============================================================
--  PCSHS CR Sports Equipment Borrowing System
--  Sample Data (Seed)
--
--  หมายเหตุ: ข้อมูล users ต้องสร้างผ่าน Supabase Auth ก่อน
--  แล้วนำ UUID มาใส่ใน INSERT ด้านล่าง
-- ============================================================

-- ─────────────────────────────────────────────
--  1. equipment_categories
-- ─────────────────────────────────────────────
INSERT INTO equipment_categories (name, slug, icon, description, sort_order) VALUES
  ('ฟุตบอล',      'football',    '⚽', 'อุปกรณ์สำหรับกีฬาฟุตบอล',         1),
  ('บาสเกตบอล',  'basketball',  '🏀', 'อุปกรณ์สำหรับกีฬาบาสเกตบอล',     2),
  ('วอลเลย์บอล', 'volleyball',  '🏐', 'อุปกรณ์สำหรับกีฬาวอลเลย์บอล',    3),
  ('แบดมินตัน',  'badminton',   '🏸', 'อุปกรณ์สำหรับกีฬาแบดมินตัน',     4),
  ('ปิงปอง',     'tabletennis', '🏓', 'อุปกรณ์สำหรับกีฬาปิงปอง',         5),
  ('ทั่วไป',     'general',     '🎽', 'อุปกรณ์กีฬาทั่วไปและอุปกรณ์เสริม', 6);

-- ─────────────────────────────────────────────
--  2. equipment
--  หมายเหตุ: category_id ใช้ตาม SERIAL ที่ insert ด้านบน
-- ─────────────────────────────────────────────
INSERT INTO equipment (name, category_id, description, icon, total_quantity, available_quantity, status, max_borrow_days, max_borrow_quantity) VALUES
  ('ลูกฟุตบอล',       1, 'ลูกฟุตบอลมาตรฐาน เบอร์ 5 ยี่ห้อ Mikasa',              '⚽', 10,  7,  'available', 7,  3),
  ('ลูกบาสเกตบอล',   2, 'ลูกบาสเกตบอลสำหรับฝึกซ้อม ขนาดเบอร์ 7',              '🏀',  6,  3,  'available', 7,  2),
  ('ลูกวอลเลย์บอล',  3, 'ลูกวอลเลย์บอลมาตรฐาน ยี่ห้อ Molten',                  '🏐',  8,  8,  'available', 7,  2),
  ('ไม้แบดมินตัน',   4, 'ไม้แบดมินตันสำหรับฝึกซ้อม น้ำหนักเบา พร้อมสาย',      '🏸', 20,  0,  'borrowed',  7,  4),
  ('ลูกแบดมินตัน',   4, 'ลูกแบดมินตันขนนก กล่องละ 12 ลูก',                      '🪶', 30, 20,  'available', 7, 10),
  ('กรวยซ้อมกีฬา',   6, 'กรวยพลาสติกสีส้ม สูง 30 ซม. สำหรับซ้อมกีฬา',         '🔶', 20, 15,  'available', 7, 20),
  ('นกหวีด',          6, 'นกหวีดโลหะสำหรับผู้ตัดสิน มีสายคล้องคอ',              '📣', 15,  2,  'available', 7,  3),
  ('เสื้อทีมกีฬา',   6, 'เสื้อกีฬาสีน้ำเงิน-แสด ไซส์ S-XL อยู่ระหว่างซ่อม',  '👕', 40,  0,  'damaged',   7, 10),
  ('ตาข่ายแบดมินตัน',4, 'ตาข่ายพร้อมเสา สำหรับสนามแบดมินตัน',                 '🕸️',  4,  3,  'available', 14,  1),
  ('ไม้ปิงปอง',       5, 'ไม้ปิงปองพร้อมยาง มีหลายรุ่นให้เลือก',               '🏓', 12,  8,  'available', 7,  4),
  ('ลูกปิงปอง',       5, 'ลูกปิงปองมาตรฐาน 3 ดาว กล่องละ 6 ลูก',              '⚪', 50, 35,  'available', 7, 20),
  ('เน็ตฟุตบอล',      1, 'เน็ตประตูฟุตบอล ขนาดมาตรฐาน พร้อมเสา',               '⚽',  2,  2,  'available', 14,  1);

-- ─────────────────────────────────────────────
--  3. users (ตัวอย่าง — ต้องสร้างผ่าน auth ก่อน)
--
--  วิธีสร้าง user ใน Supabase:
--  1. ไปที่ Authentication > Users > Add User
--  2. นำ UUID ที่ได้มาใส่ใน INSERT ด้านล่าง
--  หรือ ใช้ trigger `on_auth_user_created` ด้านล่างแทน
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
--  TRIGGER: สร้าง user profile อัตโนมัติหลัง auth signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();

-- ─────────────────────────────────────────────
--  ตัวอย่าง: สร้าง user ด้วย raw SQL (สำหรับ testing เท่านั้น)
--  ในระบบจริง ให้ใช้ Supabase Auth
-- ─────────────────────────────────────────────
/*
-- ตัวอย่าง UUID (สมมติว่ามี auth user อยู่แล้ว)
INSERT INTO users (id, full_name, student_id, classroom, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'นายอภิรักษ์ วงศ์ทอง',      '67001', 'ม.4/1', 'student'),
  ('00000000-0000-0000-0000-000000000002', 'นางสาวปิยะมาศ สุขสมบูรณ์', '67045', 'ม.5/2', 'student'),
  ('00000000-0000-0000-0000-000000000003', 'นายธีรพงษ์ มีสุข',          '67023', 'ม.6/1', 'student'),
  ('00000000-0000-0000-0000-000000000004', 'นางสาววรรณภา ดีงาม',        '67067', 'ม.4/3', 'student'),
  ('00000000-0000-0000-0000-000000000010', 'อ.สมชาย ใจดี',              NULL,    NULL,     'teacher'),
  ('00000000-0000-0000-0000-000000000011', 'อ.สมศรี มีสุข',             NULL,    NULL,     'admin');

-- ตัวอย่างคำขอยืม
INSERT INTO borrow_requests (id, student_id, status, borrow_date, expected_return_date, purpose) VALUES
  ('11111111-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'active', CURRENT_DATE - 3, CURRENT_DATE + 4,
   'ซ้อมฟุตบอลก่อนแข่งขันกีฬาสี');

INSERT INTO borrow_items (request_id, equipment_id, quantity)
SELECT
  '11111111-0000-0000-0000-000000000001',
  id, 2
FROM equipment WHERE name = 'ลูกฟุตบอล';
*/
