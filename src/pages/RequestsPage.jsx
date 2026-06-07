import { useState, useEffect, useCallback } from 'react';
import { useApp }    from '../context/AppContext';
import { supabase }  from '../lib/supabaseClient';
import StatusBadge   from '../components/StatusBadge';
import ConfirmModal  from '../components/ConfirmModal';
import { PRIMARY }   from '../utils/constants';
import { formatRequestCode } from '../utils/statusUtils';

const FILTER_TABS = [
  { value: 'all',              label: 'ทั้งหมด'     },
  { value: 'pending',          label: 'รออนุมัติ'   },
  { value: 'approved',         label: 'อนุมัติแล้ว' },
  { value: 'active',           label: 'กำลังยืม'    },
  { value: 'return_requested', label: 'รอตรวจคืน'   },
  { value: 'overdue',          label: 'ล่าช้า'      },
  { value: 'returned',         label: 'คืนแล้ว'     },
];

const CONFIRM_CFG = {
  approve:        { title: 'ยืนยันการอนุมัติ', message: 'อนุมัติคำขอยืมนี้ใช่ไหม?',                   okLabel: 'อนุมัติ'    },
  reject:         { title: 'ยืนยันการปฏิเสธ', message: 'ปฏิเสธคำขอยืมนี้ใช่ไหม?',                   okLabel: 'ปฏิเสธ',   okClass: 'btn-danger' },
  return:         { title: 'บันทึกการคืน',     message: 'ยืนยันว่าได้รับอุปกรณ์คืนครบถ้วนแล้ว?',     okLabel: 'ยืนยันคืน'  },
  confirm_return: { title: 'ยืนยันรับคืน',    message: 'ยืนยันว่าได้รับอุปกรณ์คืนครบถ้วนแล้ว?',     okLabel: 'รับคืนแล้ว' },
};
const STATUS_MAP = {
  approve:        'approved',
  reject:         'rejected',
  return:         'returned',
  confirm_return: 'returned',
};

function normalizeRequest(r) {
  return {
    id:         r.id,
    name:       r.student_name   ?? '',
    sid:        r.student_id     ?? '',
    cls:        r.class_name     ?? '',
    eq:         r.equipment_name ?? '',
    eqId:       r.equipment_id,
    qty:        r.quantity       ?? 1,
    borrow:     r.borrow_date    ?? '',
    ret:        r.expected_return_date ?? '',
    purpose:    r.purpose        ?? '',
    status:     r.status         ?? 'pending',
    retDate:    r.returned_date  ?? null,
    retBy:      r.returned_by    ?? null,
    returnNote: r.return_note    ?? null,
  };
}

export default function RequestsPage() {
  const { user, addToast, setPage } = useApp();
  const isStaff = user?.userType === 'staff';

  const [requests,          setRequests]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [filter,            setFilter]            = useState('all');
  const [confirm,           setConfirm]           = useState(null);
  const [returnNotifyModal, setReturnNotifyModal] = useState(null);
  const [problemModal,      setProblemModal]      = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('borrow_requests')
      .select('*')
      .order('borrow_date', { ascending: false });

    if (!isStaff) {
      query = query.eq('student_id', user.studentId);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
    } else {
      setRequests((data ?? []).map(normalizeRequest));
    }
    setLoading(false);
  }, [user?.studentId, isStaff]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const countFor = (value) =>
    value === 'all' ? requests.length : requests.filter(r => r.status === value).length;

  const today = new Date().toISOString().split('T')[0];

  /* ── Teacher: approve / reject / force-return ── */
  const doConfirm = async () => {
    if (!confirm) return;
    const newStatus = STATUS_MAP[confirm.action];
    const updates = { status: newStatus };

    if (newStatus === 'returned') {
      updates.returned_date = today;
      updates.returned_by   = user?.displayName || user?.username || '';

      const req = requests.find(r => r.id === confirm.reqId);
      if (req?.eqId) {
        const { data: eq } = await supabase
          .from('equipment')
          .select('available_quantity, total_quantity')
          .eq('id', req.eqId)
          .single();
        if (eq) {
          const newAvail = Math.min(eq.available_quantity + req.qty, eq.total_quantity);
          await supabase.from('equipment')
            .update({ available_quantity: newAvail })
            .eq('id', req.eqId);
        }
      }
    }

    const { error: err } = await supabase
      .from('borrow_requests')
      .update(updates)
      .eq('id', confirm.reqId);

    if (!err) {
      setRequests(prev =>
        prev.map(r =>
          r.id === confirm.reqId
            ? { ...r, status: newStatus, retDate: updates.returned_date ?? r.retDate, retBy: updates.returned_by ?? r.retBy }
            : r
        )
      );
      if (newStatus === 'returned')  addToast?.('บันทึกการคืนอุปกรณ์เรียบร้อย', 'success');
      if (newStatus === 'approved')  addToast?.('อนุมัติคำขอยืมแล้ว', 'success');
      if (newStatus === 'rejected')  addToast?.('ปฏิเสธคำขอยืมแล้ว', 'info');
    } else {
      addToast?.('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
    setConfirm(null);
  };

  /* ── Student: notify return ── */
  const doStudentNotify = async () => {
    if (!returnNotifyModal) return;
    const { error: err } = await supabase
      .from('borrow_requests')
      .update({
        status:               'return_requested',
        return_requested_at:  new Date().toISOString(),
        return_note:          returnNotifyModal.note || null,
      })
      .eq('id', returnNotifyModal.reqId);

    if (!err) {
      setRequests(prev =>
        prev.map(r =>
          r.id === returnNotifyModal.reqId
            ? { ...r, status: 'return_requested', returnNote: returnNotifyModal.note || null }
            : r
        )
      );
      addToast?.('แจ้งคืนเรียบร้อย ครูจะตรวจสอบและยืนยันการรับคืน', 'success');
    } else {
      addToast?.('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
    setReturnNotifyModal(null);
  };

  /* ── Teacher: report problem ── */
  const doProblem = async () => {
    if (!problemModal) return;
    const { error: err } = await supabase
      .from('borrow_requests')
      .update({
        status:       problemModal.status,
        return_note:  problemModal.note || null,
        returned_date: today,
        returned_by:  user?.displayName || user?.username || '',
      })
      .eq('id', problemModal.reqId);

    if (!err) {
      setRequests(prev =>
        prev.map(r =>
          r.id === problemModal.reqId
            ? { ...r, status: problemModal.status, returnNote: problemModal.note || null }
            : r
        )
      );
      const label = problemModal.status === 'lost' ? 'สูญหาย' : 'ชำรุด';
      addToast?.(`บันทึกสถานะ "${label}" เรียบร้อย`, 'info');
    } else {
      addToast?.('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
    setProblemModal(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>คำขอยืม</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {isStaff ? 'รายการคำขอยืมทั้งหมด' : 'รายการคำขอยืมของฉัน'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTER_TABS.map(tab => {
          const count  = countFor(tab.value);
          const isZero = tab.value !== 'all' && count === 0;
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1.5 ${
                active
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-border hover:border-primary/40'
              } ${isZero ? 'opacity-50' : ''}`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold rounded-full min-w-[18px] px-1 text-center ${
                  active ? 'bg-white/25' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-16 bg-gray-100 rounded-xl mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-red-600 font-medium mb-1">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button onClick={fetchRequests} className="btn-primary text-sm px-5 py-2">ลองใหม่</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">ไม่มีรายการ</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="card p-4">
              {isStaff ? (
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-800 leading-tight">{req.name}</div>
                    <div className="text-xs text-gray-400">{req.cls} · {formatRequestCode(req.id)}</div>
                  </div>
                  <StatusBadge status={req.status} small />
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={req.status} />
                  <span className="text-xs text-gray-400">{formatRequestCode(req.id)}</span>
                </div>
              )}

              <div className="bg-app-bg rounded-xl p-3 mb-3">
                <div className="text-sm font-medium text-gray-700">{req.eq} × {req.qty}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{req.purpose}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>ยืม {req.borrow}</span>
                <span>กำหนดคืน {req.ret}</span>
              </div>

              {req.retDate && (
                <div className="text-xs text-success mt-1">
                  คืนจริง {req.retDate}{req.retBy ? ` · รับโดย ${req.retBy}` : ''}
                </div>
              )}

              {req.returnNote && (
                <div className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  หมายเหตุ: {req.returnNote}
                </div>
              )}

              {/* ── Student action buttons ── */}
              {!isStaff && ['approved', 'active', 'overdue'].includes(req.status) && (
                <div className="mt-3">
                  <button
                    onClick={() => setReturnNotifyModal({ reqId: req.id, note: '' })}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors"
                    style={{ borderColor: '#EA580C', color: '#9A3412', background: '#FFF7ED' }}
                  >
                    แจ้งคืนอุปกรณ์
                  </button>
                </div>
              )}

              {!isStaff && req.status === 'return_requested' && (
                <div className="mt-3 rounded-xl px-3 py-2.5 text-xs font-medium text-center"
                     style={{ background: '#FFF7ED', color: '#9A3412' }}>
                  แจ้งคืนแล้ว รอครูตรวจสอบและยืนยัน
                </div>
              )}

              {/* ── Teacher action buttons ── */}
              {isStaff && (
                <div className="flex gap-2 mt-3">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setConfirm({ reqId: req.id, action: 'approve' })}
                        className="btn-success-sm flex-1 text-center"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => setConfirm({ reqId: req.id, action: 'reject' })}
                        className="btn-danger-sm flex-1 text-center"
                      >
                        ปฏิเสธ
                      </button>
                    </>
                  )}

                  {['approved', 'active', 'overdue'].includes(req.status) && (
                    <button
                      onClick={() => setConfirm({ reqId: req.id, action: 'return' })}
                      className="btn-ghost-sm flex-1 text-center"
                    >
                      บันทึกคืน
                    </button>
                  )}

                  {req.status === 'return_requested' && (
                    <>
                      <button
                        onClick={() => setConfirm({ reqId: req.id, eqId: req.eqId, qty: req.qty, action: 'confirm_return' })}
                        className="btn-success-sm flex-1 text-center"
                      >
                        รับคืนแล้ว
                      </button>
                      <button
                        onClick={() => setProblemModal({ reqId: req.id, status: 'damaged', note: '' })}
                        className="btn-danger-sm flex-1 text-center"
                      >
                        พบปัญหา
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper footer when the list is short — fills empty space with a useful nudge */}
      {!isStaff && !loading && !error && filtered.length > 0 && filtered.length <= 3 && (
        <div className="card p-4 mt-3 text-center">
          <p className="text-sm text-gray-500">ไม่มีคำขออื่นในขณะนี้</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">ต้องการยืมอุปกรณ์เพิ่มไหม?</p>
          <button onClick={() => setPage('equipment')} className="btn-outline text-sm px-5 py-2">
            ไปหน้าอุปกรณ์
          </button>
        </div>
      )}

      {/* ── Teacher: approve / reject / force-return confirm modal ── */}
      {confirm && (
        <ConfirmModal
          {...CONFIRM_CFG[confirm.action]}
          onConfirm={doConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Student: แจ้งคืน modal ── */}
      {returnNotifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm" style={{ color: PRIMARY }}>แจ้งคืนอุปกรณ์</h3>
              <button
                onClick={() => setReturnNotifyModal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              ต้องการแจ้งคืนอุปกรณ์นี้ใช่หรือไม่?<br />
              <span className="text-gray-400">ครูจะตรวจรับคืนอีกครั้งและยืนยันการรับคืน</span>
            </p>
            <div className="mb-4">
              <label className="form-label">
                หมายเหตุ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="เช่น อุปกรณ์อยู่ในสภาพดี หรือมีรอยเล็กน้อย..."
                value={returnNotifyModal.note}
                onChange={e => setReturnNotifyModal(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReturnNotifyModal(null)} className="btn-outline flex-1">
                ยกเลิก
              </button>
              <button onClick={doStudentNotify} className="btn-primary flex-1">
                แจ้งคืน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher: พบปัญหา modal ── */}
      {problemModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-red-700">รายงานปัญหาอุปกรณ์</h3>
              <button
                onClick={() => setProblemModal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <label className="form-label">สถานะอุปกรณ์</label>
              <div className="flex gap-2">
                {[{ v: 'damaged', l: '🔧 ชำรุด' }, { v: 'lost', l: '❌ สูญหาย' }].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setProblemModal(p => ({ ...p, status: v }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors"
                    style={
                      problemModal.status === v
                        ? { background: '#FEF2F2', color: '#991B1B', borderColor: '#FCA5A5' }
                        : { color: '#6b7280', borderColor: '#e5e7eb', background: 'white' }
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">
                รายละเอียดปัญหา <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="ระบุรายละเอียดปัญหาของอุปกรณ์..."
                value={problemModal.note}
                onChange={e => setProblemModal(p => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setProblemModal(null)} className="btn-outline flex-1">
                ยกเลิก
              </button>
              <button
                onClick={doProblem}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#DC2626' }}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
