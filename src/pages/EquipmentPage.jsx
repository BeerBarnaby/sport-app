import { useState, useEffect, useCallback } from 'react';
import { supabase }      from '../lib/supabaseClient';
import EquipmentCard     from '../components/EquipmentCard';
import BorrowFormModal   from '../components/BorrowFormModal';
import { PRIMARY }       from '../utils/constants';

const CATS = ['ทั้งหมด', 'ฟุตบอล', 'บาสเกตบอล', 'วอลเลย์บอล', 'แบดมินตัน', 'ปิงปอง', 'ทั่วไป'];

// Normalize Supabase column names → UI field names
function normalize(item) {
  return {
    id:     item.id,
    name:   item.name                    ?? '',
    cat:    item.cat    ?? item.category  ?? '',
    total:  item.total  ?? item.total_quantity     ?? 0,
    avail:  item.avail  ?? item.available_quantity ?? 0,
    status: item.status                  ?? 'available',
    icon:   item.icon                    ?? '⚽',
    desc:   item.desc   ?? item.description        ?? '',
  };
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [cat,       setCat]       = useState('ทั้งหมด');
  const [selected,  setSelected]  = useState(null);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('equipment')
      .select('*')
      .order('name');
    if (err) {
      setError(err.message);
    } else {
      setEquipment((data ?? []).map(normalize));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.includes(search) || eq.cat.includes(search);
    const matchCat    = cat === 'ทั้งหมด' || eq.cat === cat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>อุปกรณ์กีฬา</h1>
        <p className="text-gray-400 text-xs mt-0.5">เลือกอุปกรณ์ที่ต้องการยืม</p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาอุปกรณ์..."
          className="form-input pl-9"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              cat === c
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-border hover:border-primary/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
              <div className="h-3 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-1.5 bg-gray-100 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-red-600 font-medium mb-1">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button onClick={fetchEquipment} className="btn-primary text-sm px-5 py-2">
            ลองใหม่
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(eq => (
              <EquipmentCard key={eq.id} equipment={eq} onBorrow={setSelected} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">ไม่พบอุปกรณ์ที่ค้นหา</p>
            </div>
          )}
        </>
      )}

      {selected && (
        <BorrowFormModal
          equipment={selected}
          onClose={() => setSelected(null)}
          onBorrowed={fetchEquipment}
        />
      )}
    </div>
  );
}
