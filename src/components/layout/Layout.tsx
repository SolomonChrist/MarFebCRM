import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/ToastContainer';
import FloatingPasteButton from '../FloatingPasteButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0f0f0f] transition-theme">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ToastContainer />
      <FloatingPasteButton />
    </div>
  );
}
