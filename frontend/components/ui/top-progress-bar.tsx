'use client';

import * as React from 'react';
import NProgress from 'nprogress';

export default function TopProgressBar() {
  React.useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return null;
}
