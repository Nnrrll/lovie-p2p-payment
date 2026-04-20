import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { useSession } from './hooks/useSession';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RequestDetailPage } from './pages/RequestDetailPage';

function LoadingScreen() {
  return (
    <main className="screen-state">
      <div className="screen-card">
        <p className="eyebrow">Lovie Request Flow</p>
        <h1>Session is loading</h1>
        <p>Restoring your browser session and checking the latest request state.</p>
      </div>
    </main>
  );
}

export default function App() {
  const session = useSession();
  const location = useLocation();
  const redirectPath = location.pathname.startsWith('/requests/') ? location.pathname : undefined;

  if (session.isBootstrapping) {
    return <LoadingScreen />;
  }

  if (!session.user) {
    return (
      <LoginPage
        error={session.error}
        isSubmitting={session.isAuthenticating}
        onLogin={session.login}
        redirectPath={redirectPath}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppHeader account={session.account} user={session.user} onLogout={session.logout} />
      <Routes>
        <Route path="/" element={<DashboardPage session={session} />} />
        <Route path="/requests/:requestId" element={<RequestDetailPage session={session} />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </div>
  );
}
