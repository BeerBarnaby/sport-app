import { useState }        from 'react';
import { useApp }          from '../context/AppContext';
import EquipmentCard       from '../components/EquipmentCard';
import BorrowFormModal     from '../components/BorrowFormModal';
import { PRIMARY }         from '../utils/constants';

const CATS = ['ทั้งหมด', 'ฟุตบอล', 'บาสเกตบอล', 'วอลเลย์บอล', 'แบดมินตัน', 'ปิงปอง', 'ทั่วไป'];

export default function EquipmentPage() {
  const { equipment }             = useApp();
  const [search, setSearch]       = useState('');
  const [cat, setCat]             = useState('ทั้งหมด');
  const [selected, setSelected]   = useState(null);

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

      {/* Grid */}
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

      {selected && (
        <BorrowFormModal equipment={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
