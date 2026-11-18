export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://aashi-8uri.onrender.com').replace(/\/$/, '');
const BASE_URL = `${BACKEND_URL}/api`;

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
  const token = localStorage.getItem('duvora_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${normalizedEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || res.statusText || 'Request failed';
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}
