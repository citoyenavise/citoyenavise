import { createContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Au démarrage : vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      if (!api.auth.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.auth.me();
        // Le backend retourne { success, user }
        setUser(response.user || response);
        setError(null);
      } catch (err) {
        api.auth.logout_local();
        setUser(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Demander un magic link par email
  const requestMagicLink = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.requestMagicLink(email);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier un magic link (depuis VerifyPage)
  const verifyMagicLink = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user: userData } = await api.auth.verifyMagicLink(token);
      setUser(userData);
      return { accessToken, user: userData };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    requestMagicLink,
    verifyMagicLink,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}