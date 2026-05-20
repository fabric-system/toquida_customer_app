/** Aligns with `docs/carwash-cloud-api-draft.md` / `docs/toquida-customer-app-mvp.md` (draft). */

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_update';

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface Me {
  user_id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  verification_status: VerificationStatus;
  vehicle_type?: VehicleType | null;
  vehicle_nickname?: string | null;
  vehicle_personality?: string | null;
  last_wash_at?: string | null;
}

export type VehicleType = 'motor' | 'car' | 'van' | 'tricycle';

export interface VerificationStep {
  id: 'full_name' | 'rfid_tag' | 'face_enrollment' | 'vehicle_profile';
  complete: boolean;
}

export interface VerificationDetails {
  status: VerificationStatus;
  message?: string;
  updated_at?: string;
  steps?: VerificationStep[];
  progress?: { completed: number; total: number };
  all_complete?: boolean;
  last_wash_at?: string | null;
}

export interface CompanionMessage {
  message_id: string;
  from_name: string;
  body: string;
  kind: 'wash_reminder' | 'wash_fresh';
  created_at: string;
}

export interface Balance {
  balance: number;
  unit: string;
  as_of: string;
  stale?: boolean;
}

export interface Transaction {
  transaction_id: string;
  type: string;
  amount: number;
  unit: string;
  status: string;
  created_at: string;
  summary?: string;
}

export type ClaimAction = 'link_tag' | 'dispense_tag';

export interface ClaimCode {
  claim_code_id: string;
  display_code: string;
  action: ClaimAction;
  status: string;
  expires_at: string;
}

export interface Tag {
  tag_id: string;
  status: string;
  label?: string;
  linked_at?: string;
}

export interface Branch {
  branch_id: string;
  name: string;
  address?: string;
  hours?: string;
  phone?: string;
}

export interface SupportMessage {
  message_id: string;
  branch_id?: string | null;
  direction: 'customer' | 'admin';
  body: string;
  created_at: string;
}

export interface RegisterBody {
  phone: string;
  email?: string;
  password: string;
  display_name: string;
  accept_terms: boolean;
}

export interface LoginBody {
  login: string;
  password: string;
}

export interface ClaimCreateBody {
  action: ClaimAction;
}

export interface FaceEnrollmentStatus {
  status: 'enrolled' | 'not_enrolled';
  model_version?: string;
  updated_at?: string;
  cloud_face_key?: string;
  claim_code?: ClaimCode;
}

export interface FaceEnrollBody {
  accept_biometrics: boolean;
  image_base64?: string;
  embedding?: number[];
  model_version?: string;
}
