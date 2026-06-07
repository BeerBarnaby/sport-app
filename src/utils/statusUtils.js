export const STATUS_CFG = {
  available:        { label: 'พร้อมให้ยืม',  bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  borrowed:         { label: 'ถูกยืมหมด',    bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  damaged:          { label: 'ชำรุด',         bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  pending:          { label: 'รออนุมัติ',     bg: '#FEFCE8', color: '#854D0E', dot: '#EAB308' },
  approved:         { label: 'อนุมัติแล้ว',  bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  active:           { label: 'กำลังยืม',     bg: '#F1F5F9', color: '#1E293B', dot: '#64748B' },
  return_requested: { label: 'รอตรวจรับคืน', bg: '#FFF7ED', color: '#9A3412', dot: '#EA580C' },
  returned:         { label: 'คืนแล้ว',      bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  overdue:          { label: 'คืนล่าช้า',    bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  rejected:         { label: 'ถูกปฏิเสธ',   bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
  lost:             { label: 'สูญหาย',       bg: '#FEF2F2', color: '#7F1D1D', dot: '#DC2626' },
};

export const getStatusConfig = (status) =>
  STATUS_CFG[status] ?? { label: status, bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' };

export const ACTIVE_REQUEST_STATUSES = ['approved', 'active', 'overdue', 'return_requested'];
export const CLOSED_REQUEST_STATUSES = ['returned', 'rejected', 'lost', 'damaged'];

/* Short, human-readable code for a request — hides the raw UUID from the UI */
export const formatRequestCode = (id) =>
  `REQ-${String(id ?? '').replaceAll('-', '').slice(0, 6).toUpperCase()}`;
