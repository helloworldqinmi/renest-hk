import { ViewTransition, type ReactNode } from 'react';

const navigation = {
  'nav-forward': 'page-forward',
  'nav-back': 'page-back',
  default: 'page-neutral',
};

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter={navigation} exit={navigation} update={{ ...navigation, 'nav-neutral': 'page-neutral', default: 'none' }}>
      <div className="route-content">{children}</div>
    </ViewTransition>
  );
}
