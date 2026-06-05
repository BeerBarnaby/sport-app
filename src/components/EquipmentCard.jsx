import StatusBadge from './StatusBadge';

export default function EquipmentCard({ equipment, onBorrow }) {
  const { name, cat, total, avail, status, icon, desc } = equipment;
  const pct     = total > 0 ? (avail / total) * 100 : 0;
  const canBorrow = status === 'available' && avail > 0;

  const barColor = pct > 50 ? '#16A34A' : pct > 20 ? '#D97706' : '#DC2626';

  return (
    <div className="card eqcard p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        <StatusBadge status={status} small />
      </div>

      <div>
        <div className="font-semibold text-sm text-gray-800 leading-tight">{name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{cat}</div>
      </div>

      {/* Availability bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>ว่าง {avail}/{total}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      <button
        onClick={() => canBorrow && onBorrow(equipment)}
        disabled={!canBorrow}
        className={`btn btn-sm w-full justify-center ${canBorrow ? 'btn-primary' : ''}`}
        style={
          !canBorrow
            ? { background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed' }
            : {}
        }
      >
        {status === 'damaged'
          ? 'กำลังซ่อม'
          : avail === 0
          ? 'หมดแล้ว'
          : 'ขอยืม'}
      </button>
    </div>
  );
}
