import { useApp } from '../context/AppContext';

const NAV = [
  { id: 'dashboard', label: 'หน้าแรก', icon: '🏠' },
  { id: 'equipment', label: 'อุปกรณ์', icon: '🏅' },
  { id: 'requests',  label: 'คำขอยืม', icon: '📋' },
  { id: 'reports',   label: 'รายงาน',  icon: '📊' },
  { id: 'profile',   label: 'โปรไฟล์', icon: '👤' },
];

export default function BottomNav() {
  const { page, setPage, stats } = useApp();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border z-50 md:hidden">
      <div className="flex">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`relative flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              page === item.id ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.id === 'requests' && stats.pending > 0 && (
              <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold">
                {stats.pending}
              </span>
            )}
            {page === item.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
