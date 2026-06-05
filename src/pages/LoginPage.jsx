import { useState } from "react";
import { loginStudent, loginStaff } from "../utils/studentAuth";
import { PRIMARY } from "../utils/constants";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("student");

  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const isEmpty =
      mode === "student"
        ? !studentId.trim() || !firstName.trim()
        : !username.trim() || !accessCode.trim();

    if (isEmpty) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);
    try {
      const user =
        mode === "student"
          ? await loginStudent(studentId, firstName)
          : await loginStaff(username, accessCode);

      if (user) {
        onLogin(user);
      } else {
        setError(
          mode === "student"
            ? "ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสนักเรียนหรือชื่อจริง"
            : "ไม่พบบัญชีผู้ใช้ กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสประจำตัว",
        );
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setStudentId("");
    setFirstName("");
    setUsername("");
    setAccessCode("");
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
          โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เชียงราย
        </p>
      </div>

      {/* Card */}
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold mb-4" style={{ color: PRIMARY }}>
          เข้าสู่ระบบ
        </h2>

        {/* Mode toggle */}
        <div
          className="flex rounded-xl border p-0.5 mb-5"
          style={{ borderColor: `${PRIMARY}30` }}
        >
          {[
            { value: "student", label: "นักเรียน" },
            { value: "staff", label: "ครูผู้ดูแลระบบ" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                mode === value
                  ? { background: PRIMARY, color: "#fff" }
                  : { color: "#6b7280" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "student" ? (
            <>
              <div>
                <label className="form-label">รหัสนักเรียน</label>
                <input
                  className="form-input"
                  placeholder="เช่น 09999"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="form-label">ชื่อจริงภาษาไทย</label>
                <input
                  className="form-input"
                  placeholder="เช่น สมชาย"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  autoComplete="given-name"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  กรอกเฉพาะชื่อจริง ไม่ต้องใส่คำนำหน้าและนามสกุล
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="form-label">ชื่อผู้ใช้</label>
                <input
                  className="form-input"
                  placeholder="ชื่อผู้ใช้งาน"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="form-label">รหัสประจำตัว</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="รหัสประจำตัว"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
          >
            {loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>

      <p className="text-xs mt-8" style={{ color: "rgba(255,255,255,0.4)" }}>
        v1.0 © 2026 จภ.เชียงราย
      </p>
    </div>
  );
}
