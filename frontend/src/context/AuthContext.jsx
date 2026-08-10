import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('idealab_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('idealab_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        const res = await apiRequest('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('idealab_user', JSON.stringify(res.user));
        } else {
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    verifyAuth();
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('idealab_user', JSON.stringify(userData));
    localStorage.setItem('idealab_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('idealab_user');
    localStorage.removeItem('idealab_token');
  };

  const clearForcePasswordChange = () => {
    if (user) {
      const updatedUser = { ...user, force_password_change: false };
      setUser(updatedUser);
      localStorage.setItem('idealab_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, clearForcePasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
