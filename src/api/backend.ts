import { useMockApi } from '../config';
import { apiFetch } from './http';
import type {
  AuthTokens,
  Balance,
  Branch,
  ClaimCode,
  ClaimCreateBody,
  CompanionMessage,
  CompanionMessagesResponse,
  FaceEnrollBody,
  FaceEnrollmentStatus,
  LoginBody,
  Me,
  RegisterBody,
  SupportMessage,
  Tag,
  Transaction,
  VehicleVibe,
  VerificationDetails,
} from './types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_ME_KEY = 'toquida_mock_me';
const MOCK_BAL_KEY = 'toquida_mock_balance';

function readStoredMockUser(): Me | null {
  try {
    const raw = sessionStorage.getItem(MOCK_ME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Me;
  } catch {
    return null;
  }
}

function writeStoredMockUser(u: Me | null): void {
  try {
    if (u) sessionStorage.setItem(MOCK_ME_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(MOCK_ME_KEY);
  } catch {
    /* ignore */
  }
}

function readStoredMockBalance(): number | null {
  try {
    const raw = sessionStorage.getItem(MOCK_BAL_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Mock session (in-memory + sessionStorage for refresh). */
let mockUser: Me | null = null;
let mockBalance = readStoredMockBalance() ?? 0;
const mockTx: Transaction[] = [
  {
    transaction_id: 'tx_demo_1',
    type: 'topup',
    amount: 100,
    unit: 'PHP',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    summary: 'Coin top-up (kiosk)',
  },
  {
    transaction_id: 'tx_demo_2',
    type: 'usage',
    amount: -50,
    unit: 'PHP',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    summary: 'Wash service',
  },
];

const mockTags: Tag[] = [
  {
    tag_id: 'tag_demo_1',
    status: 'active',
    label: 'RFID tag',
    linked_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const mockBranches: Branch[] = [
  {
    branch_id: 'br_main',
    name: 'Toquida Main',
    address: 'Brgy. Marcelino Memije',
    hours: 'Mon-Sun 7:00-20:00',
  },
];

const mockSupportMessages: SupportMessage[] = [];

function nextClaimCode(action: ClaimCode['action']): ClaimCode {
  const n = Math.floor(100000 + Math.random() * 900000);
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return {
    claim_code_id: `claim_${Date.now()}`,
    display_code: String(n),
    action,
    status: 'issued',
    expires_at: expires,
  };
}

async function mockRegister(body: RegisterBody): Promise<AuthTokens> {
  await delay(400);
  mockUser = {
    user_id: 'user_demo',
    email: body.email?.trim() || null,
    phone: body.phone,
    display_name: body.display_name,
    full_name: null,
    verification_status: 'unverified',
  };
  writeStoredMockUser(mockUser);
  return { access_token: 'mock-access-token', expires_in: 3600 };
}

async function mockLogin(body: LoginBody): Promise<AuthTokens> {
  await delay(350);
  if (!mockUser) {
    mockUser = {
      user_id: 'user_demo',
      email: body.login.includes('@') ? body.login : null,
      phone: body.login.includes('@') ? null : body.login,
      display_name: 'Demo customer',
      full_name: null,
      verification_status: 'verified',
    };
  }
  writeStoredMockUser(mockUser);
  return { access_token: 'mock-access-token', expires_in: 3600 };
}

export async function register(body: RegisterBody): Promise<AuthTokens> {
  if (useMockApi) return mockRegister(body);
  return apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginBody): Promise<AuthTokens> {
  if (useMockApi) return mockLogin(body);
  return apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  if (useMockApi) {
    await delay(120);
    mockUser = null;
    writeStoredMockUser(null);
    try {
      sessionStorage.removeItem(MOCK_BAL_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await apiFetch('/auth/logout', { method: 'POST', body: '{}' });
  } catch {
    /* best-effort */
  }
}

export async function getMe(): Promise<Me> {
  if (useMockApi) {
    await delay(200);
    if (!mockUser) mockUser = readStoredMockUser();
    if (!mockUser) throw new Error('Not signed in');
    return mockUser;
  }
  return apiFetch<Me>('/me');
}

export async function patchMe(
  patch: Partial<
    Pick<
      Me,
      | 'display_name'
      | 'full_name'
      | 'vehicle_type'
      | 'vehicle_brand'
      | 'vehicle_model'
      | 'vehicle_nickname'
      | 'vehicle_vibe'
    >
  >,
): Promise<Me> {
  if (useMockApi) {
    await delay(250);
    if (!mockUser) mockUser = readStoredMockUser();
    if (!mockUser) throw new Error('Not signed in');
    mockUser = { ...mockUser, ...patch };
    writeStoredMockUser(mockUser);
    return mockUser;
  }
  return apiFetch<Me>('/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function getVerification(): Promise<VerificationDetails> {
  if (useMockApi) {
    await delay(180);
    if (!mockUser) mockUser = readStoredMockUser();
    if (!mockUser) throw new Error('Not signed in');
    const steps = [
      { id: 'full_name' as const, complete: Boolean(mockUser.full_name) },
      { id: 'rfid_tag' as const, complete: mockTags.some((t) => t.status === 'active') },
      { id: 'face_enrollment' as const, complete: false },
      {
        id: 'vehicle_profile' as const,
        complete: Boolean(
          mockUser.vehicle_type &&
            mockUser.vehicle_brand &&
            mockUser.vehicle_model &&
            mockUser.vehicle_nickname &&
            mockUser.vehicle_vibe,
        ),
      },
    ];
    const completed = steps.filter((s) => s.complete).length;
    return {
      status: mockUser.verification_status,
      message: `Complete ${completed} of ${steps.length} steps (mock).`,
      updated_at: new Date().toISOString(),
      steps,
      progress: { completed, total: steps.length },
      all_complete: completed === steps.length,
    };
  }
  return apiFetch<VerificationDetails>('/me/verification');
}

export async function getVehicleVibes(): Promise<VehicleVibe[]> {
  const fallback: VehicleVibe[] = [
    { id: 'warm', label: 'Warm', description: 'Friendly, caring reminders with a personal touch.' },
    { id: 'playful', label: 'Playful', description: 'Light and upbeat — keeps wash reminders cheerful.' },
    { id: 'professional', label: 'Professional', description: 'Clear, polite, and concise service updates.' },
    { id: 'bold', label: 'Bold', description: 'Direct and confident — gets straight to the point.' },
    { id: 'calm', label: 'Calm', description: 'Soft, low-pressure reminders without urgency.' },
    { id: 'witty', label: 'Witty', description: 'Clever and charming — still respectful.' },
  ];
  if (useMockApi) {
    await delay(120);
    return fallback;
  }
  try {
    const data = await apiFetch<{ items?: VehicleVibe[] } | VehicleVibe[]>('/me/vehicle-vibes');
    const items = Array.isArray(data) ? data : data.items ?? [];
    return items.length ? items : fallback;
  } catch {
    return fallback;
  }
}

export async function getCompanionMessages(): Promise<CompanionMessagesResponse> {
  if (useMockApi) {
    await delay(160);
    if (!mockUser?.vehicle_nickname) {
      return { messages: [], ai_enabled: false };
    }
    return {
      ai_enabled: false,
      messages: [
        {
          message_id: 'cmp_mock_1',
          from_name: mockUser.vehicle_nickname,
          body: `Uy ${mockUser.display_name ?? 'boss'}, audition ako for PinakMaduming Sasakyan — save mo naman ako sa Toquida?`,
          kind: 'wash_reminder',
          source: 'template',
          created_at: new Date().toISOString(),
        },
      ],
    };
  }
  const data = await apiFetch<CompanionMessagesResponse | CompanionMessage[]>(
    '/me/companion-messages',
  );
  if (Array.isArray(data)) {
    return { messages: data, ai_enabled: false };
  }
  return {
    messages: data.messages ?? [],
    ai_enabled: Boolean(data.ai_enabled),
  };
}

export async function getBalance(): Promise<Balance> {
  if (useMockApi) {
    await delay(160);
    const stored = readStoredMockBalance();
    if (stored != null) mockBalance = stored;
    return {
      balance: mockBalance,
      unit: 'PHP',
      as_of: new Date().toISOString(),
      stale: false,
    };
  }
  return apiFetch<Balance>('/me/balance');
}

export async function getTransactions(): Promise<Transaction[]> {
  if (useMockApi) {
    await delay(220);
    return [...mockTx];
  }
  const rows = await apiFetch<Transaction[] | { items?: Transaction[] }>(
    '/me/transactions',
  );
  return Array.isArray(rows) ? rows : rows.items ?? [];
}

export async function createClaimCode(body: ClaimCreateBody): Promise<ClaimCode> {
  if (useMockApi) {
    await delay(300);
    return nextClaimCode(body.action);
  }
  return apiFetch<ClaimCode>('/me/claim-codes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTags(): Promise<Tag[]> {
  if (useMockApi) {
    await delay(200);
    return [...mockTags];
  }
  const rows = await apiFetch<Tag[] | { items?: Tag[] }>('/me/tags');
  return Array.isArray(rows) ? rows : rows.items ?? [];
}

export async function getFaceEnrollment(): Promise<FaceEnrollmentStatus> {
  if (useMockApi) {
    await delay(120);
    return { status: 'not_enrolled' };
  }
  return apiFetch<FaceEnrollmentStatus>('/me/face-enrollment');
}

export async function enrollFace(body: FaceEnrollBody): Promise<FaceEnrollmentStatus> {
  if (useMockApi) {
    await delay(400);
    return {
      status: 'enrolled',
      model_version: 'mobilefacenet_v1',
      updated_at: new Date().toISOString(),
      cloud_face_key: 'cloud_user_demo',
    };
  }
  return apiFetch<FaceEnrollmentStatus>('/me/face-enrollment', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function resetFaceEnrollment(): Promise<{ status: string }> {
  if (useMockApi) {
    await delay(200);
    return { status: 'reset' };
  }
  return apiFetch<{ status: string }>('/me/face-enrollment', { method: 'DELETE' });
}

export async function getBranches(): Promise<Branch[]> {
  if (useMockApi) {
    await delay(180);
    return [...mockBranches];
  }
  const rows = await apiFetch<Branch[] | { items?: Branch[] }>('/branches');
  return Array.isArray(rows) ? rows : rows.items ?? [];
}

export async function getBranch(branchId: string): Promise<Branch> {
  if (useMockApi) {
    await delay(120);
    const b = mockBranches.find((x) => x.branch_id === branchId);
    if (!b) throw new Error('Branch not found');
    return b;
  }
  return apiFetch<Branch>(`/branches/${encodeURIComponent(branchId)}`);
}

export async function getSupportMessages(branchId?: string): Promise<SupportMessage[]> {
  if (useMockApi) {
    await delay(160);
    if (!branchId) return [...mockSupportMessages];
    return mockSupportMessages.filter((m) => m.branch_id === branchId);
  }
  const qs = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';
  const rows = await apiFetch<SupportMessage[] | { items?: SupportMessage[] }>(
    `/me/support-messages${qs}`,
  );
  return Array.isArray(rows) ? rows : rows.items ?? [];
}

export async function sendSupportMessage(body: {
  branch_id?: string;
  body: string;
}): Promise<SupportMessage> {
  if (useMockApi) {
    await delay(220);
    const msg: SupportMessage = {
      message_id: `msg_${Date.now()}`,
      branch_id: body.branch_id ?? null,
      direction: 'customer',
      body: body.body,
      created_at: new Date().toISOString(),
    };
    mockSupportMessages.push(msg);
    mockSupportMessages.push({
      message_id: `msg_${Date.now()}_auto`,
      branch_id: body.branch_id ?? null,
      direction: 'admin',
      body: 'Thanks for your message. An admin will reply soon during branch hours (Mon-Sun 7:00-20:00).',
      created_at: new Date(Date.now() + 1000).toISOString(),
    });
    return msg;
  }
  return apiFetch<SupportMessage>('/me/support-messages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
