import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ContactsPage from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import GroupsPage from './pages/Groups';
import RelationshipDashboard from './pages/RelationshipDashboard';
import SettingsPage from './pages/Settings';
import Layout from './components/layout/Layout';

export default function App() {
  const { isLoggedIn } = useAuthStore();
  const { setTheme, theme } = useUIStore();

  useEffect(() => {
    // Apply theme on mount and when theme changes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system: use prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={isLoggedIn ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/contacts"
          element={isLoggedIn ? <Layout><ContactsPage /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/contacts/:id"
          element={isLoggedIn ? <Layout><ContactDetail /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/groups"
          element={isLoggedIn ? <Layout><GroupsPage /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/relationships"
          element={isLoggedIn ? <Layout><RelationshipDashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={isLoggedIn ? <Layout><SettingsPage /></Layout> : <Navigate to="/login" />}
        />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
