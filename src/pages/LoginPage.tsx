import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { createUser, getUserByEmail, authenticateUser, unlockSession, userExists } from '../services/auth/authService';
import { initializeDatabase } from '../services/database/db';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'setup' | 'login' | 'unlock';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, unlock, isLoggedIn, user } = useAuthStore();
  const { addToast } = useUIStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [passphraseConfirm, setPassphraseConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in, or if user exists on mount
  useEffect(() => {
    // If user is already logged in, navigate to dashboard
    if (isLoggedIn && user) {
      navigate('/');
      return;
    }

    const checkUserExists = async () => {
      try {
        await initializeDatabase();
        const exists = await userExists();
        if (!exists) {
          setMode('setup');
        }
      } catch (err) {
        console.error('Error checking user existence:', err);
      }
    };
    checkUserExists();
  }, [isLoggedIn, user, navigate]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password || !passphrase || !passphraseConfirm) {
        throw new Error('All fields are required');
      }

      if (passphrase !== passphraseConfirm) {
        throw new Error('Passphrases do not match');
      }

      if (passphrase.length < 8) {
        throw new Error('Passphrase must be at least 8 characters');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const user = await createUser(email, password, passphrase);
      login({ id: user.id, email: user.email });
      addToast({
        message: 'Account created successfully!',
        type: 'success',
      });
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const user = await authenticateUser(email, password);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      login({ id: user.id, email: user.email });
      setMode('unlock');
      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !passphrase) {
        throw new Error('Passphrase is required');
      }

      const user = await getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const key = await unlockSession(passphrase, user);
      if (!key) {
        throw new Error('Invalid passphrase');
      }

      unlock(key);
      addToast({
        message: 'Session unlocked successfully!',
        type: 'success',
      });
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unlock failed';
      setError(message);
      addToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#0f0f0f] dark:to-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-600 rounded-lg mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">MarFebCRM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Personal Relationship Manager</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-[#2d2d2d]">
          {mode === 'setup' && (
            <form onSubmit={handleSetup} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h2>

              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
                icon={<Mail size={20} />}
              />

              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                showToggle={true}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              <InputField
                label="Passphrase (for encrypted notes)"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={setPassphrase}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                showToggle={true}
                onToggleShow={() => setShowPassphrase(!showPassphrase)}
              />

              <InputField
                label="Confirm Passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseConfirm}
                onChange={setPassphraseConfirm}
                placeholder="••••••••"
                icon={<Lock size={20} />}
              />

              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                ℹ️ Your passphrase unlocks encrypted notes. Keep it safe! It cannot be recovered.
              </p>

              {error && <ErrorAlert message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Login</h2>

              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
                icon={<Mail size={20} />}
              />

              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                showToggle={true}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              {error && <ErrorAlert message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {mode === 'unlock' && (
            <form onSubmit={handleUnlock} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Unlock Session</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your passphrase to unlock encrypted notes and complete login.
              </p>

              <InputField
                label="Passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={setPassphrase}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                showToggle={true}
                onToggleShow={() => setShowPassphrase(!showPassphrase)}
              />

              {error && <ErrorAlert message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Unlocking...' : 'Unlock'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  showToggle?: boolean;
  onToggleShow?: () => void;
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  showToggle,
  onToggleShow,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {type === 'password' ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
      {message}
    </div>
  );
}
