import { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_EQUIPMENT, MOCK_REQUESTS, generateRequestId } from '../data/mockData';
import { useToast } from '../components/Toast';

const AppContext = createContext(null);

const MOCK_USER = {
  id: 1,
  name: 'นายสมศักดิ์ ครูดี',
  role: 'teacher',
  email: 'somsak@pcccr.ac.th',
  phone: '053-456-789',
  department: 'กลุ่มสาระพลศึกษา',
  classroom: '-',
};

export function AppProvider({ children }) {
  const [equipment, setEquipment] = useState(MOCK_EQUIPMENT);
  const [requests, setRequests]   = useState(MOCK_REQUESTS);
  const [user, setUser]           = useState(MOCK_USER);
  const [page, setPage]           = useState('dashboard');
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const stats = {
    available: equipment.reduce((s, e) => s + e.avail, 0),
    borrowing: requests.filter(r => ['approved', 'active'].includes(r.status)).length,
    pending:   requests.filter(r => r.status === 'pending').length,
    overdue:   requests.filter(r => r.status === 'overdue').length,
  };

  const addRequest = useCallback((data) => {
    const today = new Date().toISOString().split('T')[0];
    const newReq = {
      id:      generateRequestId(),
      name:    data.borrowerName,
      sid:     data.studentId || '',
      cls:     data.classroom,
      eq:      data.equipmentName,
      eqId:    data.equipmentId,
      qty:     data.quantity,
      borrow:  today,
      ret:     data.dueDate,
      purpose: data.purpose,
      status:  'pending',
      retDate: null,
      cond:    null,
      note:    '',
    };
    setRequests(prev => [newReq, ...prev]);
    setEquipment(prev =>
      prev.map(e =>
        e.id === data.equipmentId
          ? { ...e, avail: Math.max(0, e.avail - data.quantity) }
          : e
      )
    );
    addToast('ส่งคำขอยืมสำเร็จ รอการอนุมัติ', 'success');
  }, [addToast]);

  const updateStatus = useCallback((reqId, newStatus) => {
    setRequests(prev =>
      prev.map(r => {
        if (r.id !== reqId) return r;
        return {
          ...r,
          status:  newStatus,
          retDate: newStatus === 'returned' ? new Date().toISOString().split('T')[0] : r.retDate,
        };
      })
    );

    if (newStatus === 'returned') {
      setRequests(prev => {
        const req = prev.find(r => r.id === reqId);
        if (req) {
          setEquipment(eq =>
            eq.map(e =>
              e.id === req.eqId
                ? { ...e, avail: Math.min(e.total, e.avail + req.qty) }
                : e
            )
          );
        }
        return prev;
      });
      addToast('บันทึกการคืนอุปกรณ์เรียบร้อย', 'success');
    } else if (newStatus === 'approved') {
      addToast('อนุมัติคำขอยืมแล้ว', 'success');
    } else if (newStatus === 'rejected') {
      addToast('ปฏิเสธคำขอยืมแล้ว', 'info');
    }
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      equipment, requests, user, setUser,
      page, setPage,
      stats, addRequest, updateStatus,
      toasts, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
