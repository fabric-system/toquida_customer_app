import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as backend from '../api/backend';

const SAMPLE_INTERVAL_MS = 5 * 60 * 1000;

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 60_000,
      timeout: 20_000,
    });
  });
}

export function useLocationCompanion(enabled: boolean) {
  const qc = useQueryClient();
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    async function sample() {
      if (busy.current || document.visibilityState !== 'visible') return;
      busy.current = true;
      try {
        const pos = await readPosition();
        await backend.postLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        });
        void qc.invalidateQueries({ queryKey: ['companion-messages'] });
        void qc.invalidateQueries({ queryKey: ['me'] });
      } catch {
        /* permission denied or transient GPS error */
      } finally {
        busy.current = false;
      }
    }

    void sample();
    const timer = window.setInterval(() => void sample(), SAMPLE_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === 'visible') void sample();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, qc]);
}

export async function requestLocationPermission(): Promise<void> {
  await readPosition();
}
