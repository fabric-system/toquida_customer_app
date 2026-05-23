/** Human-readable labels for verification enum (draft). */

import type { VerificationStatus } from '../api/types';

const map: Record<VerificationStatus, string> = {
  unverified: 'Not verified',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_update: 'Needs update',
};

export function verificationLabel(s: VerificationStatus | undefined): string {
  if (!s) return '—';
  return map[s] ?? s;
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 45) return 'Just now';
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m}m`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h}h`;
  }
  if (sec < 604800) {
    const d = Math.floor(sec / 86400);
    return `${d}d`;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
