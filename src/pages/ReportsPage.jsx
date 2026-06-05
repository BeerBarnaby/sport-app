import { useState, useEffect } from 'react';
import { useApp }   from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { PRIMARY, ACCENT, DANGER, WARNING } from '../utils/constants';

function normalizeEq(e) {
  return {
    id:     e.id,
    name:   e.name                         ?? '',
    icon:   e.icon                         ?? '⚽',
    status: e.status                       ?? 'available',
    avail:  e.avail  ?? e.available_quantity ?? 0,
    total:  e.total  ?? e.total_quantity     ?? 0,
  };
}

function normalizeReq(r) {
  return {
    id:     r.id,
    name:   r.student_name   ?? '',
    eq:     r.equipment_name ?? '',
    qty:    r.quantity       ?? 1,
    status: r.status         ?? 'pending',
    ret:    r.return_date    ?? '',
  };
}

export default function ReportsPage() {
  const { user }                 = useApp();
  const [equipment, setEquipment] = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [eqRes, reqRes] = await Promise.all([
        supabase.from('equipment').select('id, name, icon, status, avail, available_quantity, total, total_quantity'),
        supabase
          .from('borrow_requests')
          .select('id, student_name, equipment_name, quantity, status, return_date')
          .eq('student_id', user.studentId),
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
  }, [user.studentId]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
        {[0, 1, 2].map(i => (
          <div key={i} className="card p-4 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto text-center py-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm text-red-600 font-medium mb-1">โหลดข้อมูลไม่สำเร็จ</p>
        <p className="text-xs text-gray-400">{error}</p>
      </div>
    );
  }

  const borrowCount = {};
  requests.forEach(r => {
    borrowCount[r.eq] = (borrowCount[r.eq] || 0) + r.qty;
  });
  const topBorrowed = Object.entries(borrowCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const overdueList  = requests.filter(r => r.status === 'overdue');
  const damagedList  = equipment.filter(e => e.status === 'damaged');
  const lowStockList = equipment.filter(e => e.status !== 'damaged' && e.total > 0 && e.avail / e.total < 0.3);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>รายงาน</h1>
        <p className="text-gray-400 text-xs mt-0.5">สรุปการใช้งานอุปกรณ์กีฬา</p>
      </div>

      <Section title="อุปกรณ์ที่ฉันยืมบ่อย" icon="🏆">
        {topBorrowed.length === 0 ? (
          <Empty />
        ) : (
          topBorrowed.map(([name, count], i) => (
            <div key={name} className="flex items-center gap-3 py-2.5">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: i === 0 ? ACCENT : i === 1 ? '#94A3B8' : '#CBD5E1' }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700">{name}</span>
              <span className="text-sm font-semibold" style={{ color: ACCENT }}>{count} ชิ้น</span>
            </div>
          ))
        )}
      </Section>

      <Section title="คืนล่าช้า" icon="⚠️">
        {overdueList.length === 0 ? (
          <Empty text="ไม่มีรายการล่าช้า" />
        ) : (
          overdueList.map(req => (
            <div key={req.id} className="flex items-start justify-between py-2.5 gap-2">
              <div>
                <div className="text-sm text-gray-700 font-medium">{req.name}</div>
                <div className="text-xs text-gray-400">{req.eq} × {req.qty}</div>
              </div>
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: DANGER }}>
                เกิน {req.ret}
              </span>
            </div>
          ))
        )}
      </Section>

      <Section title="อุปกรณ์ต้องดูแล" icon="🔧">
        {damagedList.length === 0 && lowStockList.length === 0 ? (
          <Empty text="อุปกรณ์ทุกชิ้นอยู่ในเกณฑ์ปกติ" />
        ) : (
          <>
            {damagedList.map(eq => (
              <div key={eq.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-700">{eq.icon} {eq.name}</span>
                <span className="text-xs font-semibold" style={{ color: DANGER }}>ชำรุด</span>
              </div>
            ))}
            {lowStockList.map(eq => (
              <div key={eq.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-700">{eq.icon} {eq.name}</span>
                <span className="text-xs font-semibold" style={{ color: WARNING }}>
                  เหลือ {eq.avail}/{eq.total}
                </span>
              </div>
            ))}
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card p-4 md:p-5 mb-4">
      <h2 className="text-sm font-semibold mb-1" style={{ color: PRIMARY }}>
        {icon} {title}
      </h2>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function Empty({ text = 'ยังไม่มีข้อมูล' }) {
  return <p className="text-sm text-gray-400 py-2">{text}</p>;
}
