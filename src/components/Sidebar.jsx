import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, Settings2, ClipboardList,
  BarChart3, User,
} from 'lucide-react';

const NAV_STUDENT = [
  { id: 'dashboard', label: 'หน้าแรก',  Icon: LayoutDashboard },
  { id: 'equipment', label: 'อุปกรณ์',  Icon: Package },
  { id: 'requests',  label: 'คำขอยืม',  Icon: ClipboardList },
  { id: 'profile',   label: 'โปรไฟล์',  Icon: User },
];

const NAV_TEACHER = [
  { id: 'dashboard',        label: 'หน้าแรก',        Icon: LayoutDashboard },
  { id: 'equipment',        label: 'อุปกรณ์',        Icon: Package },
  { id: 'manage-equipment', label: 'จัดการอุปกรณ์',  Icon: Settings2 },
  { id: 'requests',         label: 'คำขอยืมทั้งหมด', Icon: ClipboardList },
  { id: 'reports',          label: 'รายงาน',          Icon: BarChart3 },
  { id: 'profile',          label: 'โปรไฟล์',         Icon: User },
];

export default function Sidebar() {
  const { user, page, setPage, stats } = useApp();
  const isStaff = user?.userType === 'staff';
  const NAV = isStaff ? NAV_TEACHER : NAV_STUDENT;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen flex-shrink-0" style={{ background: '#0B2E63' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain flex-shrink-0" />
          <div>
            <div className="text-white font-bold text-sm leading-tight">ระบบยืม-คืน</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>อุปกรณ์กีฬา จภ.เชียงราย</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`nav-item w-full text-left ${page === id ? 'active' : ''}`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1 text-sm">{label}</span>
            {id === 'requests' && stats.pending > 0 && (
              <span
                className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: '#F47C20' }}
              >
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        v1.0 © 2026 จภ.เชียงราย
      </div>
    </aside>
  );
}
