'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = content.current;
    const animation = node?.animate([{ opacity: .65, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.22,1,.36,1)' });
    const stopWhenHidden = () => { if (document.hidden) animation?.cancel(); };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => { animation?.cancel(); document.removeEventListener('visibilitychange', stopWhenHidden); };
  }, []);
  return <div ref={content} className="route-content">{children}</div>;
}