'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { ResponsiveBreakpoint } from '@/types';

const ResponsiveContext = createContext<ResponsiveBreakpoint>({
  mobile: false,
  tablet: false,
  desktop: true
});

export const useResponsive = () => useContext(ResponsiveContext);

interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider = ({ children }: ResponsiveProviderProps) => {
  const [breakpoint, setBreakpoint] = useState<ResponsiveBreakpoint>({
    mobile: false,
    tablet: false,
    desktop: true
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoint({
        mobile: width <= 767,
        tablet: width >= 768 && width <= 1279,
        desktop: width >= 1280
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ResponsiveContext.Provider value={breakpoint}>
      {children}
    </ResponsiveContext.Provider>
  );
};