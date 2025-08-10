import api from './api';

// Récupérer tous les utilisateurs
export const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Créer un nouvel utilisateur
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', {
      ...userData,
      role: userData.role || 'utilisateur' // Valeur par défaut cohérente avec votre DB
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Supprimer un utilisateur
export const deleteUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// 🆕 NOUVELLE FONCTION : Ajouter un utilisateur à un groupe
export const addUserToGroup = async (groupId, userId) => {
  try {
    const response = await api.post(`/groups/${groupId}/members`, {
      utilisateurId: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw error;
  }
};

// 🆕 BONUS : Récupérer les membres d'un groupe (pour plus tard)
export const getGroupMembers = async (groupId) => {
  try {
    const response = await api.get(`/groups/${groupId}/members`);
    return response.data;
  } catch (error) {
    console.error('Error fetching group members:', error);
    throw error;
  }
};

// 🆕 BONUS : Retirer un utilisateur d'un groupe (pour plus tard)
export const removeUserFromGroup = async (groupId, userId) => {
  try {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  } catch (error) {
    console.error('Error removing user from group:', error);
    throw error;
  }
};