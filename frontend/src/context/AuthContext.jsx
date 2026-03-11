import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('civicai_token');
    const adminData = localStorage.getItem('civicai_admin');

    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch {}
    } else if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('civicai_token');
          localStorage.removeItem('civicai_user');
        });
    }
    setLoading(false);
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('civicai_token', token);
    localStorage.setItem('civicai_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginAdmin = (token, adminData) => {
    localStorage.setItem('civicai_token', token);
    localStorage.setItem('civicai_admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
    localStorage.removeItem('civicai_admin');
    setUser(null);
    setAdmin(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginUser, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
