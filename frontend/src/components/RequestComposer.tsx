import { type FormEvent, useState } from 'react';
import { api, type PaymentRequest } from '../lib/api';

type RequestComposerProps = {
  onCreated: (request: PaymentRequest) => void;
};

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not create the request';
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9()\-\s]{10,20}$/;

export function RequestComposer({ onCreated }: RequestComposerProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<PaymentRequest | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedRecipient = recipient.trim();
    const numericAmount = Number(amount);

    if (!emailRegex.test(trimmedRecipient) && !phoneRegex.test(trimmedRecipient)) {
      setError('Enter a valid email or phone number');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await api.createRequest({
        recipient_identifier: trimmedRecipient,
        amount: Number(numericAmount.toFixed(2)),
        currency: 'USD',
        memo: memo.trim() || null,
      });

      setCreatedRequest(response);
      setRecipient('');
      setAmount('');
      setMemo('');
      onCreated(response);
    } catch (submitError) {
      setError(getMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyShareLink() {
    if (!createdRequest) {
      return;
    }

    await navigator.clipboard.writeText(createdRequest.shareable_link);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Create request</p>
          <h2>Ask for money without leaving the dashboard</h2>
        </div>
        <span className="helper-chip">7 day expiry</span>
      </div>

      <form className="composer-form" data-testid="request-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Recipient email or phone</span>
          <input
            autoComplete="off"
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="friend@example.com or +1 555 555 0102"
            value={recipient}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Amount</span>
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="50.00"
              value={amount}
            />
          </label>

          <label className="field">
            <span>Currency</span>
            <input disabled value="USD" />
          </label>
        </div>

        <label className="field">
          <span>Note</span>
          <textarea
            maxLength={280}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Add context like dinner, tickets, rent split..."
            rows={4}
            value={memo}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating request...' : 'Create payment request'}
        </button>
      </form>

      {createdRequest ? (
        <div className="success-banner">
          <div>
            <p className="eyebrow">Latest request</p>
            <strong>{createdRequest.shareable_link}</strong>
          </div>

          <button className="secondary-button" onClick={() => void copyShareLink()} type="button">
            Copy link
          </button>
        </div>
      ) : null}
    </section>
  );
}
