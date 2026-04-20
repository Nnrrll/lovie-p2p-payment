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
  status: 'Active' | 'Inactive' | 'Deleted';
  created_at: Date;
}

export interface UserSummary {
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
  updated_at: Date;
}

export interface PaymentRequestRecord {
  request_id: string;
  requester_id: string;
  recipient_id: string;
  amount: number;
  currency: string;
  status: PaymentRequestStatus;
  memo: string | null;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
}

export interface PaymentRequestDetails extends PaymentRequestRecord {
  requester: UserSummary;
  recipient: UserSummary;
  shareable_link: string;
  is_expired: boolean;
  expires_in_seconds: number;
}

export interface PaginatedPaymentRequests {
  requests: PaymentRequestDetails[];
  total: number;
  page: number;
  limit: number;
}

export interface Session {
  user_id: string;
  email: string;
  created_at: number;
}
