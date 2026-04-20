export interface CreatePaymentRequestBody {
  recipient_identifier: string;
  amount: number | string;
  currency?: string;
  memo?: string | null;
}

export interface ListPaymentRequestsQuery {
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}
