import { useApp }  from '../context/AppContext';
import { PRIMARY } from '../utils/constants';

export default function ProfilePage() {
  const { user, logout, requests } = useApp();

  const myReqs   = requests.filter(r => r.sid === user.studentId || r.name === user.fullName);
  const active   = myReqs.filter(r => ['approved', 'active'].includes(r.status)).length;
  const returned = myReqs.filter(r => r.status === 'returned').length;

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>โปรไฟล์</h1>
        <p className="text-gray-400 text-xs mt-0.5">ข้อมูลนักเรียน</p>
      </div>

      {/* Profile card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${PRIMARY}12` }}
          >
            🎒
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-800 leading-tight">{user.fullName}</h2>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${PRIMARY}12`, color: PRIMARY }}
            >
              นักเรียน
            </span>
          </div>
        </div>

        {/* borrow stats */}
        <div className="flex border border-border rounded-xl overflow-hidden mb-4">
          {[
            { v: active,        l: 'กำลังยืม' },
            { v: returned,      l: 'คืนแล้ว'   },
            { v: myReqs.length, l: 'ทั้งหมด'   },
          ].map((s, i) => (
            <div key={i} className="flex-1 text-center py-3 border-r border-border last:border-0">
              <div className="text-lg font-bold" style={{ color: PRIMARY }}>{s.v}</div>
              <div className="text-[10px] text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <InfoRow label="รหัสนักเรียน" value={user.studentId} />
          <InfoRow label="ชั้น/ห้อง"    value={user.className || '—'} />
          <InfoRow label="เลขที่"        value={user.classNo || '—'} />
        </div>
      </div>

      {/* logout */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
