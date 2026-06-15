// ============================================================
// TextileFlow MES — Auth Context (Authentication State)
// ============================================================
// Separate from AppContext per STACK.md key decisions.
// Access token stored in module-level variable (api.js), NOT
// localStorage, per PITFALLS.md rule #1.
// ============================================================

import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { login as apiLogin, logout as apiLogout, me as apiMe, setAccessToken, clearAccessToken } from '../api';

const AuthContext = createContext(null);

// ── State ──

const initialState = {
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  error: null,
};

// ── Reducer ──

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOGIN_START':
      return { ...state, status: 'loading', error: null };

    case 'AUTH_LOGIN_SUCCESS':
      return { user: action.payload, status: 'authenticated', error: null };

    case 'AUTH_LOGIN_FAILURE':
      return { ...state, status: 'unauthenticated', error: action.payload };

    case 'AUTH_LOGOUT':
      return { user: null, status: 'unauthenticated', error: null };

    case 'AUTH_RESTORE_SESSION':
      return { user: action.payload, status: 'authenticated', error: null };

    default:
      return state;
  }
}

// ── Provider ──

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Restore session on mount — /api/auth/me triggers silent refresh
  // via api.js 401 interceptor if access token is stale
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const data = await apiMe();
        if (!cancelled) {
          dispatch({ type: 'AUTH_RESTORE_SESSION', payload: data.user });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    }

    restore();

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOGIN_START' });
    try {
      const data = await apiLogin(email, password);
      dispatch({ type: 'AUTH_LOGIN_SUCCESS', payload: data.user });
      setWelcomeMessage(`Welcome, ${data.user.name}!`);
      setTimeout(() => setWelcomeMessage(''), 4000);
    } catch (err) {
      dispatch({ type: 'AUTH_LOGIN_FAILURE', payload: err.message });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Logout is best-effort; clear local state regardless
    }
    clearAccessToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // ── Loading UI while auth check runs ──

  if (state.status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary, #888)',
        fontSize: 'var(--font-size-lg, 1.125rem)',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, welcomeMessage, clearWelcome: () => setWelcomeMessage('') }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
