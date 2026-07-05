'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'efundo-cookie-consent';
const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Loads Google AdSense only after cookie consent and when a client ID is configured.
 * Set NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXX after AdSense approval.
 */
export function AdSenseScript() {
  const [loadAds, setLoadAds] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    function checkConsent() {
      setLoadAds(localStorage.getItem(CONSENT_KEY) === 'accepted');
    }

    checkConsent();
    window.addEventListener('efundo-cookie-consent', checkConsent);
    return () => window.removeEventListener('efundo-cookie-consent', checkConsent);
  }, []);

  if (!CLIENT_ID || !loadAds) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
