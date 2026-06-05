import { PRIMARY } from '../utils/constants';

export default function ConfirmModal({
  title,
  message,
  okLabel    = 'ยืนยัน',
  okClass    = 'btn-primary',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" style={{ alignItems: 'center', padding: 16 }}>
      <div
        className="card p-6 modal-enter"
        style={{ maxWidth: 360, width: '100%', margin: '0 auto', borderRadius: 20 }}
      >
        <h3 className="font-bold text-base mb-2" style={{ color: PRIMARY }}>
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-outline btn-sm">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className={`btn ${okClass} btn-sm`}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
