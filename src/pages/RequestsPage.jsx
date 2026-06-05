import { useState }     from 'react';
import { useApp }       from '../context/AppContext';
import StatusBadge      from '../components/StatusBadge';
import ConfirmModal     from '../components/ConfirmModal';
import { PRIMARY }      from '../utils/constants';

const FILTER_TABS = [
  { value: 'all',      label: 'ทั้งหมด'  },
  { value: 'pending',  label: 'รออนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'active',   label: 'กำลังยืม'  },
  { value: 'overdue',  label: 'ล่าช้า'    },
  { value: 'returned', label: 'คืนแล้ว'   },
];

const CONFIRM_CFG = {
  approve: { title: 'ยืนยันการอนุมัติ',  message: 'อนุมัติคำขอยืมนี้ใช่ไหม?',           okLabel: 'อนุมัติ'  },
  reject:  { title: 'ยืนยันการปฏิเสธ',  message: 'ปฏิเสธคำขอยืมนี้ใช่ไหม?',            okLabel: 'ปฏิเสธ', okClass: 'btn-danger' },
  return:  { title: 'บันทึกการคืน',      message: 'ยืนยันว่าได้รับอุปกรณ์คืนครบถ้วนแล้ว?', okLabel: 'ยืนยันคืน' },
};

const STATUS_MAP = { approve: 'approved', reject: 'rejected', return: 'returned' };

export default function RequestsPage() {
  const { requests, user, updateStatus } = useApp();
  const [filter, setFilter]   = useState('all');
  const [confirm, setConfirm] = useState(null);

  const isStaff = user.role === 'teacher' || user.role === 'admin';

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const doConfirm = () => {
    if (!confirm) return;
    updateStatus(confirm.reqId, STATUS_MAP[confirm.action]);
    setConfirm(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>คำขอยืม</h1>
        <p className="text-gray-400 text-xs mt-0.5">รายการคำขอยืมอุปกรณ์ทั้งหมด</p>
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

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">ไม่มีรายการ</p>
        </div>
      ) : (
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
