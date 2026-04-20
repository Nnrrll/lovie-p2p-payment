import { Link } from 'react-router-dom';
import type { PaymentRequest } from '../lib/api';
import { formatCountdown, formatCurrency, formatDate, getCounterparty } from '../lib/format';
import { useCountdown } from '../hooks/useCountdown';
import { StatusPill } from './StatusPill';

type RequestCardProps = {
  activeAction: string | null;
  direction: 'incoming' | 'outgoing';
  onCancel: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onPay: (requestId: string) => void;
  request: PaymentRequest;
  viewerId: string;
};

export function RequestCard({
  activeAction,
  direction,
  onCancel,
  onDecline,
  onPay,
  request,
  viewerId,
}: RequestCardProps) {
  const counterparty = getCounterparty(request, viewerId);
  const secondsLeft = useCountdown(request.expires_at);
  const isPending = request.status === 'PENDING' && secondsLeft > 0;

  return (
    <article className="request-card">
      <div className="request-card-top">
        <div>
          <p className="eyebrow">{direction === 'incoming' ? 'From' : 'To'}</p>
          <strong>{counterparty.email}</strong>
          <p>{counterparty.phone}</p>
        </div>

        <StatusPill status={request.status} />
      </div>

      <div className="amount-line">{formatCurrency(request.amount, request.currency)}</div>
      <p className="request-note">{request.memo ?? 'No note attached.'}</p>

      <dl className="meta-grid">
        <div>
          <dt>Created</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>{formatCountdown(secondsLeft)}</dd>
        </div>
      </dl>

      <div className="action-row">
        <Link className="link-button" to={`/requests/${request.request_id}`}>
          View details
        </Link>

        {direction === 'incoming' && isPending ? (
          <>
            <button
              className="primary-button"
              disabled={activeAction === `pay:${request.request_id}`}
              onClick={() => onPay(request.request_id)}
              type="button"
            >
              {activeAction === `pay:${request.request_id}` ? 'Processing...' : 'Pay'}
            </button>
            <button
              className="secondary-button"
              disabled={activeAction === `decline:${request.request_id}`}
              onClick={() => onDecline(request.request_id)}
              type="button"
            >
              {activeAction === `decline:${request.request_id}` ? 'Declining...' : 'Decline'}
            </button>
          </>
        ) : null}

        {direction === 'outgoing' && isPending ? (
          <button
            className="secondary-button"
            disabled={activeAction === `cancel:${request.request_id}`}
            onClick={() => onCancel(request.request_id)}
            type="button"
          >
            {activeAction === `cancel:${request.request_id}` ? 'Cancelling...' : 'Cancel'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
