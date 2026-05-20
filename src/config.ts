const rawBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** Base URL for the product backend (no trailing slash). Empty in mock-only dev. */
export const apiBaseUrl = (rawBase ?? '').replace(/\/$/, '');

/** When true, API calls use in-browser fixtures (see `src/api/backend.ts`). */
export const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';

export const appName = 'Toquida';
