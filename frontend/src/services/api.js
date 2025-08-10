import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Corrigé le port 3000 -> 5000
  timeout: 10000,
  withCredentials: true // Pour les cookies sécurisés
});

// Intercepteur de requête amélioré
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    const decoded = jwtDecode(token);
    
    // Vérification expiration
    if (decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=1';
      return Promise.reject(new Error('Token expiré'));
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Gestion avancée des erreurs
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          break;
          
        case 403:
          window.location.href = '/unauthorized';
          break;
          
        case 500:
          console.error('Erreur serveur:', error);
          break;
          
        default:
          console.error('Erreur API:', error);
      }
    }
    
    return Promise.reject(error);
  }
);

export const setupResponseInterceptor = (logout) => {
  return api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );
};

export default api;