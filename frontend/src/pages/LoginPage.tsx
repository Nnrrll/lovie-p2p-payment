import { type FormEvent, useState } from 'react';

type LoginPageProps = {
  error: string | null;
  isSubmitting: boolean;
  onLogin: (email: string) => Promise<boolean>;
  redirectPath?: string;
};

const demoEmails = ['alice@lovie.com', 'bob@lovie.com', 'charlie@lovie.com', 'denise@lovie.com'];

export function LoginPage({ error, isSubmitting, onLogin, redirectPath }: LoginPageProps) {
  const [email, setEmail] = useState('alice@lovie.com');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email);
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <p className="eyebrow">Spec-driven fintech exercise</p>
        <h1>Ship a request-money flow that behaves like a product, not a placeholder.</h1>
        <p>
          This build covers request creation, outgoing and incoming dashboards, request details,
          simulated payment fulfillment, and seven-day expiration handling.
        </p>

        <div className="hero-grid">
          <div className="hero-card">
            <span>01</span>
            <strong>Mock email auth</strong>
            <p>Session is stored in browser session storage, which matches the assignment scope.</p>
          </div>
          <div className="hero-card">
            <span>02</span>
            <strong>Real backend state</strong>
            <p>Every dashboard action hits Fastify and Postgres so sender and recipient stay in sync.</p>
          </div>
          <div className="hero-card">
            <span>03</span>
            <strong>Shareable request link</strong>
            <p>Deep links route to a dedicated detail page after login restoration.</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Sign in</p>
            <h2>Mock magic-link entry</h2>
          </div>
          {redirectPath ? <span className="helper-chip">Continue to {redirectPath}</span> : null}
        </div>

        <form className="composer-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alice@lovie.com"
              value={email}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Opening session...' : 'Send mock magic link'}
          </button>
        </form>

        <div className="demo-user-grid">
          {demoEmails.map((demoEmail) => (
            <button
              className="secondary-button"
              key={demoEmail}
              onClick={() => setEmail(demoEmail)}
              type="button"
            >
              Use {demoEmail}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
