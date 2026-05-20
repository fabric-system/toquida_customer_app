import { apiBaseUrl } from '../config';
import { ApiError } from './errors';

const TOKEN_KEY = 'toquida_access_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { parseJson?: boolean } = {},
): Promise<T> {
  const { parseJson = true, headers: initHeaders, ...rest } = init;
  const url = `${apiBaseUrl}${path}`;
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type') && rest.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...rest, headers });
  if (res.status === 204) return undefined as T;

  let parsed: unknown;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : res.statusText || 'Request failed';
    throw new ApiError(msg, res.status, parsed);
  }

  if (!parseJson) return undefined as T;
  return parsed as T;
}
