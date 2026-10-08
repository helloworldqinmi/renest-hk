'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';

type MotionLinkProps = ComponentProps<typeof NextLink> & { direction?: 'forward' | 'back' };

/** Keep Next prefetching, modifier keys, hash links and normal navigation semantics. */
export default function MotionLink({ direction, transitionTypes, ...props }: MotionLinkProps) {
  void direction;
  void transitionTypes;
  return <NextLink {...props} />;
}