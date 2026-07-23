import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    authApi.getMe()
      .then(data => {
        if (data.success) setAuth(data.user);
      })
      .catch(() => setAuth(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (role, credentials) => {
    try {
      const data = await authApi.login({ ...credentials, role });
      if (data.success) {
        setAuth(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.message || 'Login failed');
      }
      throw new Error(err.message || 'Login failed');
    }
  }, []);

  const requestLoginOtp = useCallback(async (role, loginId) => {
    try {
      const data = await authApi.loginOtpRequest({ role, loginId });
      if (!data.success) throw new Error(data.message || 'OTP request failed');
      return data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.message || 'OTP request failed');
      }
      throw new Error(err.message || 'OTP request failed');
    }
  }, []);

  const verifyLoginOtp = useCallback(async (role, loginId, otp) => {
    try {
      const data = await authApi.loginOtpVerify({ role, loginId, otp });
      if (data.success) {
        setAuth(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.message || 'OTP verification failed');
      }
      throw new Error(err.message || 'OTP verification failed');
    }
  }, []);

  const registerOrganization = useCallback(async (orgData) => {
    const formData = new FormData();
    formData.append('role', 'organization');
    
    // Append text fields
    Object.keys(orgData).forEach(key => {
      if (key !== 'authLetter' && key !== 'govCert' && key !== 'supportingDocs') {
        if (orgData[key] !== null && orgData[key] !== undefined) {
          formData.append(key, orgData[key]);
        }
      }
    });

    // Append file fields
    if (orgData.authLetter) formData.append('authLetter', orgData.authLetter);
    if (orgData.govCert) formData.append('govCert', orgData.govCert);
    if (orgData.supportingDocs && orgData.supportingDocs.length > 0) {
      Array.from(orgData.supportingDocs).forEach(file => {
        formData.append('supportingDocs', file);
      });
    }

    try {
      const data = await authApi.register(formData);
      return data;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data.message || 'Registration failed');
      }
      throw new Error(err.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setAuth(null);
    }
  }, []);

  const value = useMemo(() => ({ 
    auth, loading, login, requestLoginOtp, verifyLoginOtp, registerOrganization, logout 
  }), [auth, loading, login, requestLoginOtp, verifyLoginOtp, registerOrganization, logout]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
