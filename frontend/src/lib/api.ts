const API_BASE = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '');
const SESSION_TOKEN_KEY = 'lovie.session_token';

export type PaymentRequestStatus =
  | 'PENDING'
  | 'PAID'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface User {
  user_id: string;
  email: string;
  phone: string;
}

export interface Account {
  account_id: string;
  user_id: string;
  balance: number;
  currency: string;
  version: number;
  updated_at: string;
}

export interface PaymentRequest {
  request_id: string;
  requester_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  requester: User;
  recipient: User;
  shareable_link: string;
  is_expired: boolean;
  expires_in_seconds: number;
}

export interface PaginatedPaymentRequests {
  requests: PaymentRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  user: User;
  session_token: string;
}

export interface MeResponse {
  user: User;
  account: Account | null;
}

type QueryParams = Record<string, string | number | undefined>;

function buildQueryString(params?: QueryParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = sessionTokenStore.get();
  const headers = new Headers(options?.headers);

  if (options?.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const sessionTokenStore = {
  get() {
    return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
  },
  set(token: string) {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  },
  clear() {
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  },
};

export const api = {
  login(email: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getMe() {
    return request<MeResponse>('/auth/me');
  },

  createRequest(input: {
    recipient_identifier: string;
    amount: number;
    currency: string;
    memo: string | null;
  }) {
    return request<PaymentRequest>('/payment-requests', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getOutgoing(params?: QueryParams) {
    return request<PaginatedPaymentRequests>(`/payment-requests/outgoing${buildQueryString(params)}`);
  },

  getIncoming(params?: QueryParams) {
    return request<PaginatedPaymentRequests>(`/payment-requests/incoming${buildQueryString(params)}`);
  },

  getRequest(requestId: string) {
    return request<PaymentRequest>(`/payment-requests/${requestId}`);
  },

  payRequest(requestId: string) {
    return request<PaymentRequest>(`/payment-requests/${requestId}/pay`, {
      method: 'POST',
    });
  },

  declineRequest(requestId: string) {
    return request<PaymentRequest>(`/payment-requests/${requestId}/decline`, {
      method: 'POST',
    });
  },

  cancelRequest(requestId: string) {
    return request<PaymentRequest>(`/payment-requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },
};
