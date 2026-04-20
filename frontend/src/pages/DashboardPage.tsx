import { startTransition, useState } from 'react';
import { RequestComposer } from '../components/RequestComposer';
import { RequestCard } from '../components/RequestCard';
import type { SessionController } from '../hooks/useSession';
import { useRequestList } from '../hooks/useRequestList';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';

type DashboardPageProps = {
  session: SessionController;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Action failed';
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function DashboardPage({ session }: DashboardPageProps) {
  const viewerId = session.user!.user_id;
  const outgoing = useRequestList('outgoing', true);
  const incoming = useRequestList('incoming', true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');

  async function refreshAll() {
    startTransition(() => {
      outgoing.refresh();
      incoming.refresh();
    });

    await session.refresh();
  }

  async function handlePay(requestId: string) {
    try {
      setActiveAction(`pay:${requestId}`);
      setNotice(null);
      await delay(2200);
      await api.payRequest(requestId);
      setNoticeTone('success');
      setNotice('Payment settled successfully and both dashboards were refreshed.');
      await refreshAll();
    } catch (error) {
      setNoticeTone('error');
      setNotice(getMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDecline(requestId: string) {
    try {
      setActiveAction(`decline:${requestId}`);
      setNotice(null);
      await api.declineRequest(requestId);
      setNoticeTone('success');
      setNotice('Request declined.');
      await refreshAll();
    } catch (error) {
      setNoticeTone('error');
      setNotice(getMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCancel(requestId: string) {
    try {
      setActiveAction(`cancel:${requestId}`);
      setNotice(null);
      await api.cancelRequest(requestId);
      setNoticeTone('success');
      setNotice('Outgoing request cancelled.');
      await refreshAll();
    } catch (error) {
      setNoticeTone('error');
      setNotice(getMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">P2P request cockpit</p>
          <h1>Manage shared expenses, reminders, and money requests in one place.</h1>
          <p>
            The dashboard is split into independent incoming and outgoing queues so the assignment
            flows stay directly testable.
          </p>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Outgoing total</span>
            <strong>{outgoing.total}</strong>
            <p>Track who still owes you money.</p>
          </article>
          <article className="summary-card">
            <span>Incoming total</span>
            <strong>{incoming.total}</strong>
            <p>Review, pay, or decline requests sent to you.</p>
          </article>
          <article className="summary-card">
            <span>Current balance</span>
            <strong>
              {session.account ? formatCurrency(session.account.balance, session.account.currency) : 'Loading'}
            </strong>
            <p>Simulated account state after each pay action.</p>
          </article>
        </div>
      </section>

      {notice ? (
        <div className={`flash-banner flash-${noticeTone}`}>
          <strong>{noticeTone === 'success' ? 'Updated' : 'Attention'}</strong>
          <span>{notice}</span>
        </div>
      ) : null}

      <section className="dashboard-grid">
        <RequestComposer
          onCreated={(request) => {
            setNoticeTone('success');
            setNotice(`Request ${request.request_id.slice(0, 8)} created and ready to share.`);
            startTransition(() => outgoing.refresh());
          }}
        />

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Demo hints</p>
              <h2>Fast ways to verify the assignment</h2>
            </div>
            <span className="helper-chip">Desktop + mobile</span>
          </div>

          <ul className="hint-list">
            <li>Create a request from Alice to Bob, then sign in as Bob to pay it.</li>
            <li>Use the detail page to verify countdown, sender/recipient fields, and final status.</li>
            <li>Search queues by email or phone and filter down to a single status.</li>
          </ul>
        </section>
      </section>

      <section className="lists-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Incoming queue</p>
              <h2>Requests waiting on your action</h2>
            </div>
            <span className="helper-chip">{incoming.total} items</span>
          </div>

          <div className="toolbar">
            <input
              aria-label="Search incoming requests"
              onChange={(event) => incoming.setSearch(event.target.value)}
              placeholder="Search sender"
              value={incoming.search}
            />
            <select onChange={(event) => incoming.setStatus(event.target.value as never)} value={incoming.status}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="DECLINED">Declined</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {incoming.error ? <p className="form-error">{incoming.error}</p> : null}
          {incoming.isLoading ? <p className="empty-state">Loading incoming requests...</p> : null}
          {incoming.isEmpty ? <p className="empty-state">No incoming requests match this filter.</p> : null}

          <div className="request-grid">
            {incoming.requests.map((request) => (
              <RequestCard
                activeAction={activeAction}
                direction="incoming"
                key={request.request_id}
                onCancel={handleCancel}
                onDecline={handleDecline}
                onPay={handlePay}
                request={request}
                viewerId={viewerId}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Outgoing queue</p>
              <h2>Requests you have already sent</h2>
            </div>
            <span className="helper-chip">{outgoing.total} items</span>
          </div>

          <div className="toolbar">
            <input
              aria-label="Search outgoing requests"
              onChange={(event) => outgoing.setSearch(event.target.value)}
              placeholder="Search recipient"
              value={outgoing.search}
            />
            <select onChange={(event) => outgoing.setStatus(event.target.value as never)} value={outgoing.status}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="DECLINED">Declined</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {outgoing.error ? <p className="form-error">{outgoing.error}</p> : null}
          {outgoing.isLoading ? <p className="empty-state">Loading outgoing requests...</p> : null}
          {outgoing.isEmpty ? <p className="empty-state">No outgoing requests match this filter.</p> : null}

          <div className="request-grid">
            {outgoing.requests.map((request) => (
              <RequestCard
                activeAction={activeAction}
                direction="outgoing"
                key={request.request_id}
                onCancel={handleCancel}
                onDecline={handleDecline}
                onPay={handlePay}
                request={request}
                viewerId={viewerId}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
