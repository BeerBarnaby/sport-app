import { getStatusConfig } from '../utils/statusUtils';

export default function StatusBadge({ status, small = false }) {
  const c = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${
        small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ background: c.bg, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: c.dot }}
      />
      {c.label}
    </span>
  );
}
