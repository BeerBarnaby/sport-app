import { useState, useEffect, useCallback } from 'react';
import { useApp }    from '../context/AppContext';
import { supabase }  from '../lib/supabaseClient';
import StatusBadge   from '../components/StatusBadge';
import ConfirmModal  from '../components/ConfirmModal';
import { PRIMARY }   from '../utils/constants';

const FILTER_TABS = [
  { value: 'all',      label: 'ทั้งหมด'    },
  { value: 'pending',  label: 'รออนุมัติ'  },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'active',   label: 'กำลังยืม'   },
  { value: 'overdue',  label: 'ล่าช้า'     },
  { value: 'returned', label: 'คืนแล้ว'    },
];

const CONFIRM_CFG = {
  approve: { title: 'ยืนยันการอนุมัติ', message: 'อนุมัติคำขอยืมนี้ใช่ไหม?',               okLabel: 'อนุมัติ'   },
  reject:  { title: 'ยืนยันการปฏิเสธ', message: 'ปฏิเสธคำขอยืมนี้ใช่ไหม?',               okLabel: 'ปฏิเสธ',  okClass: 'btn-danger' },
  return:  { title: 'บันทึกการคืน',    message: 'ยืนยันว่าได้รับอุปกรณ์คืนครบถ้วนแล้ว?', okLabel: 'ยืนยันคืน' },
};
const STATUS_MAP = { approve: 'approved', reject: 'rejected', return: 'returned' };

function normalizeRequest(r) {
  return {
    id:      r.id,
    name:    r.student_name   ?? '',
    sid:     r.student_id     ?? '',
    cls:     r.classroom      ?? '',
    eq:      r.equipment_name ?? '',
    eqId:    r.equipment_id,
    qty:     r.quantity       ?? 1,
    borrow:  r.borrow_date    ?? '',
    ret:     r.return_date    ?? '',
    purpose: r.purpose        ?? '',
    status:  r.status         ?? 'pending',
    retDate: r.returned_date  ?? null,
  };
}

export default function RequestsPage() {
  const { user, addToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [confirm,  setConfirm]  = useState(null);

  const isStaff = user.role === 'teacher' || user.role === 'admin';

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('borrow_requests')
      .select('*')
      .eq('student_id', user.studentId)
      .order('borrow_date', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setRequests((data ?? []).map(normalizeRequest));
    }
    setLoading(false);
  }, [user.studentId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const doConfirm = async () => {
    if (!confirm) return;
    const newStatus = STATUS_MAP[confirm.action];
    const updates = { status: newStatus };
    if (newStatus === 'returned') {
      updates.returned_date = new Date().toISOString().split('T')[0];
    }
    const { error: err } = await supabase
      .from('borrow_requests')
      .update(updates)
      .eq('id', confirm.reqId);
    if (!err) {
      setRequests(prev =>
        prev.map(r =>
          r.id === confirm.reqId
            ? { ...r, status: newStatus, retDate: updates.returned_date ?? r.retDate }
            : r
        )
      );
      if (newStatus === 'returned')  addToast?.('บันทึกการคืนอุปกรณ์เรียบร้อย', 'success');
      if (newStatus === 'approved')  addToast?.('อนุมัติคำขอยืมแล้ว', 'success');
      if (newStatus === 'rejected')  addToast?.('ปฏิเสธคำขอยืมแล้ว', 'info');
    }
    setConfirm(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>คำขอยืม</h1>
        <p className="text-gray-400 text-xs mt-0.5">รายการคำขอยืมของฉัน</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-border hover:border-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-800 leading-tight">{req.name}</div>
                  <div className="text-xs text-gray-400">{req.cls} · #{req.id}</div>
                </div>
                <StatusBadge status={req.status} small />
              </div>

              <div className="bg-app-bg rounded-xl p-3 mb-3">
                <div className="text-sm font-medium text-gray-700">{req.eq} × {req.qty}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{req.purpose}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>ยืม {req.borrow}</span>
                <span>กำหนดคืน {req.ret}</span>
              </div>

              {req.retDate && (
                <div className="text-xs text-success mt-1">คืนวันที่ {req.retDate}</div>
              )}

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
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          {...CONFIRM_CFG[confirm.action]}
          onConfirm={doConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
