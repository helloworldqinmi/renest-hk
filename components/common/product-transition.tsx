import type { ReactNode } from 'react';

/** Product content stays in normal DOM flow; navigation never captures the document. */
export function ProductTransition({ children }: { slug: string; children: ReactNode }) {
  return <>{children}</>;
}