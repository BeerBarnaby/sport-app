-- ============================================================
--  PCSHS CR Sports Equipment Borrowing System
--  Functions, Triggers & Stored Procedures
-- ============================================================

-- ─────────────────────────────────────────────
--  TRIGGER: updated_at auto-update
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_borrow_requests_updated_at
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_damage_reports_updated_at
  BEFORE UPDATE ON damage_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
--  FUNCTION: สร้างเลขที่คำขออัตโนมัติ
--  Format: REQ-YYYYMMDD-NNNN
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  today_str  TEXT;
  seq_num    INT;
  req_number TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COUNT(*) + 1
  INTO   seq_num
  FROM   borrow_requests
  WHERE  request_number LIKE 'REQ-' || today_str || '-%';

  req_number := 'REQ-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  NEW.request_number := req_number;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_request_number
  BEFORE INSERT ON borrow_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

-- ─────────────────────────────────────────────
--  FUNCTION: อัปเดต available_quantity ของอุปกรณ์
--  เมื่อ borrow_request เปลี่ยนสถานะ
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_equipment_availability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  item RECORD;
BEGIN
  -- เมื่อเปลี่ยนเป็น 'borrowed' → หักจำนวนว่าง
  IF NEW.status = 'borrowed' AND (OLD.status IS NULL OR OLD.status != 'borrowed') THEN
    FOR item IN SELECT * FROM borrow_items WHERE request_id = NEW.id LOOP
      UPDATE equipment
      SET
        available_quantity = GREATEST(0, available_quantity - item.quantity),
        status = CASE
          WHEN available_quantity - item.quantity <= 0 THEN 'borrowed'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = item.equipment_id;
    END LOOP;
  END IF;

  -- เมื่อเปลี่ยนเป็น 'returned' / 'damaged' / 'lost' → คืนจำนวนว่าง
  IF NEW.status IN ('returned', 'damaged', 'lost')
     AND OLD.status NOT IN ('returned', 'damaged', 'lost') THEN
    FOR item IN SELECT * FROM borrow_items WHERE request_id = NEW.id LOOP
      UPDATE equipment
      SET
        available_quantity = LEAST(total_quantity, available_quantity + item.quantity),
        status = CASE
          WHEN available_quantity + item.quantity >= total_quantity THEN 'available'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = item.equipment_id;
    END LOOP;
  END IF;

  -- เมื่อเปลี่ยนเป็น 'rejected' จาก 'approved' → ไม่ต้องทำอะไร
  -- (approved ยังไม่ได้หักสต็อก)

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_equipment_availability
  AFTER UPDATE OF status ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION update_equipment_availability();

-- ─────────────────────────────────────────────
--  FUNCTION: ตรวจจับ overdue requests อัตโนมัติ
--  ควร run ผ่าน Supabase Edge Function Cron ทุกวัน
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_overdue_requests()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE borrow_requests
  SET
    status     = 'overdue',
    updated_at = NOW()
  WHERE
    status IN ('approved', 'borrowed')
    AND expected_return_date < CURRENT_DATE;

  -- สร้าง notification สำหรับ request ที่เพิ่ง overdue
  INSERT INTO notifications (user_id, title, message, type, related_request_id)
  SELECT
    br.student_id,
    'เกินกำหนดคืนอุปกรณ์',
    'คำขอ ' || br.request_number || ' เกินกำหนดคืนแล้ว กรุณาคืนอุปกรณ์โดยเร็ว',
    'overdue_alert',
    br.id
  FROM borrow_requests br
  WHERE
    br.status = 'overdue'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.related_request_id = br.id
        AND n.type = 'overdue_alert'
        AND n.created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$;

-- ─────────────────────────────────────────────
--  FUNCTION: ตรวจสอบว่าอุปกรณ์ว่างพอยืมหรือไม่
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_id UUID,
  p_quantity     INT
)
RETURNS TABLE(
  is_available  BOOLEAN,
  available_qty INT,
  message       TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  eq equipment%ROWTYPE;
BEGIN
  SELECT * INTO eq FROM equipment WHERE id = p_equipment_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'ไม่พบอุปกรณ์ในระบบ';
    RETURN;
  END IF;

  IF eq.status = 'damaged' OR eq.status = 'maintenance' OR eq.status = 'retired' THEN
    RETURN QUERY SELECT FALSE, eq.available_quantity, 'อุปกรณ์ไม่พร้อมให้บริการ: ' || eq.status::TEXT;
    RETURN;
  END IF;

  IF eq.available_quantity < p_quantity THEN
    RETURN QUERY SELECT FALSE, eq.available_quantity,
      'จำนวนที่ว่างไม่เพียงพอ (ว่าง ' || eq.available_quantity || ' ชิ้น)';
    RETURN;
  END IF;

  IF p_quantity > eq.max_borrow_quantity THEN
    RETURN QUERY SELECT FALSE, eq.available_quantity,
      'เกินจำนวนที่ยืมได้สูงสุดต่อครั้ง (' || eq.max_borrow_quantity || ' ชิ้น)';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, eq.available_quantity, 'พร้อมให้ยืม';
END;
$$;

-- ─────────────────────────────────────────────
--  FUNCTION: สร้าง notification เมื่อสถานะเปลี่ยน
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  student_name TEXT;
  msg_title    TEXT;
  msg_body     TEXT;
  notif_type   notification_type;
BEGIN
  SELECT full_name INTO student_name FROM users WHERE id = NEW.student_id;

  CASE NEW.status
    WHEN 'approved' THEN
      msg_title  := 'คำขอได้รับการอนุมัติ';
      msg_body   := 'คำขอ ' || NEW.request_number || ' ของคุณได้รับการอนุมัติแล้ว กรุณารับอุปกรณ์ภายในวันที่ ' || NEW.borrow_date;
      notif_type := 'request_approved';
    WHEN 'rejected' THEN
      msg_title  := 'คำขอถูกปฏิเสธ';
      msg_body   := 'คำขอ ' || NEW.request_number || ' ถูกปฏิเสธ' ||
                    CASE WHEN NEW.rejection_reason IS NOT NULL THEN ': ' || NEW.rejection_reason ELSE '' END;
      notif_type := 'request_rejected';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO notifications (user_id, title, message, type, related_request_id)
  VALUES (NEW.student_id, msg_title, msg_body, notif_type, NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE OF status ON borrow_requests
  FOR EACH ROW
  WHEN (NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION notify_on_status_change();

-- ─────────────────────────────────────────────
--  FUNCTION: ดึงสถิติ dashboard (สำหรับครู)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total_equipment   BIGINT,
  available_equipment BIGINT,
  active_borrows    BIGINT,
  overdue_count     BIGINT,
  damaged_equipment BIGINT,
  pending_requests  BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)                                            AS total_equipment,
    COUNT(*) FILTER (WHERE status = 'available')       AS available_equipment,
    (SELECT COUNT(*) FROM borrow_requests WHERE status IN ('approved','borrowed')) AS active_borrows,
    (SELECT COUNT(*) FROM borrow_requests WHERE status = 'overdue')               AS overdue_count,
    COUNT(*) FILTER (WHERE status = 'damaged')         AS damaged_equipment,
    (SELECT COUNT(*) FROM borrow_requests WHERE status = 'pending')               AS pending_requests
  FROM equipment
  WHERE is_active = TRUE;
$$;

-- ─────────────────────────────────────────────
--  FUNCTION: ดึงประวัติการยืมของนักเรียน
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_student_borrows(p_student_id UUID)
RETURNS TABLE(
  request_id      UUID,
  request_number  TEXT,
  status          request_status,
  borrow_date     DATE,
  expected_return DATE,
  equipment_names TEXT,
  total_items     BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    br.id,
    br.request_number,
    br.status,
    br.borrow_date,
    br.expected_return_date,
    STRING_AGG(e.name || ' ×' || bi.quantity, ', ' ORDER BY e.name) AS equipment_names,
    SUM(bi.quantity) AS total_items
  FROM borrow_requests br
  JOIN borrow_items bi ON bi.request_id = br.id
  JOIN equipment    e  ON e.id = bi.equipment_id
  WHERE br.student_id = p_student_id
  GROUP BY br.id, br.request_number, br.status, br.borrow_date, br.expected_return_date
  ORDER BY br.created_at DESC;
$$;
