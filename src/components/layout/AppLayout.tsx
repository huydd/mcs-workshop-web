// components/layout/AppLayout.tsx
import { ReactNode } from 'react';
import { ResponsiveProvider } from './ResponsiveContainer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <ResponsiveProvider>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <div className="flex">
          <Sidebar />
          <MobileSidebar />
          <main className="flex-1 lg:ml-64">
            <div className="container mx-auto px-4 py-6 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ResponsiveProvider>
  );
};