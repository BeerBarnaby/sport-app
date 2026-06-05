import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children, user: initialUser, onLogout }) {
  const [user]                         = useState(initialUser);
  const [page, setPage]                = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const logout = useCallback(() => { onLogout(); }, [onLogout]);

  const isStaff = user?.userType === 'staff';

  // Staff sees all pending; student sees only their own
  useEffect(() => {
    let query = supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (!isStaff && user?.studentId) {
      query = query.eq('student_id', user.studentId);
    }

    query.then(({ count }) => { if (count !== null) setPendingCount(count); });
  }, [user?.studentId, isStaff]);

  const stats = { available: 0, borrowing: 0, pending: pendingCount, overdue: 0 };

  return (
    <AppContext.Provider value={{
      user,
      page, setPage,
      logout,
      addToast,
      stats,
      toasts, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
