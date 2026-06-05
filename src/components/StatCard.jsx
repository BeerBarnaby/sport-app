export default function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="card p-4 flex items-center gap-3"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: `${color}14` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold leading-none" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
