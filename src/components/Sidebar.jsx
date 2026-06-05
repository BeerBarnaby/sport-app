import { useApp } from '../context/AppContext';

const NAV = [
  { id: 'dashboard', label: 'หน้าแรก',  icon: '🏠' },
  { id: 'equipment', label: 'อุปกรณ์',  icon: '🏅' },
  { id: 'requests',  label: 'คำขอยืม',  icon: '📋' },
  { id: 'reports',   label: 'รายงาน',   icon: '📊' },
  { id: 'profile',   label: 'โปรไฟล์',  icon: '👤' },
];

export default function Sidebar() {
  const { page, setPage, stats } = useApp();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-primary flex-shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-white font-bold text-base leading-tight">ระบบยืม-คืน</div>
        <div className="text-blue-300 text-xs mt-0.5">อุปกรณ์กีฬา จภ.เชียงราย</div>
      </div>

      <nav className="flex-1 py-3 px-2">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-item w-full text-left text-sm ${page === item.id ? 'active' : ''}`}
          >
            <span className="text-base w-5 flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.id === 'requests' && stats.pending > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 text-blue-400 text-xs">v1.0 © 2026 จภ.เชียงราย</div>
    </aside>
  );
}
