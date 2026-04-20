import { Link, NavLink } from 'react-router-dom';
import type { Account, User } from '../lib/api';
import { formatCurrency } from '../lib/format';

type AppHeaderProps = {
  account: Account | null;
  onLogout: () => void;
  user: User;
};

export function AppHeader({ account, onLogout, user }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-row">
        <Link className="brand-mark" to="/">
          <span className="brand-dot" />
          <div>
            <p className="eyebrow">Lovie assignment</p>
            <strong>Lovie Request Studio</strong>
          </div>
        </Link>

        <nav className="header-nav" aria-label="Primary">
          <NavLink className="nav-link" to="/">
            Dashboard
          </NavLink>
        </nav>
      </div>

      <div className="header-profile">
        <div>
          <p className="eyebrow">Signed in as</p>
          <strong>{user.email}</strong>
          <p>{user.phone}</p>
        </div>

        <div>
          <p className="eyebrow">Simulated balance</p>
          <strong>{account ? formatCurrency(account.balance, account.currency) : 'Loading'}</strong>
        </div>

        <button className="secondary-button" onClick={onLogout} type="button">
          Sign out
        </button>
      </div>
    </header>
  );
}
