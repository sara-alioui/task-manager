import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Vérification du token au chargement
  useEffect(() => {
    if (!token) {
      setError('Lien invalide - Token manquant');
      setTokenValid(false);
      return;
    }

    console.log('🔍 Token reçu:', token.substring(0, 20) + '...');
    setTokenValid(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token manquant');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Envoi requête set-password...');
      
      const response = await api.post('/users/set-password', { 
        token, 
        newPassword: password 
      });

      console.log('✅ Mot de passe défini avec succès');
      setSuccess(true);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        navigate('/login?message=password-set');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Erreur set-password:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la définition du mot de passe';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', textAlign: 'center' }}>
        <h2>❌ Lien invalide</h2>
        <p>Ce lien de configuration est invalide ou a expiré.</p>
        <p>Contactez votre administrateur pour obtenir un nouveau lien.</p>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '10px 20px', marginTop: '20px' }}
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '100px auto',
      padding: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        🔐 Définir votre mot de passe
      </h2>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ Mot de passe défini avec succès!<br />
          Redirection vers la page de connexion...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Minimum 8 caractères"
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Confirmez votre mot de passe"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || success}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Configuration en cours...' : '✅ Valider'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          ← Retour à la connexion
        </button>
      </div>
    </div>
  );
}