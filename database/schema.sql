-- ============================================================
--  PCSHS CR Sports Equipment Borrowing System
--  Database Schema for Supabase (PostgreSQL)
--  Version: 1.0.0
--
--  Run order:
--    1. schema.sql  (this file)
--    2. functions.sql
--    3. rls.sql
--    4. seed.sql
-- ============================================================

-- ─────────────────────────────────────────────
--  ENUMERATIONS
-- ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'student',   -- นักเรียน
  'teacher',   -- ครู/เจ้าหน้าที่กีฬา
  'admin'      -- ผู้ดูแลระบบ
);

CREATE TYPE request_status AS ENUM (
  'pending',   -- รออนุมัติ
  'approved',  -- อนุมัติแล้ว (รอรับอุปกรณ์)
  'borrowed',  -- กำลังยืม (รับอุปกรณ์แล้ว)
  'returned',  -- คืนแล้ว
  'overdue',   -- คืนล่าช้า
  'rejected',  -- ถูกปฏิเสธ
  'damaged',   -- อุปกรณ์ชำรุดระหว่างยืม
  'lost'       -- อุปกรณ์สูญหาย
);

CREATE TYPE equipment_status AS ENUM (
  'available',    -- พร้อมให้ยืม
  'borrowed',     -- ถูกยืมหมด
  'damaged',      -- ชำรุด
  'maintenance',  -- อยู่ระหว่างซ่อม
  'retired'       -- ปลดระวาง
);

CREATE TYPE condition_type AS ENUM (
  'good',     -- สภาพดี
  'fair',     -- เสียหายเล็กน้อย
  'damaged',  -- ชำรุด
  'lost'      -- สูญหาย
);

CREATE TYPE damage_status AS ENUM (
  'reported',       -- รายงานแล้ว
  'under_review',   -- อยู่ระหว่างตรวจสอบ
  'repaired',       -- ซ่อมแล้ว
  'written_off'     -- ตัดสต็อก
);

CREATE TYPE notification_type AS ENUM (
  'request_submitted',  -- ส่งคำขอแล้ว
  'request_approved',   -- คำขออนุมัติแล้ว
  'request_rejected',   -- คำขอถูกปฏิเสธ
  'return_reminder',    -- แจ้งเตือนการคืน
  'overdue_alert',      -- แจ้งเตือนเกินกำหนด
  'damage_reported',    -- แจ้งอุปกรณ์ชำรุด
  'system'              -- ข้อความจากระบบ
);

-- ─────────────────────────────────────────────
--  TABLE 1: users
--  Extends Supabase auth.users via UUID reference
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  student_id      TEXT        UNIQUE,          -- รหัสนักเรียน (NULL สำหรับครู/admin)
  classroom       TEXT,                        -- ชั้น/ห้อง เช่น ม.4/1
  role            user_role   NOT NULL DEFAULT 'student',
  phone           TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users IS 'ข้อมูลผู้ใช้งานระบบ เชื่อมกับ Supabase auth';
COMMENT ON COLUMN users.student_id IS 'รหัสประจำตัวนักเรียน 5 หลัก';
COMMENT ON COLUMN users.classroom  IS 'ชั้น/ห้อง เช่น ม.4/1, ม.5/2';

-- ─────────────────────────────────────────────
--  TABLE 2: equipment_categories
-- ─────────────────────────────────────────────
CREATE TABLE equipment_categories (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,  -- ฟุตบอล, บาสเกตบอล, ฯลฯ
  slug        TEXT        NOT NULL UNIQUE,  -- football, basketball
  icon        TEXT,                         -- emoji หรือ icon name
  description TEXT,
  sort_order  INT         NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE equipment_categories IS 'หมวดหมู่อุปกรณ์กีฬา';

-- ─────────────────────────────────────────────
--  TABLE 3: equipment
-- ─────────────────────────────────────────────
CREATE TABLE equipment (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT            NOT NULL,
  category_id         INT             NOT NULL REFERENCES equipment_categories(id) ON DELETE RESTRICT,
  description         TEXT,
  icon                TEXT,           -- emoji เช่น ⚽
  image_url           TEXT,
  total_quantity      INT             NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity  INT             NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  status              equipment_status NOT NULL DEFAULT 'available',
  max_borrow_days     INT             NOT NULL DEFAULT 7,   -- ยืมได้สูงสุดกี่วัน
  max_borrow_quantity INT             NOT NULL DEFAULT 5,   -- ยืมได้ครั้งละกี่ชิ้น
  notes               TEXT,
  is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
  created_by          UUID            REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT available_le_total CHECK (available_quantity <= total_quantity)
);

COMMENT ON TABLE  equipment IS 'ทะเบียนอุปกรณ์กีฬาทั้งหมด';
COMMENT ON COLUMN equipment.max_borrow_days     IS 'จำนวนวันสูงสุดที่ยืมได้ต่อครั้ง';
COMMENT ON COLUMN equipment.max_borrow_quantity IS 'จำนวนชิ้นสูงสุดที่ยืมได้ต่อคำขอ';
COMMENT ON COLUMN equipment.available_quantity  IS 'จำนวนที่ว่างในปัจจุบัน อัปเดตโดย trigger';

-- ─────────────────────────────────────────────
--  TABLE 4: borrow_requests
-- ─────────────────────────────────────────────
CREATE TABLE borrow_requests (
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number        TEXT            NOT NULL UNIQUE,  -- REQ-20260605-0001
  student_id            UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by           UUID            REFERENCES users(id) ON DELETE SET NULL,
  status                request_status  NOT NULL DEFAULT 'pending',
  borrow_date           DATE            NOT NULL,
  expected_return_date  DATE            NOT NULL,
  actual_return_date    DATE,
  purpose               TEXT            NOT NULL,
  rejection_reason      TEXT,           -- เหตุผลปฏิเสธ (ถ้ามี)
  approved_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT return_after_borrow CHECK (expected_return_date >= borrow_date)
);

COMMENT ON TABLE  borrow_requests IS 'คำขอยืมอุปกรณ์กีฬา (1 คำขอ = 1 นักเรียน)';
COMMENT ON COLUMN borrow_requests.request_number IS 'เลขที่คำขอ รูปแบบ REQ-YYYYMMDD-NNNN';
COMMENT ON COLUMN borrow_requests.status         IS 'สถานะปัจจุบันของคำขอ';

-- ─────────────────────────────────────────────
--  TABLE 5: borrow_items
--  1 request สามารถมีหลาย equipment
-- ─────────────────────────────────────────────
CREATE TABLE borrow_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID        NOT NULL REFERENCES borrow_requests(id) ON DELETE CASCADE,
  equipment_id  UUID        NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  quantity      INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, equipment_id)  -- 1 คำขอ มีอุปกรณ์แต่ละชนิดได้ 1 รายการ
);

COMMENT ON TABLE borrow_items IS 'รายการอุปกรณ์แต่ละชนิดในคำขอยืม';

-- ─────────────────────────────────────────────
--  TABLE 6: returns
--  บันทึกการคืนอุปกรณ์แต่ละครั้ง
-- ─────────────────────────────────────────────
CREATE TABLE returns (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID            NOT NULL REFERENCES borrow_requests(id) ON DELETE RESTRICT,
  recorded_by         UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- ครูที่บันทึก
  actual_return_date  DATE            NOT NULL DEFAULT CURRENT_DATE,
  quantity_returned   INT             NOT NULL CHECK (quantity_returned > 0),
  condition           condition_type  NOT NULL DEFAULT 'good',
  notes               TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  returns IS 'บันทึกการรับคืนอุปกรณ์';
COMMENT ON COLUMN returns.recorded_by IS 'ครู/เจ้าหน้าที่ที่รับคืนและบันทึก';
COMMENT ON COLUMN returns.condition   IS 'สภาพอุปกรณ์หลังคืน';

-- ─────────────────────────────────────────────
--  TABLE 7: damage_reports
-- ─────────────────────────────────────────────
CREATE TABLE damage_reports (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id      UUID            NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  return_id         UUID            REFERENCES returns(id) ON DELETE SET NULL,  -- NULL = ชำรุดก่อนคืน
  reported_by       UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  condition         condition_type  NOT NULL,
  description       TEXT            NOT NULL,
  quantity_affected INT             NOT NULL DEFAULT 1 CHECK (quantity_affected > 0),
  status            damage_status   NOT NULL DEFAULT 'reported',
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID            REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  damage_reports IS 'รายงานอุปกรณ์ชำรุด/สูญหาย';
COMMENT ON COLUMN damage_reports.return_id IS 'เชื่อมกับการคืน ถ้าพบชำรุดตอนคืน';

-- ─────────────────────────────────────────────
--  TABLE 8: notifications
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT                NOT NULL,
  message             TEXT                NOT NULL,
  type                notification_type   NOT NULL,
  is_read             BOOLEAN             NOT NULL DEFAULT FALSE,
  related_request_id  UUID                REFERENCES borrow_requests(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notifications IS 'การแจ้งเตือนในระบบ';
COMMENT ON COLUMN notifications.type IS 'ประเภทการแจ้งเตือน';

-- ─────────────────────────────────────────────
--  INDEXES  (เพื่อประสิทธิภาพการค้นหา)
-- ─────────────────────────────────────────────

-- users
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_users_classroom  ON users(classroom)  WHERE classroom IS NOT NULL;

-- equipment
CREATE INDEX idx_equipment_category   ON equipment(category_id);
CREATE INDEX idx_equipment_status     ON equipment(status);
CREATE INDEX idx_equipment_active     ON equipment(is_active) WHERE is_active = TRUE;

-- borrow_requests
CREATE INDEX idx_borrow_requests_student    ON borrow_requests(student_id);
CREATE INDEX idx_borrow_requests_status     ON borrow_requests(status);
CREATE INDEX idx_borrow_requests_borrow_dt  ON borrow_requests(borrow_date);
CREATE INDEX idx_borrow_requests_return_dt  ON borrow_requests(expected_return_date);
CREATE INDEX idx_borrow_requests_created    ON borrow_requests(created_at DESC);

-- borrow_items
CREATE INDEX idx_borrow_items_request   ON borrow_items(request_id);
CREATE INDEX idx_borrow_items_equipment ON borrow_items(equipment_id);

-- returns
CREATE INDEX idx_returns_request    ON returns(request_id);
CREATE INDEX idx_returns_recorded   ON returns(recorded_by);

-- damage_reports
CREATE INDEX idx_damage_equipment ON damage_reports(equipment_id);
CREATE INDEX idx_damage_status    ON damage_reports(status);

-- notifications
CREATE INDEX idx_notif_user     ON notifications(user_id);
CREATE INDEX idx_notif_unread   ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created  ON notifications(created_at DESC);
