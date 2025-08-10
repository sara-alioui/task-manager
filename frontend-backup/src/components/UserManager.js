import React, { useState, useContext, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { validateEmail } from '../utils/validators';

const UserManager = () => {
  const { fetchUsers, createUser } = useApi();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    role: 'utilisateur'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validationErrors = {};
    if (!newUser.nom) validationErrors.nom = 'Nom requis';
    if (!validateEmail(newUser.email)) validationErrors.email = 'Email invalide';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createUser(newUser);
      await loadUsers();
      setNewUser({ nom: '', email: '', role: 'utilisateur' });
      setErrors({});
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
    }
  };

  return (
    <div className="user-manager">
      <h2>Gestion des Utilisateurs</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nom complet</label>
          <input
            type="text"
            value={newUser.nom}
            onChange={(e) => setNewUser({...newUser, nom: e.target.value})}
          />
          {errors.nom && <span className="error">{errors.nom}</span>}
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div>
          <label>Rôle</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <button type="submit">Enregistrer</button>
      </form>

      <div className="user-list">
        <h3>Liste des utilisateurs</h3>
        {users.map(user => (
          <div key={user.id} className="user-card">
            <p><strong>{user.nom}</strong> ({user.role})</p>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManager;