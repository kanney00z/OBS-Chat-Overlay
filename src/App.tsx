/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import OverlayView from './components/OverlayView';
import DonationPageView from './components/DonationPageView';

export default function App() {
  const [isOverlay, setIsOverlay] = useState(false);
  const [isDonate, setIsDonate] = useState(false);

  useEffect(() => {
    const handleUrlCheck = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const isOverlayRoute = 
        params.get('overlay') === 'true' || 
        params.get('mode') === 'overlay' || 
        hash === '#overlay';
      
      const isDonateRoute = 
        params.get('donate') === 'true' || 
        params.get('mode') === 'donate' || 
        hash === '#donate';
      
      setIsOverlay(isOverlayRoute);
      setIsDonate(isDonateRoute);
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  if (isOverlay) {
    // Pure, untangled overlay for directly embedding in OBS
    return <OverlayView />;
  }

  if (isDonate) {
    // Public page where viewers can generate QR codes and send donations in real-time
    return <DonationPageView />;
  }

  // Visual customizer dashboard
  return <DashboardView />;
}

