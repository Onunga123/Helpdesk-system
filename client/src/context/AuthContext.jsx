import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

// Create the context
const AuthContext = createContext();

// ─── AUTH PROVIDER ────────────────────────────────────────────
// Wraps the whole app so any component can access auth state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — check if user is already logged in
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const userData = data.data;
    // Save to state and localStorage
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // ── REGISTER ───────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    const userData = data.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  // ── LOGOUT ─────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ── UPDATE PROFILE ─────────────────────────────────────────
  const updateProfile = async (formData) => {
    const { data } = await API.put('/auth/profile', formData);
    const updatedUser = { ...user, ...data.data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // ── ROLE HELPERS ───────────────────────────────────────────
  const isAdmin = user?.role === 'admin';
  const isICTOfficer = user?.role === 'ict_officer';
  const isStaff = user?.role === 'staff';
  const isStudent = user?.role === 'student';
  const isPrivileged = isAdmin || isICTOfficer;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isICTOfficer,
        isStaff,
        isStudent,
        isPrivileged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── CUSTOM HOOK ──────────────────────────────────────────────
// Use this in any component: const { user, login, logout } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};

export default AuthContext;