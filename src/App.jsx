import { useState }                      from 'react';
import { AppProvider }                   from './context/AppContext';
import Layout                            from './components/Layout';
import LoginPage                         from './pages/LoginPage';
import { getCurrentUser, logoutStudent } from './utils/studentAuth';

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());

  const handleLogin  = (u) => setUser(u);
  const handleLogout = ()  => { logoutStudent(); setUser(null); };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppProvider user={user} onLogout={handleLogout}>
      <Layout />
    </AppProvider>
  );
}
