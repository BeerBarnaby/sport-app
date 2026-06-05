// ---------------------------------------------------------------------------
// Mock data — swap these arrays with Supabase queries when going to production.
// Shape mirrors the DB schema in /database/schema.sql.
// ---------------------------------------------------------------------------

export const MOCK_EQUIPMENT = [
  { id: 1,  name: 'ลูกฟุตบอล',        cat: 'ฟุตบอล',       total: 10, avail: 7,  status: 'available', icon: '⚽', desc: 'มาตรฐาน เบอร์ 5 ยี่ห้อ Mikasa' },
  { id: 2,  name: 'ลูกบาสเกตบอล',    cat: 'บาสเกตบอล',   total: 6,  avail: 3,  status: 'available', icon: '🏀', desc: 'สำหรับฝึกซ้อม ขนาดเบอร์ 7' },
  { id: 3,  name: 'ลูกวอลเลย์บอล',   cat: 'วอลเลย์บอล',  total: 8,  avail: 8,  status: 'available', icon: '🏐', desc: 'มาตรฐาน ยี่ห้อ Molten' },
  { id: 4,  name: 'ไม้แบดมินตัน',    cat: 'แบดมินตัน',   total: 20, avail: 0,  status: 'borrowed',  icon: '🏸', desc: 'น้ำหนักเบา พร้อมสาย' },
  { id: 5,  name: 'ลูกแบดมินตัน',    cat: 'แบดมินตัน',   total: 30, avail: 20, status: 'available', icon: '🪶', desc: 'ขนนก กล่องละ 12 ลูก' },
  { id: 6,  name: 'กรวยซ้อมกีฬา',    cat: 'ทั่วไป',       total: 20, avail: 15, status: 'available', icon: '🔶', desc: 'พลาสติกสีส้ม สูง 30 ซม.' },
  { id: 7,  name: 'นกหวีด',           cat: 'ทั่วไป',       total: 15, avail: 2,  status: 'available', icon: '📣', desc: 'โลหะ มีสาย สำหรับผู้ตัดสิน' },
  { id: 8,  name: 'เสื้อทีมกีฬา',    cat: 'ทั่วไป',       total: 40, avail: 0,  status: 'damaged',   icon: '👕', desc: 'สีน้ำเงิน-แสด อยู่ระหว่างซ่อม' },
  { id: 9,  name: 'ตาข่ายแบดมินตัน', cat: 'แบดมินตัน',   total: 4,  avail: 3,  status: 'available', icon: '🕸️', desc: 'พร้อมเสา สำหรับสนามแบดมินตัน' },
  { id: 10, name: 'ไม้ปิงปอง',        cat: 'ปิงปอง',       total: 12, avail: 8,  status: 'available', icon: '🏓', desc: 'พร้อมยาง มีหลายรุ่น' },
];

export const MOCK_REQUESTS = [
  { id: 'REQ-001', name: 'นายอภิรักษ์ วงศ์ทอง',      sid: '67001', cls: 'ม.4/1', eq: 'ลูกฟุตบอล',       eqId: 1,  qty: 2, borrow: '2026-06-01', ret: '2026-06-08', purpose: 'ซ้อมฟุตบอลก่อนแข่งขันกีฬาสี',  status: 'active',   retDate: null,         cond: null,   note: '' },
  { id: 'REQ-002', name: 'นางสาวปิยะมาศ สุขสมบูรณ์', sid: '67045', cls: 'ม.5/2', eq: 'ไม้แบดมินตัน',    eqId: 4,  qty: 4, borrow: '2026-05-28', ret: '2026-06-04', purpose: 'ฝึกซ้อมแบดมินตันชมรม',          status: 'overdue',  retDate: null,         cond: null,   note: '' },
  { id: 'REQ-003', name: 'นายธีรพงษ์ มีสุข',          sid: '67023', cls: 'ม.6/1', eq: 'ลูกบาสเกตบอล',   eqId: 2,  qty: 1, borrow: '2026-06-05', ret: '2026-06-12', purpose: 'ฝึกซ้อมบาสเกตบอล',              status: 'pending',  retDate: null,         cond: null,   note: '' },
  { id: 'REQ-004', name: 'นางสาววรรณภา ดีงาม',        sid: '67067', cls: 'ม.4/3', eq: 'ลูกวอลเลย์บอล',  eqId: 3,  qty: 2, borrow: '2026-05-25', ret: '2026-06-01', purpose: 'แข่งขันกีฬาสี',                 status: 'returned', retDate: '2026-06-01', cond: 'good', note: 'คืนครบถ้วน' },
  { id: 'REQ-005', name: 'นายกิตติพงศ์ รุ่งเรือง',    sid: '67089', cls: 'ม.5/3', eq: 'กรวยซ้อมกีฬา',   eqId: 6,  qty: 10,borrow: '2026-06-03', ret: '2026-06-10', purpose: 'ซ้อมกรีฑา',                     status: 'approved', retDate: null,         cond: null,   note: '' },
  { id: 'REQ-006', name: 'นางสาวสุดารัตน์ แก้วใส',   sid: '67102', cls: 'ม.6/2', eq: 'นกหวีด',          eqId: 7,  qty: 2, borrow: '2026-06-04', ret: '2026-06-11', purpose: 'ใช้เป็นผู้ตัดสินกีฬา',         status: 'pending',  retDate: null,         cond: null,   note: '' },
  { id: 'REQ-007', name: 'นายพิพัฒน์ คงสุข',          sid: '67034', cls: 'ม.4/2', eq: 'ไม้ปิงปอง',       eqId: 10, qty: 2, borrow: '2026-05-20', ret: '2026-05-27', purpose: 'เล่นปิงปองช่วงพัก',            status: 'rejected', retDate: null,         cond: null,   note: 'อยู่ระหว่างสอบกลางภาค' },
  { id: 'REQ-008', name: 'นายสุรชัย ทองดี',            sid: '67011', cls: 'ม.6/3', eq: 'ลูกฟุตบอล',       eqId: 1,  qty: 1, borrow: '2026-06-05', ret: '2026-06-09', purpose: 'ฝึกซ้อมสมรรถภาพ',             status: 'pending',  retDate: null,         cond: null,   note: '' },
];

let _counter = MOCK_REQUESTS.length;
export const generateRequestId = () => `REQ-${String(++_counter).padStart(3, '0')}`;
