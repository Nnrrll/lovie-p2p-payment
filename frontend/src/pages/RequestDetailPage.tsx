import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusPill } from '../components/StatusPill';
import { useCountdown } from '../hooks/useCountdown';
import { useRequestDetail } from '../hooks/useRequestDetail';
import type { SessionController } from '../hooks/useSession';
import { api } from '../lib/api';
import {
  formatCountdown,
  formatCurrency,
  formatDate,
  getCounterparty,
  isIncomingRequest,
} from '../lib/format';

type RequestDetailPageProps = {
  session: SessionController;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Action failed';
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function RequestDetailPage({ session }: RequestDetailPageProps) {
  const { requestId } = useParams();
  const detail = useRequestDetail(requestId, Boolean(session.user));
  const [activeAction, setActiveAction] = useState<'pay' | 'decline' | 'cancel' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const secondsLeft = useCountdown(detail.data?.expires_at ?? '1970-01-01T00:00:00.000Z');

  if (detail.isLoading) {
    return (
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">Request detail</p>
          <h1>Loading request...</h1>
        </section>
      </main>
    );
  }

  if (detail.error || !detail.data || !session.user) {
    return (
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">Request detail</p>
          <h1>Request unavailable</h1>
          <p>{detail.error ?? 'The request could not be found for this session.'}</p>
          <Link className="link-button" to="/">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const request = detail.data;
  const incoming = isIncomingRequest(request, session.user.user_id);
  const counterparty = getCounterparty(request, session.user.user_id);
  const canPayOrDecline = incoming && request.status === 'PENDING' && secondsLeft > 0;
  const canCancel = !incoming && request.status === 'PENDING' && secondsLeft > 0;

  async function runAction(action: 'pay' | 'decline' | 'cancel') {
    try {
      setActiveAction(action);
      setNotice(null);

      if (action === 'pay') {
        await delay(2200);
        await api.payRequest(request.request_id);
      }

      if (action === 'decline') {
        await api.declineRequest(request.request_id);
      }

      if (action === 'cancel') {
        await api.cancelRequest(request.request_id);
      }

      detail.refresh();
      await session.refresh();
      setNotice(
        action === 'pay'
          ? 'Payment completed successfully.'
          : action === 'decline'
            ? 'Request declined.'
            : 'Request cancelled.',
      );
    } catch (error) {
      setNotice(getMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel detail-panel">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Request detail</p>
            <h1>{formatCurrency(request.amount, request.currency)}</h1>
            <p>
              {incoming ? 'Requested by' : 'Requested from'} <strong>{counterparty.email}</strong>
            </p>
          </div>

          <StatusPill status={request.status} />
        </div>

        {notice ? <div className="flash-banner flash-success">{notice}</div> : null}

        <div className="detail-grid">
          <div className="detail-block">
            <h2>Summary</h2>
            <dl className="meta-grid">
              <div>
                <dt>Sender</dt>
                <dd>{request.requester.email}</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{request.recipient.email}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(request.created_at)}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatCountdown(secondsLeft)}</dd>
              </div>
            </dl>
          </div>

          <div className="detail-block">
            <h2>Context</h2>
            <p className="request-note">{request.memo ?? 'No note was attached.'}</p>
            <p className="detail-link">{request.shareable_link}</p>
          </div>
        </div>

        <div className="action-row detail-actions">
          <Link className="link-button" to="/">
            Back to dashboard
          </Link>

          {canPayOrDecline ? (
            <>
              <button
                className="primary-button"
                disabled={activeAction === 'pay'}
                onClick={() => void runAction('pay')}
                type="button"
              >
                {activeAction === 'pay' ? 'Processing payment...' : 'Pay request'}
              </button>
              <button
                className="secondary-button"
                disabled={activeAction === 'decline'}
                onClick={() => void runAction('decline')}
                type="button"
              >
                {activeAction === 'decline' ? 'Declining...' : 'Decline'}
              </button>
            </>
          ) : null}

          {canCancel ? (
            <button
              className="secondary-button"
              disabled={activeAction === 'cancel'}
              onClick={() => void runAction('cancel')}
              type="button"
            >
              {activeAction === 'cancel' ? 'Cancelling...' : 'Cancel request'}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
