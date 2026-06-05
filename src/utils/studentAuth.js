import { STUDENTS } from '../data/students';

const KEY = 'currentUser';

export function loginStudent(studentId, firstName) {
  const sid  = String(studentId).trim();
  const name = firstName.trim();

  const found = STUDENTS.find(
    s => s.studentId === sid && s.firstName === name
  );
  if (!found) return null;

  const nameParts = [found.title + found.firstName, found.lastName].filter(Boolean);
  const user = { ...found, fullName: nameParts.join(' ') };

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
