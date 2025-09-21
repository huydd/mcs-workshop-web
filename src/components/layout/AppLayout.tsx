'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ResponsiveProvider } from './ResponsiveContainer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '@/context/auth-context';
import { WorkflowProvider } from '@/context/workflow-context';

const AUTH_ROUTES = ['/login'];

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, requestedPath, setRequestedPath } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!user && !isAuthRoute) {
      setRequestedPath(pathname);
      router.replace('/login');
    }
  }, [user, isAuthRoute, pathname, router, setRequestedPath]);

  useEffect(() => {
    if (user && isAuthRoute) {
      const target =
        requestedPath && requestedPath !== '/login'
          ? requestedPath
          : '/project';
      router.replace(target);
    }
  }, [user, isAuthRoute, router, requestedPath]);

  useEffect(() => {
    if (user && !isAuthRoute && requestedPath) {
      setRequestedPath(null);
    }
  }, [user, isAuthRoute, requestedPath, setRequestedPath]);

  if (isAuthRoute) {
    return (
      <ResponsiveProvider>
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </ResponsiveProvider>
    );
  }

  if (!user) {
    return (
      <ResponsiveProvider>
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
          <p className="text-sm text-[#616161]">Đang chuyển hướng...</p>
        </div>
      </ResponsiveProvider>
    );
  }

  return (
    <ResponsiveProvider>
      <WorkflowProvider>
        <div className="min-h-screen bg-[#F7F7F7]">
          <Header />
          <Sidebar />
          <main className="pt-[100px] lg:pl-64">
            <div className="container mx-auto px-4 py-6 lg:px-6 min-h-[calc(100vh-100px)] flex flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </main>
        </div>
      </WorkflowProvider>
    </ResponsiveProvider>
  );
};
