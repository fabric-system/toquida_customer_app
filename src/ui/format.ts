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
