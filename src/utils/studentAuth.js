import { supabase } from '../lib/supabaseClient';

const KEY = 'currentUser';

export async function loginStudent(studentId, firstName) {
  const sid  = String(studentId).trim();
  const name = firstName.trim();

  const { data, error } = await supabase.rpc('login_student', {
    p_student_id: sid,
    p_first_name: name,
  });

  if (error || !data) return null;

  // RPC may return array or single object
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return null;

  // Normalize snake_case → camelCase
  const user = {
    studentId: raw.student_id ?? raw.studentId ?? sid,
    title:     raw.title     ?? '',
    firstName: raw.first_name ?? raw.firstName ?? name,
    lastName:  raw.last_name  ?? raw.lastName  ?? '',
    className: raw.class_name ?? raw.className  ?? '',
    classNo:   raw.class_no   ?? raw.classNo   ?? 0,
    role:      raw.role       ?? 'student',
  };
  const nameParts = [user.title + user.firstName, user.lastName].filter(Boolean);
  user.fullName   = nameParts.join(' ');

  try { localStorage.setItem(KEY, JSON.stringify(user)); } catch { /* ignore */ }
  return user;
}

export function logoutStudent() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
