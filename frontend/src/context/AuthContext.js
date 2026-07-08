import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ssor_auth';

const ROLE_DEFAULTS = {
  organization: { name: 'Little Scholars School', clearance: 'Licence-linked account' },
  police: { name: 'Insp. R. Naidu', clearance: 'Cyberabad · Clearance L1' },
};

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);

  const login = useCallback((role, profile = {}) => {
    const next = {
      role,
      loginId: profile.loginId || '',
      name: profile.name || ROLE_DEFAULTS[role]?.name || 'User',
      clearance: profile.clearance || ROLE_DEFAULTS[role]?.clearance || '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const value = useMemo(() => ({ auth, login, logout }), [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
