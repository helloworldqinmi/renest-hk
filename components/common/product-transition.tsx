import { ViewTransition, type ReactNode } from 'react';

export function ProductTransition({ slug, children }: { slug: string; children: ReactNode }) {
  return <ViewTransition key={slug} name={`product-${slug}`} default="none" share="product-morph">{children}</ViewTransition>;
}
