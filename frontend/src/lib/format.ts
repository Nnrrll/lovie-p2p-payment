import type { PaymentRequest } from './api';

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatCountdown(seconds: number) {
  if (seconds <= 0) {
    return 'Expired';
  }

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export function getCounterparty(request: PaymentRequest, viewerId: string) {
  return request.requester.user_id === viewerId ? request.recipient : request.requester;
}

export function isIncomingRequest(request: PaymentRequest, viewerId: string) {
  return request.recipient.user_id === viewerId;
}
