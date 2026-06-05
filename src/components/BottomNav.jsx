import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, Settings2, ClipboardList,
  BarChart3, User,
} from 'lucide-react';

const NAV_STUDENT = [
  { id: 'dashboard', label: 'หน้าแรก', Icon: LayoutDashboard },
  { id: 'equipment', label: 'อุปกรณ์', Icon: Package },
  { id: 'requests',  label: 'คำขอยืม', Icon: ClipboardList },
  { id: 'profile',   label: 'โปรไฟล์', Icon: User },
];

const NAV_TEACHER = [
  { id: 'dashboard',        label: 'หน้าแรก', Icon: LayoutDashboard },
  { id: 'equipment',        label: 'อุปกรณ์', Icon: Package },
  { id: 'manage-equipment', label: 'จัดการ',  Icon: Settings2 },
  { id: 'requests',         label: 'คำขอยืม', Icon: ClipboardList },
  { id: 'reports',          label: 'รายงาน',  Icon: BarChart3 },
  { id: 'profile',          label: 'โปรไฟล์', Icon: User },
];

export default function BottomNav() {
  const { user, page, setPage, stats } = useApp();
  const isStaff = user?.userType === 'staff';
  const NAV = isStaff ? NAV_TEACHER : NAV_STUDENT;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 md:hidden safe-bottom">
      <div className="flex">
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="relative flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
              style={{ color: active ? '#0B2E63' : '#94A3B8' }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium leading-none mt-0.5">{label}</span>

              {id === 'requests' && stats.pending > 0 && (
                <span
                  className="absolute top-1.5 right-1/4 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                  style={{ background: '#F47C20' }}
                >
                  {stats.pending}
                </span>
              )}

              {active && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: '#F47C20' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
