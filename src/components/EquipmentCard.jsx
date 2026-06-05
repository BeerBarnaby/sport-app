import StatusBadge from './StatusBadge';

export default function EquipmentCard({ equipment, onBorrow }) {
  const { name, cat, total, available_quantity, status, icon } = equipment;
  const pct      = total > 0 ? (available_quantity / total) * 100 : 0;
  const canBorrow = status === 'available' && available_quantity > 0;
  const barColor  = pct > 50 ? '#16A34A' : pct > 20 ? '#F59E0B' : '#DC2626';

  let btnLabel = 'ขอยืม';
  if (status === 'damaged') btnLabel = 'กำลังซ่อม';
  else if (available_quantity === 0) btnLabel = 'ไม่พร้อมให้ยืม';

  return (
    <div className="card eqcard p-4 flex flex-col gap-3">
      {/* Icon + status */}
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none">{icon}</span>
        <StatusBadge status={status} small />
      </div>

      {/* Name + category */}
      <div>
        <div className="font-semibold text-sm text-slate-800 leading-snug">{name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{cat}</div>
      </div>

      {/* Quantity bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>ว่าง {available_quantity}/{total}</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Borrow button — outline style, solid only when canBorrow */}
      <button
        onClick={() => canBorrow && onBorrow(equipment)}
        disabled={!canBorrow}
        className={canBorrow ? 'btn-outline-accent w-full' : undefined}
        style={!canBorrow ? {
          padding: '10px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          border: '2px solid #E2E8F0',
          background: '#F8FAFC',
          color: '#94A3B8',
          cursor: 'not-allowed',
          width: '100%',
        } : {}}
      >
        {btnLabel}
      </button>
    </div>
  );
}
