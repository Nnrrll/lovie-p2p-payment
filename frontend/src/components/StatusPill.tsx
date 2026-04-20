import type { PaymentRequestStatus } from '../lib/api';

type StatusPillProps = {
  status: PaymentRequestStatus;
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
