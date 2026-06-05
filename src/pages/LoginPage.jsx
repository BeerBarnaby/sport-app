import { useState }          from 'react';
import { loginStudent }      from '../utils/studentAuth';
import { PRIMARY, ACCENT }   from '../utils/constants';

export default function LoginPage({ onLogin }) {
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!studentId.trim() || !firstName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = loginStudent(studentId, firstName);
      setLoading(false);
      if (user) {
        onLogin(user);
      } else {
        setError('ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสนักเรียนหรือชื่อจริง');
      }
    }, 300);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: PRIMARY }}
    >
      {/* Hero */}
      <div className="text-center text-white mb-8">
        <div className="text-6xl mb-4">🏅</div>
        <h1 className="text-2xl font-bold">ระบบยืม-คืนอุปกรณ์กีฬา</h1>
        <p className="text-sm mt-1" style={{ opacity: 0.7 }}>
          โรงเรียนตำรวจตระเวนชายแดน จภ.เชียงราย
        </p>
      </div>

      {/* Card */}
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold mb-5" style={{ color: PRIMARY }}>
          เข้าสู่ระบบ
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">รหัสนักเรียน</label>
            <input
              className="form-input"
              placeholder="เช่น 05272"
              value={studentId}
              onChange={e => { setStudentId(e.target.value); setError(''); }}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="form-label">ชื่อจริงภาษาไทย</label>
            <input
              className="form-input"
              placeholder="เช่น สมชาย"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setError(''); }}
              autoComplete="given-name"
            />
            <p className="text-xs text-gray-400 mt-1">
              กรอกเฉพาะชื่อจริง ไม่ต้องใส่คำนำหน้าและนามสกุล
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
        v1.0 © 2026 จภ.เชียงราย
      </p>
    </div>
  );
}
