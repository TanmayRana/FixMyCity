import { store } from '@/lib/store';
import { setAccessToken, clearAuth } from '@/lib/store/authSlice';
import { toast } from 'sonner';

const API_BASE = '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { 
      method: 'POST', 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.warn('Token refresh failed:', res.status);
      return null;
    }
    
    const data = await res.json();
    if (data.success && data.token) {
      store.dispatch(setAccessToken(data.token));
      return data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

export async function apiFetch(
  input: string, 
  init: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const state = store.getState();
  let token = state.auth.accessToken;
  const headers = new Headers(init.headers as HeadersInit);
  
  // Set default headers (skip if body is FormData so browser can set boundary)
  const isFormData = typeof FormData !== 'undefined' && (init as any).body instanceof FormData;
  if (!headers.has('Content-Type') && init.method !== 'GET' && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let res = await fetch(API_BASE + input, { 
      ...init, 
      headers, 
      credentials: 'include' 
    });

    // Handle 401 Unauthorized - try to refresh token
    if (res.status === 401 && retryCount === 0) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(API_BASE + input, { 
          ...init, 
          headers, 
          credentials: 'include' 
        });
      } else {
        // Refresh failed, clear auth and redirect
        store.dispatch(clearAuth());
        toast.error('Session expired. Please log in again.');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/role-selection';
        }
        throw new ApiClientError('Authentication failed', 401);
      }
    }

    // Handle server errors with retry logic
    if (res.status >= 500 && retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return apiFetch(input, init, retryCount + 1);
    }

    // Handle client errors
    if (!res.ok) {
      let errorData: ApiError;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
      }
      
      throw new ApiClientError(
        errorData.error || `Request failed with status ${res.status}`,
        res.status,
        errorData
      );
    }

    return res;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    // Network errors - retry if possible
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return apiFetch(input, init, retryCount + 1);
    }
    
    throw new ApiClientError(
      'Network error occurred',
      0,
      { error: error instanceof Error ? error.message : 'Unknown network error' }
    );
  }
}

// Convenience methods
export const apiClient = {
  get: (url: string, options?: RequestInit) => 
    apiFetch(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    apiFetch(url, { ...options, method: 'DELETE' }),
};

export { ApiClientError };

