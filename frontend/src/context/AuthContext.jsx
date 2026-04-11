import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [guestId, setGuestId] = useState(localStorage.getItem('guestId'));
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Guest ID if missing
    if (!guestId) {
      const newGuestId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guestId', newGuestId);
      setGuestId(newGuestId);
    }
  }, [guestId]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkUser();
    } else if (guestId) {
      delete axios.defaults.headers.common['Authorization'];
      fetchGuestStatus();
    } else {
      setLoading(false);
    }
  }, [token, guestId]);

  const fetchGuestStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/guest/${guestId}`);
      setGuestMessageCount(res.data.messageCount);
    } catch (err) {
      console.error('Guest status sync failed');
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (username, password) => {
    await axios.post(`${API_URL}/api/auth/register`, { username, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, guestId, guestMessageCount, loading, login, register, logout, checkUser, fetchGuestStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
