import { useEffect, useState } from 'react';

import { BREAKPOINTS } from './constant';

export const useWindowSize = () => {
  const [size, setSize] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop'; // fallback
    const width = window.innerWidth;
    if (width < BREAKPOINTS['mobile']) return 'mobile';
    if (width >= BREAKPOINTS['mobile'] && width < BREAKPOINTS['tablet']) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS['mobile']) setSize('mobile');
      else if (width >= BREAKPOINTS['mobile'] && width < BREAKPOINTS['tablet']) setSize('tablet');
      else setSize('desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { size };
};
