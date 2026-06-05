import { useState, useEffect } from 'react';
import { useApp }   from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import StatusBadge  from '../components/StatusBadge';
import { Package, ClipboardList, AlertTriangle, Clock } from 'lucide-react';
import { PRIMARY, ACCENT, SUCCESS, WARNING, DANGER } from '../utils/constants';

function normalizeReq(r) {
  return {
    id:     r.id,
    name:   r.student_name   ?? '',
    cls:    r.class_name     ?? '',
    eq:     r.equipment_name ?? '',
    qty:    r.quantity       ?? 1,
    status: r.status         ?? 'pending',
    ret:    r.expected_return_date ?? '',
  };
}

/* ── Shared stat card ── */
function StatTile({ label, value, Icon, color, loading }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        {loading
          ? <div className="h-6 w-10 bg-slate-200 animate-pulse rounded mb-1" />
          : <div className="text-xl font-bold" style={{ color }}>{value}</div>}
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

/* ── Request row used in both views ── */
function ReqRow({ req }) {
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{req.name}</div>
        <div className="text-xs text-slate-400 truncate">{req.eq} × {req.qty}{req.cls ? ` · ${req.cls}` : ''}</div>
      </div>
      <StatusBadge status={req.status} small />
    </div>
  );
}

/* ════════════════════════════════════════ */
export default function Dashboard() {
  const { user, setPage } = useApp();
  const isStaff = user?.userType === 'staff';

  const [stats,   setStats]   = useState({ available: 0, borrowing: 0, pending: 0, overdue: 0, returnReq: 0, damaged: 0 });
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      let reqQuery = supabase
        .from('borrow_requests')
        .select('id, student_name, class_name, equipment_name, quantity, status, expected_return_date')
        .order('borrow_date', { ascending: false });

      if (!isStaff) reqQuery = reqQuery.eq('student_id', user.studentId);

      const [reqRes, eqRes] = await Promise.all([
        reqQuery,
        supabase.from('equipment').select('available_quantity, status'),
      ]);
      if (!alive) return;

      if (!reqRes.error) {
        const reqs      = (reqRes.data ?? []).map(normalizeReq);
        const borrowing = reqs.filter(r => ['approved', 'active'].includes(r.status)).length;
        const pending   = reqs.filter(r => r.status === 'pending').length;
        const overdue   = reqs.filter(r => r.status === 'overdue').length;
        const returnReq = reqs.filter(r => r.status === 'return_requested').length;
        setRecent(reqs.slice(0, isStaff ? 8 : 5));
        setStats(s => ({ ...s, borrowing, pending, overdue, returnReq }));
      }
      if (!eqRes.error) {
        const eqs       = eqRes.data ?? [];
        const available = eqs.reduce((n, e) => n + (e.available_quantity ?? 0), 0);
        const damaged   = eqs.filter(e => e.status === 'damaged').length;
        setStats(s => ({ ...s, available, damaged }));
      }
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [user?.studentId, isStaff]);

  const greeting = isStaff
    ? (user.displayName || user.username)
    : (user.firstName   || user.fullName);

  /* ── Student view ── */
  if (!isStaff) {
    const ACTIVE_STATUSES = ['approved', 'active', 'return_requested'];
    const active     = recent.filter(r => ACTIVE_STATUSES.includes(r.status));
    const others     = recent.filter(r => !ACTIVE_STATUSES.includes(r.status));
    const classPrefix = user.className ? `${user.className} · ` : '';

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 mb-0.5">ยินดีต้อนรับ</p>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>สวัสดี, {greeting}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{classPrefix}ระบบยืม-คืนอุปกรณ์กีฬา</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => setPage('equipment')}
          className="btn-primary w-full mb-5 py-3 text-base gap-2"
        >
          <Package size={18} />
          ยืมอุปกรณ์กีฬา
        </button>

        {/* Actively borrowing */}
        {(loading || active.length > 0) && (
          <div className="card p-4 md:p-5 mb-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: PRIMARY }}>
              อุปกรณ์ที่กำลังยืม
            </h2>
            {loading
              ? [0,1].map(i => <div key={i} className="h-12 animate-pulse bg-slate-100 rounded-xl mb-2" />)
              : active.map(req => <ReqRow key={req.id} req={req} />)
            }
          </div>
        )}

        {/* Recent requests */}
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: PRIMARY }}>คำขอล่าสุด</h2>
            <button onClick={() => setPage('requests')} className="text-xs font-medium" style={{ color: ACCENT }}>
              ดูทั้งหมด →
            </button>
          </div>

          {loading && [0,1,2].map(i => (
            <div key={i} className="h-12 animate-pulse bg-slate-100 rounded-xl mb-2" />
          ))}
          {!loading && others.length === 0 && active.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <ClipboardList size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีคำขอยืม</p>
              <p className="text-xs mt-1">เริ่มจากเลือกอุปกรณ์ที่ต้องการยืม</p>
            </div>
          )}
          {!loading && others.length > 0 && (
            <div className="divide-y divide-slate-100">
              {others.map(req => <ReqRow key={req.id} req={req} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Staff view ── */
  const STAFF_STATS = [
    { key: 'pending',   label: 'รออนุมัติ',     Icon: Clock,          color: WARNING },
    { key: 'returnReq', label: 'รอตรวจรับคืน',  Icon: Package,        color: '#EA580C' },
    { key: 'overdue',   label: 'คืนล่าช้า',      Icon: AlertTriangle,  color: DANGER },
    { key: 'damaged',   label: 'อุปกรณ์ชำรุด',  Icon: AlertTriangle,  color: '#92400E' },
  ];

  const pendingList   = recent.filter(r => r.status === 'pending').slice(0, 4);
  const returnReqList = recent.filter(r => r.status === 'return_requested').slice(0, 4);
  const overdueList   = recent.filter(r => r.status === 'overdue').slice(0, 4);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 mb-0.5">ครูผู้ดูแลระบบ</p>
        <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>สวัสดี, {greeting}</h1>
        <p className="text-xs text-slate-500 mt-0.5">ระบบยืม-คืนอุปกรณ์กีฬา จภ.เชียงราย</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {STAFF_STATS.map(cfg => (
          <StatTile key={cfg.key} label={cfg.label} value={stats[cfg.key]}
                    Icon={cfg.Icon} color={cfg.color} loading={loading} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setPage('manage-equipment')} className="btn-primary gap-2">
          <Package size={16} />
          เพิ่มอุปกรณ์
        </button>
        <button onClick={() => setPage('requests')} className="btn-outline gap-2">
          <ClipboardList size={16} />
          ดูคำขอทั้งหมด
        </button>
      </div>

      {/* Lists */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pending */}
        <SectionCard
          title="รออนุมัติ"
          count={stats.pending}
          color={WARNING}
          onViewAll={() => setPage('requests')}
          loading={loading}
          list={pendingList}
          empty="ไม่มีคำขอรออนุมัติ"
        />

        {/* Return requested */}
        <SectionCard
          title="รอตรวจรับคืน"
          count={stats.returnReq}
          color="#EA580C"
          onViewAll={() => setPage('requests')}
          loading={loading}
          list={returnReqList}
          empty="ไม่มีรายการรอตรวจรับคืน"
        />

        {/* Overdue */}
        <SectionCard
          title="คืนล่าช้า"
          count={stats.overdue}
          color={DANGER}
          onViewAll={() => setPage('requests')}
          loading={loading}
          list={overdueList}
          empty="ไม่มีรายการล่าช้า"
        />
      </div>
    </div>
  );
}

function SectionCard({ title, count, color, onViewAll, loading, list, empty }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {count > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: color }}>
              {count}
            </span>
          )}
        </div>
        <button onClick={onViewAll} className="text-xs font-medium" style={{ color: ACCENT }}>
          ดูทั้งหมด →
        </button>
      </div>

      {loading ? (
        [0,1].map(i => <div key={i} className="h-10 animate-pulse bg-slate-100 rounded-xl mb-2" />)
      ) : list.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">{empty}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {list.map(req => <ReqRow key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}
