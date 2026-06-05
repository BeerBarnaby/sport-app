import { useState, useEffect, useCallback } from 'react';
import { supabase }  from '../lib/supabaseClient';
import ConfirmModal  from '../components/ConfirmModal';
import StatusBadge   from '../components/StatusBadge';
import { Search, Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { PRIMARY }   from '../utils/constants';

const STATUS_OPTIONS = [
  { value: 'available',   label: 'พร้อมให้ยืม' },
  { value: 'unavailable', label: 'ไม่พร้อมให้ยืม' },
  { value: 'damaged',     label: 'ชำรุด' },
  { value: 'lost',        label: 'สูญหาย' },
];

const CATEGORY_OPTIONS = [
  'ฟุตบอล','บาสเกตบอล','วอลเลย์บอล','แบดมินตัน','ปิงปอง','กรีฑา','ทั่วไป',
];

const ICON_PRESETS = ['⚽','🏀','🏐','🏸','🪶','🏓','🔶','📣','👕','🕸️','🏃','🥅'];

const EMPTY_FORM = {
  name:'', category:'ทั่วไป', icon:'⚽',
  total_quantity:0, available_quantity:0,
  status:'available', location:'', note:'',
};

function validate(form) {
  const e = {};
  if (!form.name.trim()) e.name = 'กรุณากรอกชื่ออุปกรณ์';
  if (Number(form.total_quantity) < 0) e.total_quantity = 'จำนวนต้องไม่ติดลบ';
  if (Number(form.available_quantity) < 0) e.available_quantity = 'จำนวนต้องไม่ติดลบ';
  if (Number(form.available_quantity) > Number(form.total_quantity))
    e.available_quantity = 'ต้องไม่เกินจำนวนทั้งหมด';
  return e;
}

function normalizeItem(item) {
  return {
    id:                 item.id,
    name:               item.name                            ?? '',
    category:           item.category   ?? item.cat          ?? 'ทั่วไป',
    icon:               item.icon                            ?? '⚽',
    total_quantity:     item.total_quantity ?? item.total    ?? 0,
    available_quantity: item.available_quantity ?? item.avail ?? 0,
    status:             item.status                          ?? 'available',
    location:           item.location                        ?? '',
    note:               item.note ?? item.description        ?? '',
  };
}

export default function ManageEquipmentPage() {
  const [equipment,    setEquipment]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState({});
  const [saving,       setSaving]       = useState(false);
  const [apiErr,       setApiErr]       = useState('');

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.from('equipment').select('*').order('name');
    if (error) setFetchError(error.message);
    else setEquipment((data ?? []).map(normalizeItem));
    setLoading(false);
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  /* ── filters ── */
  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase())
      || eq.category.includes(search);
    const matchCat    = filterCat === 'ทั้งหมด' || eq.category === filterCat;
    const matchStatus = filterStatus === 'ทั้งหมด' || eq.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  /* ── summary ── */
  const totalCount     = equipment.length;
  const availableCount = equipment.filter(e => e.status === 'available').length;
  const damagedCount   = equipment.filter(e => e.status === 'damaged').length;
  const unavailCount   = equipment.filter(e => e.status === 'unavailable' || e.status === 'lost').length;

  /* ── modal helpers ── */
  const openAdd = () => { setForm(EMPTY_FORM); setFormErrors({}); setApiErr(''); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({
      name: item.name, category: item.category, icon: item.icon,
      total_quantity: item.total_quantity, available_quantity: item.available_quantity,
      status: item.status, location: item.location, note: item.note,
    });
    setFormErrors({}); setApiErr(''); setModal({ mode: 'edit', id: item.id });
  };
  const closeModal = () => { setModal(null); setSaving(false); setApiErr(''); };
  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setFormErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setSaving(true); setApiErr('');
    const payload = {
      name: form.name.trim(), category: form.category, icon: form.icon || '⚽',
      total_quantity: Number(form.total_quantity),
      available_quantity: Number(form.available_quantity),
      status: form.status, location: form.location.trim(), note: form.note.trim(),
    };
    const { error } = modal.mode === 'add'
      ? await supabase.from('equipment').insert(payload)
      : await supabase.from('equipment').update(payload).eq('id', modal.id);
    setSaving(false);
    if (error) { setApiErr(error.message); return; }
    closeModal(); fetchEquipment();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('equipment').delete().eq('id', deleteTarget.id);
    if (!error) setEquipment(prev => prev.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  /* ════ RENDER ════ */
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>จัดการอุปกรณ์</h1>
          <p className="text-sm text-slate-500 mt-0.5">เพิ่ม แก้ไข และจัดการสถานะอุปกรณ์กีฬา</p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-2">
          <Plus size={16} />
          เพิ่มอุปกรณ์
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'อุปกรณ์ทั้งหมด',   value: totalCount,     color: PRIMARY,    bg: '#EFF6FF' },
          { label: 'พร้อมให้ยืม',       value: availableCount, color: '#16A34A',  bg: '#ECFDF5' },
          { label: 'ชำรุด',             value: damagedCount,   color: '#92400E',  bg: '#FFFBEB' },
          { label: 'ไม่พร้อมให้ยืม',   value: unavailCount,   color: '#6B7280',  bg: '#F9FAFB' },
        ].map(t => (
          <div key={t.label} className="card p-4">
            {loading
              ? <div className="h-6 w-10 bg-slate-200 animate-pulse rounded mb-1" />
              : <div className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</div>}
            <div className="text-xs text-slate-500 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาอุปกรณ์..."
            className="form-input pl-8 py-2"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="form-input py-2 w-auto"
        >
          <option value="ทั้งหมด">หมวดหมู่ทั้งหมด</option>
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="form-input py-2 w-auto"
        >
          <option value="ทั้งหมด">สถานะทั้งหมด</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="text-center py-12">
          <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600 font-medium mb-4">{fetchError}</p>
          <button onClick={fetchEquipment} className="btn-primary px-5">ลองใหม่</button>
        </div>
      )}

      {/* Desktop Table */}
      {!fetchError && (
        <div className="hidden md:block card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">อุปกรณ์</th>
                <th className="table-th">หมวดหมู่</th>
                <th className="table-th text-center">ทั้งหมด</th>
                <th className="table-th text-center">ว่าง</th>
                <th className="table-th text-center">ถูกยืม</th>
                <th className="table-th">สถานะ</th>
                <th className="table-th">สถานที่เก็บ</th>
                <th className="table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && [0,1,2,3,4].map(i => (
                <tr key={i}>
                  <td colSpan={8} className="table-td">
                    <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-td text-center py-12 text-slate-400">
                    <Package size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{search || filterCat !== 'ทั้งหมด' || filterStatus !== 'ทั้งหมด' ? 'ไม่พบอุปกรณ์ที่ค้นหา' : 'ยังไม่มีอุปกรณ์'}</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(eq => (
                <tr key={eq.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{eq.icon}</span>
                      <span className="font-medium text-slate-800">{eq.name}</span>
                    </div>
                  </td>
                  <td className="table-td text-slate-500">{eq.category}</td>
                  <td className="table-td text-center font-medium">{eq.total_quantity}</td>
                  <td className="table-td text-center font-medium text-green-700">{eq.available_quantity}</td>
                  <td className="table-td text-center font-medium text-orange-600">
                    {Math.max(0, eq.total_quantity - eq.available_quantity)}
                  </td>
                  <td className="table-td"><StatusBadge status={eq.status} small /></td>
                  <td className="table-td text-slate-400 text-xs">{eq.location || '—'}</td>
                  <td className="table-td text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(eq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <Pencil size={12} /> แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteTarget(eq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!fetchError && (
        <div className="md:hidden space-y-3">
          {loading && [0,1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่พบอุปกรณ์</p>
            </div>
          )}
          {!loading && filtered.map(eq => (
            <div key={eq.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">{eq.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-800">{eq.name}</span>
                    <StatusBadge status={eq.status} small />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{eq.category}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    ทั้งหมด {eq.total_quantity} · ว่าง {eq.available_quantity} · ถูกยืม {Math.max(0, eq.total_quantity - eq.available_quantity)}
                  </div>
                  {eq.location && <div className="text-xs text-slate-400 mt-0.5">📍 {eq.location}</div>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(eq)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Pencil size={12} /> แก้ไข
                </button>
                <button
                  onClick={() => setDeleteTarget(eq)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
              <h2 className="font-bold text-sm" style={{ color: PRIMARY }}>
                {modal.mode === 'add' ? 'เพิ่มอุปกรณ์ใหม่' : 'แก้ไขอุปกรณ์'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg p-1 leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
              <FormField label="ชื่ออุปกรณ์ *" error={formErrors.name}>
                <input className="form-input" placeholder="เช่น ลูกฟุตบอล"
                  value={form.name} onChange={e => setField('name', e.target.value)} disabled={saving} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="ประเภทกีฬา">
                  <select className="form-input" value={form.category}
                    onChange={e => setField('category', e.target.value)} disabled={saving}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="สถานะ">
                  <select className="form-input" value={form.status}
                    onChange={e => setField('status', e.target.value)} disabled={saving}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Icon">
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {ICON_PRESETS.map(ic => (
                    <button key={ic} type="button" onClick={() => setField('icon', ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                        form.icon === ic ? 'border-primary bg-blue-50' : 'border-slate-200 hover:border-primary/40'
                      }`}>
                      {ic}
                    </button>
                  ))}
                </div>
                <input className="form-input text-sm" placeholder="หรือพิมพ์ emoji เอง"
                  value={form.icon} onChange={e => setField('icon', e.target.value)} disabled={saving} />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="จำนวนทั้งหมด" error={formErrors.total_quantity}>
                  <input type="number" className="form-input" min={0}
                    value={form.total_quantity} onChange={e => setField('total_quantity', e.target.value)} disabled={saving} />
                </FormField>
                <FormField label="จำนวนพร้อมให้ยืม" error={formErrors.available_quantity}>
                  <input type="number" className="form-input" min={0}
                    value={form.available_quantity} onChange={e => setField('available_quantity', e.target.value)} disabled={saving} />
                </FormField>
              </div>

              <FormField label="ตำแหน่งจัดเก็บ">
                <input className="form-input" placeholder="เช่น ห้องพลศึกษา ชั้น 1"
                  value={form.location} onChange={e => setField('location', e.target.value)} disabled={saving} />
              </FormField>

              <FormField label="หมายเหตุ">
                <textarea className="form-input resize-none" rows={2} placeholder="หมายเหตุเพิ่มเติม"
                  value={form.note} onChange={e => setField('note', e.target.value)} disabled={saving} />
              </FormField>

              {apiErr && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200">{apiErr}</div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal} className="btn-outline flex-1" disabled={saving}>ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1 disabled:opacity-60" disabled={saving}>
                  {saving ? 'กำลังบันทึก…' : modal.mode === 'add' ? 'เพิ่มอุปกรณ์' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
