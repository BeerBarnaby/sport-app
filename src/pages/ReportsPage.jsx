import { useState, useEffect } from 'react';
import { useApp }   from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Trophy, AlertTriangle, Wrench, Package } from 'lucide-react';
import { PRIMARY, ACCENT, DANGER, WARNING } from '../utils/constants';

function normalizeEq(e) {
  return {
    id:                 e.id,
    name:               e.name               ?? '',
    icon:               e.icon               ?? '⚽',
    status:             e.status             ?? 'available',
    available_quantity: e.available_quantity ?? 0,
    total_quantity:     e.total_quantity     ?? 0,
  };
}

function normalizeReq(r) {
  return {
    id:     r.id,
    name:   r.student_name        ?? '',
    eq:     r.equipment_name      ?? '',
    qty:    r.quantity            ?? 1,
    status: r.status              ?? 'pending',
    ret:    r.expected_return_date ?? '',
  };
}

const BORROWING_STATUSES = ['approved', 'active', 'overdue', 'return_requested'];

export default function ReportsPage() {
  const { user }                  = useApp();
  const [equipment, setEquipment] = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      let reqQuery = supabase
        .from('borrow_requests')
        .select('id, student_name, equipment_name, quantity, status, expected_return_date')
        .order('borrow_date', { ascending: false });

      if (user?.userType !== 'staff' && user?.studentId) {
        reqQuery = reqQuery.eq('student_id', user.studentId);
      }

      const [eqRes, reqRes] = await Promise.all([
        supabase.from('equipment').select('id, name, icon, status, available_quantity, total_quantity'),
        reqQuery,
      ]);
      if (!alive) return;
      if (eqRes.error || reqRes.error) {
        setError(eqRes.error?.message ?? reqRes.error?.message);
      } else {
        setEquipment((eqRes.data ?? []).map(normalizeEq));
        setRequests((reqRes.data  ?? []).map(normalizeReq));
      }
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [user?.studentId, user?.userType]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg" />
        {[0,1,2].map(i => <div key={i} className="card p-4 h-40 animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto text-center py-20">
        <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm text-red-600 font-medium mb-1">โหลดข้อมูลไม่สำเร็จ</p>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }

  /* ── Derived data ── */
  const borrowCount = {};
  requests.forEach(r => { borrowCount[r.eq] = (borrowCount[r.eq] || 0) + r.qty; });
  const topBorrowed    = Object.entries(borrowCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const overdueList    = requests.filter(r => r.status === 'overdue');
  const damagedList    = equipment.filter(e => e.status === 'damaged');
  const lostList       = equipment.filter(e => e.status === 'lost');
  const lowStockList   = equipment.filter(
    e => e.status !== 'damaged' && e.total_quantity > 0
      && e.available_quantity / e.total_quantity < 0.3
  );

  const totalBorrowed  = requests.filter(r => BORROWING_STATUSES.includes(r.status)).length;
  const totalReturned  = requests.filter(r => r.status === 'returned').length;
  const totalEquip     = equipment.length;
  const availableEquip = equipment.filter(e => e.status === 'available').length;

  const needsAttention = damagedList.length + lostList.length + lowStockList.length;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>รายงาน</h1>
        <p className="text-slate-500 text-sm mt-0.5">สรุปการใช้งานอุปกรณ์กีฬา</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'อุปกรณ์ทั้งหมด',   value: totalEquip,     color: PRIMARY    },
          { label: 'พร้อมให้ยืม',       value: availableEquip, color: '#16A34A'  },
          { label: 'กำลังถูกยืม',       value: totalBorrowed,  color: ACCENT     },
          { label: 'คืนแล้ว (ทั้งหมด)', value: totalReturned,  color: '#64748B'  },
        ].map(t => (
          <div key={t.label} className="card p-4">
            <div className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Top borrowed */}
      <Section title="ยืมบ่อยที่สุด" Icon={Trophy} iconColor={ACCENT}>
        {topBorrowed.length === 0 ? <Empty /> : (
          topBorrowed.map(([name, count], i) => (
            <div key={name} className="flex items-center gap-3 py-2.5">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#CBD5E1' }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-slate-700">{name}</span>
              <span className="text-sm font-semibold" style={{ color: ACCENT }}>{count} ชิ้น</span>
            </div>
          ))
        )}
      </Section>

      {/* Overdue */}
      <Section title="คืนล่าช้า" Icon={AlertTriangle} iconColor={DANGER}>
        {overdueList.length === 0 ? <Empty text="ไม่มีรายการล่าช้า" /> : (
          overdueList.map(req => (
            <div key={req.id} className="flex items-start justify-between py-2.5 gap-2">
              <div>
                <div className="text-sm text-slate-700 font-medium">{req.name}</div>
                <div className="text-xs text-slate-400">{req.eq} × {req.qty}</div>
              </div>
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: DANGER }}>
                เกิน {req.ret}
              </span>
            </div>
          ))
        )}
      </Section>

      {/* Damaged / low stock */}
      <Section title="อุปกรณ์ต้องดูแล" Icon={Wrench} iconColor={WARNING}>
        {needsAttention === 0 ? <Empty text="อุปกรณ์ทุกชิ้นอยู่ในเกณฑ์ปกติ" /> : (
          <>
            {damagedList.map(eq => (
              <div key={eq.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-700">{eq.icon} {eq.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">ชำรุด</span>
              </div>
            ))}
            {lostList.map(eq => (
              <div key={eq.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-700">{eq.icon} {eq.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">สูญหาย</span>
              </div>
            ))}
            {lowStockList.map(eq => (
              <div key={eq.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-700">{eq.icon} {eq.name}</span>
                <span className="text-xs font-semibold" style={{ color: WARNING }}>
                  เหลือ {eq.available_quantity}/{eq.total_quantity}
                </span>
              </div>
            ))}
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, Icon, iconColor, children }) {
  return (
    <div className="card p-4 md:p-5 mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold mb-1" style={{ color: PRIMARY }}>
        <Icon size={15} style={{ color: iconColor }} />
        {title}
      </h2>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Empty({ text = 'ยังไม่มีข้อมูล' }) {
  return (
    <div className="flex items-center gap-2 py-4 text-slate-400">
      <Package size={16} className="opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
