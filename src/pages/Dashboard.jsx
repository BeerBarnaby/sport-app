import { useApp }       from '../context/AppContext';
import StatCard        from '../components/StatCard';
import StatusBadge     from '../components/StatusBadge';
import { PRIMARY, ACCENT, SUCCESS, WARNING, DANGER } from '../utils/constants';

const STAT_CFG = [
  { key: 'available', label: 'ว่างให้ยืม',  icon: '✅', color: SUCCESS  },
  { key: 'borrowing', label: 'กำลังยืม',    icon: '📦', color: PRIMARY  },
  { key: 'pending',   label: 'รออนุมัติ',   icon: '⏳', color: WARNING  },
  { key: 'overdue',   label: 'คืนล่าช้า',   icon: '⚠️', color: DANGER   },
];

export default function Dashboard() {
  const { stats, requests, setPage } = useApp();
  const recent = requests.slice(0, 6);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>ภาพรวมระบบ</h1>
        <p className="text-gray-400 text-xs mt-0.5">ระบบยืม-คืนอุปกรณ์กีฬา จภ.เชียงราย</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {STAT_CFG.map(cfg => (
          <StatCard
            key={cfg.key}
            label={cfg.label}
            value={stats[cfg.key]}
            icon={cfg.icon}
            color={cfg.color}
          />
        ))}
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>คำขอล่าสุด</h2>
          <button
            onClick={() => setPage('requests')}
            className="text-xs font-medium"
            style={{ color: ACCENT }}
          >
            ดูทั้งหมด →
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm">ยังไม่มีคำขอ</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map(req => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{req.name}</div>
                  <div className="text-xs text-gray-400">{req.eq} × {req.qty} · {req.cls}</div>
                </div>
                <StatusBadge status={req.status} small />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
