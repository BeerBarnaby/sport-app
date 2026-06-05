import { useState, useEffect } from 'react';
import { useApp }   from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import StatCard     from '../components/StatCard';
import StatusBadge  from '../components/StatusBadge';
import { PRIMARY, ACCENT, SUCCESS, WARNING, DANGER } from '../utils/constants';

const STAT_CFG = [
  { key: 'available', label: 'ว่างให้ยืม', icon: '✅', color: SUCCESS },
  { key: 'borrowing', label: 'กำลังยืม',   icon: '📦', color: PRIMARY },
  { key: 'pending',   label: 'รออนุมัติ',  icon: '⏳', color: WARNING },
  { key: 'overdue',   label: 'คืนล่าช้า',  icon: '⚠️', color: DANGER  },
];

function normalizeReq(r) {
  return {
    id:     r.id,
    name:   r.student_name   ?? '',
    cls:    r.classroom      ?? '',
    eq:     r.equipment_name ?? '',
    qty:    r.quantity       ?? 1,
    status: r.status         ?? 'pending',
  };
}

export default function Dashboard() {
  const { user, setPage } = useApp();
  const isStaff = user?.userType === 'staff';

  const [stats,   setStats]   = useState({ available: 0, borrowing: 0, pending: 0, overdue: 0 });
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      let reqQuery = supabase
        .from('borrow_requests')
        .select('id, student_name, classroom, equipment_name, quantity, status')
        .order('borrow_date', { ascending: false });

      if (!isStaff) {
        reqQuery = reqQuery.eq('student_id', user.studentId);
      }

      const [reqRes, eqRes] = await Promise.all([
        reqQuery,
        supabase.from('equipment').select('avail, available_quantity'),
      ]);
      if (!alive) return;

      if (!reqRes.error) {
        const reqs = (reqRes.data ?? []).map(normalizeReq);
        setRecent(reqs.slice(0, 6));
        setStats(s => ({
          ...s,
          borrowing: reqs.filter(r => ['approved', 'active'].includes(r.status)).length,
          pending:   reqs.filter(r => r.status === 'pending').length,
          overdue:   reqs.filter(r => r.status === 'overdue').length,
        }));
      }
      if (!eqRes.error) {
        const avail = (eqRes.data ?? []).reduce(
          (n, e) => n + (e.avail ?? e.available_quantity ?? 0), 0
        );
        setStats(s => ({ ...s, available: avail }));
      }
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [user?.studentId, isStaff]);

  const greeting = isStaff
    ? (user.displayName || user.username)
    : (user.firstName   || user.fullName);

  const subtitle = isStaff
    ? 'ครูผู้ดูแลระบบ · ระบบยืม-คืนอุปกรณ์กีฬา'
    : `${user.className ? `${user.className} · ` : ''}ระบบยืม-คืนอุปกรณ์กีฬา จภ.เชียงราย`;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-400 text-xs mb-0.5">ยินดีต้อนรับ</p>
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>
          สวัสดี, {greeting}
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {loading
          ? [0, 1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse h-20" />
            ))
          : STAT_CFG.map(cfg => (
              <StatCard
                key={cfg.key}
                label={cfg.label}
                value={stats[cfg.key]}
                icon={cfg.icon}
                color={cfg.color}
              />
            ))
        }
      </div>

      {/* Recent requests */}
      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>
            {isStaff ? 'คำขอล่าสุด (ทั้งหมด)' : 'คำขอล่าสุด'}
          </h2>
          <button
            onClick={() => setPage('requests')}
            className="text-xs font-medium"
            style={{ color: ACCENT }}
          >
            ดูทั้งหมด →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-12 animate-pulse bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
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
