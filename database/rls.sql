-- ============================================================
--  PCSHS CR Sports Equipment Borrowing System
--  Row Level Security (RLS) Policies
--
--  หลักการ:
--  - student: อ่านอุปกรณ์ได้ทั้งหมด, จัดการคำขอตัวเองเท่านั้น
--  - teacher: อ่าน/อนุมัติ/บันทึกคืนได้ทั้งหมด, จัดการอุปกรณ์
--  - admin:   สิทธิ์เต็ม รวมถึงจัดการ user
-- ============================================================

-- เปิด RLS ทุกตาราง
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment          ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- Helper function: ดึง role ของ user ปัจจุบัน
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────
--  users
-- ─────────────────────────────────────────────
-- ทุก role อ่าน profile ตัวเองได้
CREATE POLICY "users: read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- admin/teacher อ่าน profile ทุกคนได้
CREATE POLICY "users: teacher/admin read all"
  ON users FOR SELECT
  USING (current_user_role() IN ('teacher', 'admin'));

-- user อัปเดต profile ตัวเองได้ (ยกเว้น role)
CREATE POLICY "users: update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- admin จัดการ user ได้ทั้งหมด
CREATE POLICY "users: admin full access"
  ON users FOR ALL
  USING (current_user_role() = 'admin');

-- ─────────────────────────────────────────────
--  equipment_categories
-- ─────────────────────────────────────────────
CREATE POLICY "categories: everyone can read"
  ON equipment_categories FOR SELECT
  USING (TRUE);

CREATE POLICY "categories: teacher/admin can manage"
  ON equipment_categories FOR ALL
  USING (current_user_role() IN ('teacher', 'admin'));

-- ─────────────────────────────────────────────
--  equipment
-- ─────────────────────────────────────────────
CREATE POLICY "equipment: everyone can read active"
  ON equipment FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "equipment: admin/teacher can read all"
  ON equipment FOR SELECT
  USING (current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "equipment: teacher/admin can manage"
  ON equipment FOR ALL
  USING (current_user_role() IN ('teacher', 'admin'));

-- ─────────────────────────────────────────────
--  borrow_requests
-- ─────────────────────────────────────────────
-- student อ่านคำขอตัวเองเท่านั้น
CREATE POLICY "requests: student reads own"
  ON borrow_requests FOR SELECT
  USING (student_id = auth.uid());

-- student สร้างคำขอได้
CREATE POLICY "requests: student can insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (student_id = auth.uid() AND current_user_role() = 'student');

-- teacher/admin อ่านได้ทั้งหมด
CREATE POLICY "requests: teacher/admin read all"
  ON borrow_requests FOR SELECT
  USING (current_user_role() IN ('teacher', 'admin'));

-- teacher/admin อัปเดตสถานะได้
CREATE POLICY "requests: teacher/admin can update"
  ON borrow_requests FOR UPDATE
  USING (current_user_role() IN ('teacher', 'admin'));

-- admin ลบได้
CREATE POLICY "requests: admin can delete"
  ON borrow_requests FOR DELETE
  USING (current_user_role() = 'admin');

-- ─────────────────────────────────────────────
--  borrow_items
-- ─────────────────────────────────────────────
-- student อ่านรายการในคำขอตัวเองได้
CREATE POLICY "borrow_items: student reads own"
  ON borrow_items FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM borrow_requests WHERE student_id = auth.uid()
    )
  );

-- student เพิ่มรายการในคำขอตัวเองได้ (เฉพาะสถานะ pending)
CREATE POLICY "borrow_items: student can insert"
  ON borrow_items FOR INSERT
  WITH CHECK (
    request_id IN (
      SELECT id FROM borrow_requests WHERE student_id = auth.uid() AND status = 'pending'
    )
  );

-- teacher/admin จัดการได้ทั้งหมด
CREATE POLICY "borrow_items: teacher/admin full access"
  ON borrow_items FOR ALL
  USING (current_user_role() IN ('teacher', 'admin'));

-- ─────────────────────────────────────────────
--  returns
-- ─────────────────────────────────────────────
-- student อ่านการคืนในคำขอตัวเองได้
CREATE POLICY "returns: student reads own"
  ON returns FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM borrow_requests WHERE student_id = auth.uid()
    )
  );

-- teacher/admin จัดการได้ทั้งหมด
CREATE POLICY "returns: teacher/admin full access"
  ON returns FOR ALL
  USING (current_user_role() IN ('teacher', 'admin'));

-- ─────────────────────────────────────────────
--  damage_reports
-- ─────────────────────────────────────────────
CREATE POLICY "damage: teacher/admin full access"
  ON damage_reports FOR ALL
  USING (current_user_role() IN ('teacher', 'admin'));

CREATE POLICY "damage: student reads related to own borrow"
  ON damage_reports FOR SELECT
  USING (
    return_id IN (
      SELECT r.id FROM returns r
      JOIN borrow_requests br ON br.id = r.request_id
      WHERE br.student_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
--  notifications
-- ─────────────────────────────────────────────
-- แต่ละ user เห็นเฉพาะ notification ของตัวเอง
CREATE POLICY "notifications: read own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: update own (mark as read)"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- system สามารถ insert notification ได้ผ่าน service role
CREATE POLICY "notifications: service role insert"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);  -- จำกัดด้วย service_role key ใน Supabase Dashboard
