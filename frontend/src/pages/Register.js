// frontend/src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // ✋ Validation
    if (!formData.nom || !formData.email || !formData.motDePasse) {
      setMessage({ text: 'Tous les champs sont requis', type: 'error' });
      setLoading(false);
      return;
    }

    if (formData.motDePasse.length < 8) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 8 caractères', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          nom: formData.nom.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.motDePasse.trim() 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      setMessage({ 
        text: '✅ Compte créé avec succès ! Redirection...', 
        type: 'success' 
      });

      setFormData({ nom: '', email: '', motDePasse: '' });

      setTimeout(() => navigate('/login'), 2000); // SPA redirect

    } catch (err) {
      console.error('Erreur inscription:', err);
      setMessage({ 
        text: err.message.includes('Failed to fetch') 
          ? 'Impossible de se connecter au serveur' 
          : err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Créer un compte</h2>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
            {message.type === 'success' && (
              <div className="spinner-border spinner-border-sm ms-2"></div>
            )}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              name="nom"
              className="form-control"
              value={formData.nom}
              onChange={handleChange}
              required
              minLength="2"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe (8 caractères minimum)</label>
            <input
              type="password"
              name="motDePasse"
              className="form-control"
              value={formData.motDePasse}
              onChange={handleChange}
              required
              minLength="8"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Création en cours...
              </>
            ) : 'S\'inscrire'}
          </button>
        </form>

        <p className="mt-3 text-center">
          Déjà inscrit ? <a href="/login" className="text-primary">Se connecter</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
