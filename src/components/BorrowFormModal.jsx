import { useState } from 'react';
import { useApp }   from '../context/AppContext';
import { PRIMARY }  from '../utils/constants';

export default function BorrowFormModal({ equipment, onClose }) {
  const { addRequest, user } = useApp();
  const [done, setDone]      = useState(false);
  const [form, setForm]      = useState({ quantity: 1, dueDate: '', purpose: '' });
  const [errors, setErrors]  = useState({});

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e = {};
    if (form.quantity < 1 || form.quantity > equipment.avail)
      e.quantity = `กรอก 1–${equipment.avail}`;
    if (!form.dueDate)         e.dueDate  = 'กรุณาระบุวันคืน';
    if (!form.purpose.trim())  e.purpose  = 'กรุณาระบุวัตถุประสงค์';
    return e;
  };

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    addRequest({
      borrowerName:  user.fullName,
      studentId:     user.studentId,
      classroom:     user.className,
      classNo:       user.classNo,
      equipmentId:   equipment.id,
      equipmentName: equipment.name,
      quantity:      Number(form.quantity),
      dueDate:       form.dueDate,
      purpose:       form.purpose,
    });
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center overlay-enter">
      <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-modal modal-enter overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-sm" style={{ color: PRIMARY }}>ขอยืมอุปกรณ์</h2>
            <p className="text-xs text-gray-500 mt-0.5">{equipment.icon} {equipment.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg p-1 leading-none">✕</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-bold text-base mb-1" style={{ color: PRIMARY }}>ส่งคำขอเรียบร้อย</h3>
            <p className="text-sm text-gray-500 mb-6">รอการอนุมัติจากครูผู้รับผิดชอบ</p>
            <button onClick={onClose} className="btn-primary w-full py-3 rounded-xl text-sm">ปิด</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Readonly: borrower info from logged-in user */}
            <div>
              <span className="form-label">ชื่อ-นามสกุลผู้ยืม</span>
              <div className="form-input bg-gray-50 text-gray-600 cursor-default select-none">
                {user.fullName || '—'}
              </div>
            </div>

            <div>
              <span className="form-label">ชั้น/ห้อง</span>
              <div className="form-input bg-gray-50 text-gray-600 cursor-default select-none">
                {user.className || '—'}
              </div>
            </div>

            {/* Editable fields */}
            <Field label={`จำนวน (ว่าง ${equipment.avail} ชิ้น)`} error={errors.quantity}>
              <input
                type="number"
                className="form-input"
                min={1}
                max={equipment.avail}
                value={form.quantity}
                onChange={e => set('quantity', Number(e.target.value))}
              />
            </Field>

            <Field label="วันที่ต้องการคืน" error={errors.dueDate}>
              <input
                type="date"
                className="form-input"
                min={today}
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </Field>

            <Field label="วัตถุประสงค์" error={errors.purpose}>
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="ระบุวัตถุประสงค์การยืม"
                value={form.purpose}
                onChange={e => set('purpose', e.target.value)}
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-outline flex-1">
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary flex-1">
                ส่งคำขอ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
