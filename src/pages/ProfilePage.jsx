import { useApp }  from '../context/AppContext';
import { PRIMARY } from '../utils/constants';

const ROLES = [
  { value: 'student', label: 'นักเรียน',        sub: 'ขอยืมอุปกรณ์ได้เท่านั้น',       icon: '🎒' },
  { value: 'teacher', label: 'ครู/เจ้าหน้าที่', sub: 'อนุมัติและบันทึกการคืนได้',     icon: '👨‍🏫' },
  { value: 'admin',   label: 'ผู้ดูแลระบบ',     sub: 'จัดการระบบและอุปกรณ์ทั้งหมด', icon: '⚙️'  },
];

const ROLE_LABEL = { student: 'นักเรียน', teacher: 'ครู/เจ้าหน้าที่', admin: 'ผู้ดูแลระบบ' };

export default function ProfilePage() {
  const { user, setUser, requests } = useApp();

  const myReqs   = requests.filter(r => r.name === user.name);
  const active   = myReqs.filter(r => ['approved', 'active'].includes(r.status)).length;
  const returned = myReqs.filter(r => r.status === 'returned').length;
  const currentRole = ROLES.find(r => r.value === user.role);

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>โปรไฟล์</h1>
        <p className="text-gray-400 text-xs mt-0.5">ข้อมูลผู้ใช้งาน</p>
      </div>

      {/* Profile card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${PRIMARY}12` }}
          >
            {currentRole?.icon ?? '👤'}
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-800 leading-tight">{user.name}</h2>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${PRIMARY}12`, color: PRIMARY }}
            >
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </div>

        <div className="flex gap-0 border border-border rounded-xl overflow-hidden mb-4">
          {[
            { v: active,          l: 'กำลังยืม' },
            { v: returned,        l: 'คืนแล้ว'   },
            { v: myReqs.length,   l: 'ทั้งหมด'   },
          ].map((s, i) => (
            <div key={i} className="flex-1 text-center py-3 border-r border-border last:border-0">
              <div className="text-lg font-bold" style={{ color: PRIMARY }}>{s.v}</div>
              <div className="text-[10px] text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <InfoRow label="อีเมล"    value={user.email} />
          <InfoRow label="โทรศัพท์" value={user.phone} />
          <InfoRow label="แผนก"    value={user.department} />
        </div>
      </div>

      {/* Role switcher */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-0.5" style={{ color: PRIMARY }}>เปลี่ยน Role (ทดสอบ UI)</h3>
        <p className="text-xs text-gray-400 mb-3">เลือก role เพื่อดูการทำงานในแต่ละระดับ</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setUser(p => ({ ...p, role: r.value }))}
              className={`py-3 rounded-xl text-center transition-all border ${
                user.role === r.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-gray-600 hover:border-primary/40'
              }`}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="text-xs font-medium leading-tight">{r.label.split('/')[0]}</div>
            </button>
          ))}
        </div>
        {currentRole && (
          <div className="mt-3 px-3 py-2 bg-app-bg rounded-xl text-xs text-gray-500">
            💡 {currentRole.sub}
          </div>
        )}
      </div>
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
