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

export type VehicleType = 'motor' | 'car' | 'van' | 'tricycle';

export type VehicleVibeId = 'warm' | 'playful' | 'professional' | 'bold' | 'calm' | 'witty';

export interface VehicleVibe {
  id: VehicleVibeId;
  label: string;
  description: string;
}

export interface Me {
  user_id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  full_name: string | null;
  verification_status: VerificationStatus;
  vehicle_type?: VehicleType | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_nickname?: string | null;
  vehicle_vibe?: VehicleVibeId | null;
  last_wash_at?: string | null;
  location_opt_in?: boolean;
  km_since_wash?: number | null;
  last_location_at?: string | null;
}

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

export interface CompanionMessagesResponse {
  messages: CompanionMessage[];
  messages_updated_at?: string | null;
  ai_enabled?: boolean;
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
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationUpdateResponse {
  ok: boolean;
  recorded_at?: string;
  km_since_wash?: number;
  near_branch?: boolean;
  nearest_branch_name?: string | null;
  distance_to_branch_km?: number | null;
  message?: string;
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
