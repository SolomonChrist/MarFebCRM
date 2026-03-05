import { Link } from 'react-router-dom';
import { Home, Users, FolderOpen, Bell, Settings, Sun, Moon, LogOut, BarChart3, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore, type Theme } from '../../store/useUIStore';

export default function Sidebar() {
  const { logout, user } = useAuthStore();
  const { sidebarOpen, toggleSidebar, theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <>
      {/* Mobile: Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white md:hidden hover:bg-indigo-700 transition"
      >
        <Home size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 left-0 top-0 h-screen w-64 bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#2d2d2d] flex flex-col transition-transform duration-300 z-40`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-[#2d2d2d]">
          <h1 className="text-2xl font-bold text-indigo-600">MarFebCRM</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personal Relationship Manager</p>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d]">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/" icon={<Home size={20} />} label="Dashboard" />
          <NavLink to="/contacts" icon={<Users size={20} />} label="Contacts" />
          <NavLink to="/relationships" icon={<BarChart3 size={20} />} label="Relationships" />
          <NavLink to="/reminders" icon={<Clock size={20} />} label="Reminders" />
          <NavLink to="/groups" icon={<FolderOpen size={20} />} label="Groups" />
        </nav>

        {/* Settings */}
        <div className="border-t border-gray-200 dark:border-[#2d2d2d] p-4 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition text-gray-700 dark:text-gray-300"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>

          <Link
            to="/settings"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition text-gray-700 dark:text-gray-300"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ to, icon, label }: NavLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
