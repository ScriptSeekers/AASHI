const RAW_BACKEND = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = RAW_BACKEND ? `${RAW_BACKEND}/api` : '/api';

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('aashi_token') || localStorage.getItem('duvora_token');
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${BASE_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg =
      (typeof data === 'object' && data && (data.message || data.error)) ||
      (typeof data === 'string' && data.length < 200 && data.trim()) ||
      res.statusText ||
      `Request failed (HTTP ${res.status})`;
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}
