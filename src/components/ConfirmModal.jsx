import { PRIMARY } from '../utils/constants';

export default function ConfirmModal({
  title,
  message,
  okLabel  = 'ยืนยัน',
  okClass  = 'btn-primary',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overlay-enter">
      <div className="card p-6 modal-enter w-full max-w-sm rounded-2xl">
        <h3 className="font-bold text-base mb-2" style={{ color: PRIMARY }}>
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-outline">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className={okClass}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
