'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

type MotionLinkProps = ComponentProps<typeof NextLink> & {
  direction?: 'forward' | 'back';
};

/** Keep Next's prefetching, modifier keys, hash links and navigation semantics. */
export default function MotionLink({ href, direction, transitionTypes, ...props }: MotionLinkProps) {
  const pathname = usePathname();
  const target = typeof href === 'string' ? href.split(/[?#]/)[0] : href.pathname;
  const type = direction ? `nav-${direction}`
    : !target || target === pathname ? 'nav-neutral'
    : target === '/' || (pathname.startsWith('/store/') && !target.startsWith('/store/')) ? 'nav-back'
    : 'nav-forward';

  return <NextLink {...props} href={href} transitionTypes={transitionTypes ?? [type]} />;
}
