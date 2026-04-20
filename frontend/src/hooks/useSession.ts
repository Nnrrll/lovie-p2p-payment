import { useEffect, useState } from 'react';
import {
  api,
  sessionTokenStore,
  type Account,
  type User,
} from '../lib/api';

export interface SessionController {
  account: Account | null;
  error: string | null;
  isAuthenticating: boolean;
  isBootstrapping: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
  user: User | null;
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function useSession(): SessionController {
  const hasInitialToken = Boolean(sessionTokenStore.get());
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(hasInitialToken);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!hasInitialToken) {
      return;
    }

    let isCancelled = false;

    const restoreSession = async () => {
      try {
        const response = await api.getMe();

        if (isCancelled) {
          return;
        }

        setUser(response.user);
        setAccount(response.account);
        setError(null);
      } catch (restoreError) {
        if (isCancelled) {
          return;
        }

        sessionTokenStore.clear();
        setUser(null);
        setAccount(null);
        setError(getMessage(restoreError));
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [hasInitialToken]);

  async function login(email: string) {
    try {
      setIsAuthenticating(true);
      setError(null);
      const loginResponse = await api.login(email.trim().toLowerCase());
      sessionTokenStore.set(loginResponse.session_token);
      const meResponse = await api.getMe();
      setUser(meResponse.user);
      setAccount(meResponse.account);
      setError(null);
      return true;
    } catch (loginError) {
      sessionTokenStore.clear();
      setUser(null);
      setAccount(null);
      setError(getMessage(loginError));
      return false;
    } finally {
      setIsAuthenticating(false);
      setIsBootstrapping(false);
    }
  }

  async function refresh() {
    if (!sessionTokenStore.get()) {
      return;
    }

    const response = await api.getMe();
    setUser(response.user);
    setAccount(response.account);
    setError(null);
  }

  function logout() {
    sessionTokenStore.clear();
    setUser(null);
    setAccount(null);
    setError(null);
  }

  return {
    account,
    error,
    isAuthenticating,
    isBootstrapping,
    login,
    logout,
    refresh,
    user,
  };
}
