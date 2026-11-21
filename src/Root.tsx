import React from 'react';

import App from './App';

export default function Root({ address }: { address: string }) {
  React.useEffect(() => {
    document.documentElement.classList.add('preload');

    const timer = window.setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);

    const handleLoad = () => {
      document.documentElement.classList.remove('preload');
    };

    if (document.readyState === 'complete') {
      document.documentElement.classList.remove('preload');
      window.clearTimeout(timer);
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return <App address={address} />;
}
