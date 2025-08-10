import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    error: null
  });

  const login = useCallback(async (credentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Stocker le token
      localStorage.setItem('token', token);
      
      // Configurer le header Authorization pour les futures requêtes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setAuthState({ user, loading: false, error: null });
      return user;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error.response?.data?.message || 'Identifiants invalides';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');
    
    // Supprimer le header Authorization
    delete api.defaults.headers.common['Authorization'];
    
    setAuthState({ user: null, loading: false, error: null });
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Vérifier si le token est expiré
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      // Configurer le header Authorization
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Vérifier le token avec le serveur
      const response = await api.get('/auth/me');
      
      setAuthState({
        user: response.data.user || response.data, // Gérer différents formats de réponse
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      logout();
    }
  }, [logout]);

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = useCallback(async () => {
    if (!authState.user) return;
    
    try {
      const response = await api.get('/auth/me');
      setAuthState(prev => ({
        ...prev,
        user: response.data.user || response.data
      }));
    } catch (error) {
      console.error('Erreur rafraîchissement utilisateur:', error);
      // En cas d'erreur, on déconnecte l'utilisateur
      logout();
    }
  }, [authState.user, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const contextValue = {
    ...authState,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!authState.user,
    isAdmin: authState.user?.role === 'admin',
    // Fonctions utilitaires
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};