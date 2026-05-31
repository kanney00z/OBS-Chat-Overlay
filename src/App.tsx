/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import OverlayView from './components/OverlayView';

export default function App() {
  const [isOverlay, setIsOverlay] = useState(false);

  useEffect(() => {
    const handleUrlCheck = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const isOverlayRoute = 
        params.get('overlay') === 'true' || 
        params.get('mode') === 'overlay' || 
        hash === '#overlay';
      
      setIsOverlay(isOverlayRoute);
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  if (isOverlay) {
    // Pure, untangled overlay for directly embedding in OBS
    return <OverlayView />;
  }

  // Visual customizer dashboard
  return <DashboardView />;
}

