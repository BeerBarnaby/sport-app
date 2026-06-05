import { useApp }           from '../context/AppContext';
import { PRIMARY, ACCENT, DANGER, WARNING } from '../utils/constants';

export default function ReportsPage() {
  const { equipment, requests } = useApp();

  const borrowCount = {};
  requests.forEach(r => {
    borrowCount[r.eq] = (borrowCount[r.eq] || 0) + r.qty;
  });
  const topBorrowed = Object.entries(borrowCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const overdueList  = requests.filter(r => r.status === 'overdue');
  const damagedList  = equipment.filter(e => e.status === 'damaged');
  const lowStockList = equipment.filter(e => e.status !== 'damaged' && e.avail / e.total < 0.3);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>รายงาน</h1>
        <p className="text-gray-400 text-xs mt-0.5">สรุปการใช้งานอุปกรณ์กีฬา</p>
      </div>

      <Section title="อุปกรณ์ที่ถูกยืมบ่อย" icon="🏆">
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
