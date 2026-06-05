import Sidebar              from './Sidebar';
import BottomNav             from './BottomNav';
import Toast                 from './Toast';
import { useApp }            from '../context/AppContext';
import Dashboard             from '../pages/Dashboard';
import EquipmentPage         from '../pages/EquipmentPage';
import ManageEquipmentPage   from '../pages/ManageEquipmentPage';
import RequestsPage          from '../pages/RequestsPage';
import ReportsPage           from '../pages/ReportsPage';
import ProfilePage           from '../pages/ProfilePage';

const PAGES = {
  dashboard:        Dashboard,
  equipment:        EquipmentPage,
  'manage-equipment': ManageEquipmentPage,
  requests:         RequestsPage,
  reports:          ReportsPage,
  profile:          ProfilePage,
};

export default function Layout() {
  const { user, page, toasts, removeToast } = useApp();
  const isStaff = user?.userType === 'staff';

  // Guard: students cannot access manage-equipment
  const safePage = (page === 'manage-equipment' && !isStaff) ? 'dashboard' : page;
  const Page = PAGES[safePage] ?? Dashboard;

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        <div key={safePage} className="page-enter">
          <Page />
        </div>
      </main>
      <BottomNav />
      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
