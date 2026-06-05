import { useState, useEffect, useCallback } from 'react';
import { supabase }     from '../lib/supabaseClient';
import ConfirmModal     from '../components/ConfirmModal';
import { PRIMARY }      from '../utils/constants';

const STATUS_OPTIONS = [
  { value: 'available',   label: 'พร้อมให้ยืม' },
  { value: 'unavailable', label: 'ไม่พร้อมให้ยืม' },
  { value: 'damaged',     label: 'ชำรุด' },
  { value: 'lost',        label: 'สูญหาย' },
];

const CATEGORY_OPTIONS = [
  'ฟุตบอล', 'บาสเกตบอล', 'วอลเลย์บอล', 'แบดมินตัน', 'ปิงปอง', 'กรีฑา', 'ทั่วไป',
];

const ICON_PRESETS = ['⚽', '🏀', '🏐', '🏸', '🪶', '🏓', '🔶', '📣', '👕', '🕸️', '🏃', '🥅'];

const EMPTY_FORM = {
  name: '', category: 'ทั่วไป', icon: '⚽',
  total_quantity: 0, available_quantity: 0,
  status: 'available', location: '', note: '',
};

function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'กรุณากรอกชื่ออุปกรณ์';
  if (Number(form.total_quantity) < 0) errors.total_quantity = 'จำนวนต้องไม่ติดลบ';
  if (Number(form.available_quantity) < 0) errors.available_quantity = 'จำนวนต้องไม่ติดลบ';
  if (Number(form.available_quantity) > Number(form.total_quantity))
    errors.available_quantity = 'จำนวนพร้อมยืมต้องไม่เกินจำนวนทั้งหมด';
  return errors;
}

function normalizeItem(item) {
  return {
    id:                item.id,
    name:              item.name                              ?? '',
    category:          item.category    ?? item.cat           ?? 'ทั่วไป',
    icon:              item.icon                              ?? '⚽',
    total_quantity:    item.total_quantity  ?? item.total     ?? 0,
    available_quantity:item.available_quantity ?? item.avail  ?? 0,
    status:            item.status                            ?? 'available',
    location:          item.location                          ?? '',
    note:              item.note ?? item.description          ?? '',
  };
}

export default function ManageEquipmentPage() {
  const [equipment,    setEquipment]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [fetchError,   setFetchError]  = useState(null);
  const [modal,        setModal]       = useState(null);
  const [deleteTarget, setDeleteTarget]= useState(null);
  const [form,         setForm]        = useState(EMPTY_FORM);
  const [formErrors,   setFormErrors]  = useState({});
  const [saving,       setSaving]      = useState(false);
  const [apiErr,       setApiErr]      = useState('');

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });
    if (error) setFetchError(error.message);
    else setEquipment(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setApiErr('');
    setModal({ mode: 'add' });
  };

  const openEdit = (item) => {
    const eq = normalizeItem(item);
    setForm({
      name:               eq.name,
      category:           eq.category,
      icon:               eq.icon,
      total_quantity:     eq.total_quantity,
      available_quantity: eq.available_quantity,
      status:             eq.status,
      location:           eq.location,
      note:               eq.note,
    });
    setFormErrors({});
    setApiErr('');
    setModal({ mode: 'edit', id: item.id });
  };

  const closeModal = () => { setModal(null); setSaving(false); setApiErr(''); };

  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setFormErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    setApiErr('');

    const payload = {
      name:               form.name.trim(),
      category:           form.category,
      icon:               form.icon || '⚽',
      total_quantity:     Number(form.total_quantity),
      available_quantity: Number(form.available_quantity),
      status:             form.status,
      location:           form.location.trim(),
      note:               form.note.trim(),
    };

    const { error } = modal.mode === 'add'
      ? await supabase.from('equipment').insert(payload)
      : await supabase.from('equipment').update(payload).eq('id', modal.id);

    setSaving(false);
    if (error) { setApiErr(error.message); return; }
    closeModal();
    fetchEquipment();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', deleteTarget.id);
    if (!error) {
      setEquipment(prev => prev.filter(e => e.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const statusLabel = (s) => STATUS_OPTIONS.find(o => o.value === s)?.label ?? s;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>จัดการอุปกรณ์</h1>
          <p className="text-gray-400 text-xs mt-0.5">เพิ่ม แก้ไข และลบอุปกรณ์กีฬา</p>
        </div>
        <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
          + เพิ่มอุปกรณ์
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && fetchError && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-red-600 font-medium mb-4">{fetchError}</p>
          <button onClick={fetchEquipment} className="btn-primary px-5 py-2 text-sm">ลองใหม่</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !fetchError && equipment.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm">ยังไม่มีอุปกรณ์ กดเพิ่มอุปกรณ์ด้านบน</p>
        </div>
      )}

      {/* List */}
      {!loading && !fetchError && equipment.length > 0 && (
        <div className="space-y-3">
          {equipment.map(item => {
            const eq = normalizeItem(item);
            return (
              <div key={eq.id} className="card p-4 flex items-center gap-3">
                <div className="text-3xl w-10 flex-shrink-0 text-center">{eq.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">{eq.name}</div>
                  <div className="text-xs text-gray-400">{eq.category}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    ทั้งหมด {eq.total_quantity} · ว่าง {eq.available_quantity} · {statusLabel(eq.status)}
                  </div>
                  {eq.location && (
                    <div className="text-xs text-gray-300 mt-0.5">📍 {eq.location}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-gray-600 hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => setDeleteTarget(eq)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-modal overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-bold text-sm" style={{ color: PRIMARY }}>
                {modal.mode === 'add' ? 'เพิ่มอุปกรณ์ใหม่' : 'แก้ไขอุปกรณ์'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-lg p-1 leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">

              {/* Name */}
              <FormField label="ชื่ออุปกรณ์ *" error={formErrors.name}>
                <input
                  className="form-input"
                  placeholder="เช่น ลูกฟุตบอล"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  disabled={saving}
                />
              </FormField>

              {/* Category + Icon */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="ประเภทกีฬา">
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setField('category', e.target.value)}
                    disabled={saving}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="สถานะ">
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={e => setField('status', e.target.value)}
                    disabled={saving}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Icon picker */}
              <FormField label="Icon">
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {ICON_PRESETS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setField('icon', ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                        form.icon === ic
                          ? 'border-primary bg-blue-50'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <input
                  className="form-input text-sm"
                  placeholder="หรือพิมพ์ emoji เอง"
                  value={form.icon}
                  onChange={e => setField('icon', e.target.value)}
                  disabled={saving}
                />
              </FormField>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="จำนวนทั้งหมด" error={formErrors.total_quantity}>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={form.total_quantity}
                    onChange={e => setField('total_quantity', e.target.value)}
                    disabled={saving}
                  />
                </FormField>

                <FormField label="จำนวนพร้อมให้ยืม" error={formErrors.available_quantity}>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={form.available_quantity}
                    onChange={e => setField('available_quantity', e.target.value)}
                    disabled={saving}
                  />
                </FormField>
              </div>

              {/* Location */}
              <FormField label="ตำแหน่งจัดเก็บ">
                <input
                  className="form-input"
                  placeholder="เช่น ห้องพลศึกษา ชั้น 1"
                  value={form.location}
                  onChange={e => setField('location', e.target.value)}
                  disabled={saving}
                />
              </FormField>

              {/* Note */}
              <FormField label="หมายเหตุ">
                <textarea
                  className="form-input resize-none"
                  rows={2}
                  placeholder="หมายเหตุเพิ่มเติม"
                  value={form.note}
                  onChange={e => setField('note', e.target.value)}
                  disabled={saving}
                />
              </FormField>

              {apiErr && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200">
                  {apiErr}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline flex-1"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving
                    ? 'กำลังบันทึก…'
                    : modal.mode === 'add' ? 'เพิ่มอุปกรณ์' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="ยืนยันการลบ"
          message={`ลบ "${deleteTarget.name}" ออกจากระบบ? การกระทำนี้ไม่สามารถยกเลิกได้`}
          okLabel="ลบอุปกรณ์"
          okClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
