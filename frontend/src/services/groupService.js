// src/services/groupService.js
import api from './api';

export const groupService = {
  // Récupérer tous les groupes de l'utilisateur connecté
  async getUserGroups() {
    try {
      const response = await api.get('/groups'); // Route existante
      return response.data;
    } catch (error) {
      console.error('Erreur récupération groupes utilisateur:', error);
      throw error;
    }
  },

  // Récupérer tous les groupes (admin seulement)
  async getAllGroups() {
    try {
      const response = await api.get('/groups/all'); // Route existante
      return response.data;
    } catch (error) {
      console.error('Erreur récupération tous les groupes:', error);
      
      // Fallback vers les groupes de l'utilisateur si pas admin
      if (error.response?.status === 403) {
        console.log('🔄 Fallback vers groupes utilisateur (pas admin)');
        return await this.getUserGroups();
      }
      throw error;
    }
  },

  // Récupérer les utilisateurs disponibles (admin seulement)
  async getAvailableUsers() {
    try {
      const response = await api.get('/groups/users'); // Route existante
      return response.data;
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      
      // Si pas admin, retourner tableau vide
      if (error.response?.status === 403) {
        console.log('🔄 Pas admin - utilisateurs vides');
        return { users: [] };
      }
      throw error;
    }
  },

  // Créer un nouveau groupe
  async createGroup(groupData) {
    try {
      // Validation côté client
      if (!groupData.nom || groupData.nom.length < 3) {
        throw new Error('Le nom du groupe doit contenir au moins 3 caractères');
      }

      console.log('📤 Création groupe:', groupData);
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Erreur création groupe:', error);
      throw error;
    }
  },

  // Modifier un groupe existant
  async updateGroup(groupId, groupData) {
    try {
      if (!groupId) {
        throw new Error('ID du groupe requis');
      }
      
      if (!groupData.nom || groupData.nom.length < 3) {
        throw new Error('Le nom du groupe doit contenir au moins 3 caractères');
      }

      console.log('📤 Modification groupe:', groupId, groupData);
      const response = await api.put(`/groups/${groupId}`, groupData);
      return response.data;
    } catch (error) {
      console.error('Erreur modification groupe:', error);
      throw error;
    }
  },

  // Supprimer un groupe
  async deleteGroup(groupId) {
    try {
      if (!groupId) {
        throw new Error('ID du groupe requis');
      }

      console.log('🗑️ Suppression groupe:', groupId);
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression groupe:', error);
      throw error;
    }
  },

  // Récupérer les détails d'un groupe avec ses membres
  async getGroupDetails(groupId) {
    try {
      if (!groupId) {
        throw new Error('ID du groupe requis');
      }

      console.log('🔍 Chargement détails groupe:', groupId);
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération détails groupe:', error);
      throw error;
    }
  },

  // Ajouter un membre à un groupe
  async addMemberToGroup(groupId, userId) {
    try {
      if (!groupId || !userId) {
        throw new Error('ID du groupe et de l\'utilisateur requis');
      }

      console.log('➕ Ajout membre:', { groupId, userId });
      const response = await api.post(`/groups/${groupId}/members`, {
        utilisateurId: userId
      });
      return response.data;
    } catch (error) {
      console.error('Erreur ajout membre:', error);
      throw error;
    }
  },

  // Supprimer un membre d'un groupe
  async removeMemberFromGroup(groupId, userId) {
    try {
      if (!groupId || !userId) {
        throw new Error('ID du groupe et de l\'utilisateur requis');
      }

      console.log('➖ Suppression membre:', { groupId, userId });
      const response = await api.delete(`/groups/${groupId}/members`, {
        data: { utilisateurId: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur suppression membre:', error);
      throw error;
    }
  },

  // 🔧 Utilitaires de formatage
  
  // Formater les données de groupe pour l'affichage
  formatGroupData(rawGroup) {
    return {
      id: rawGroup.id || rawGroup.ID,
      nom: rawGroup.nom || rawGroup.NOM,
      description: rawGroup.description || rawGroup.DESCRIPTION || '',
      createur_nom: rawGroup.createur_nom || rawGroup.CREATEUR_NOM || 'Inconnu',
      nb_membres: rawGroup.nb_membres || rawGroup.NB_MEMBRES || 0,
      date_creation: rawGroup.date_creation || rawGroup.DATE_CREATION,
      membres: rawGroup.membres || []
    };
  },

  // Formater les données d'utilisateur pour l'affichage
  formatUserData(rawUser) {
    return {
      id: rawUser.id || rawUser.ID,
      nom: rawUser.nom || rawUser.NOM,
      email: rawUser.email || rawUser.EMAIL,
      role: rawUser.role || rawUser.ROLE
    };
  },

  // Vérifier si un utilisateur est membre d'un groupe
  isUserMemberOfGroup(groupMembers, userId) {
    if (!Array.isArray(groupMembers)) return false;
    return groupMembers.some(member => 
      (member.id || member.ID) === userId
    );
  },

  // Obtenir le rôle d'un utilisateur dans un groupe
  getUserRoleInGroup(groupMembers, userId) {
    if (!Array.isArray(groupMembers)) return null;
    const member = groupMembers.find(member => 
      (member.id || member.ID) === userId
    );
    return member ? (member.role_groupe || member.ROLE_GROUPE) : null;
  },

  // 🔧 Méthodes utilitaires pour l'interface

  // Validation des données de groupe
  validateGroupData(groupData) {
    const errors = [];

    if (!groupData.nom || typeof groupData.nom !== 'string') {
      errors.push('Le nom du groupe est requis');
    } else if (groupData.nom.length < 3) {
      errors.push('Le nom doit contenir au moins 3 caractères');
    } else if (groupData.nom.length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères');
    }

    if (groupData.description && groupData.description.length > 500) {
      errors.push('La description ne peut pas dépasser 500 caractères');
    }

    if (groupData.membres && !Array.isArray(groupData.membres)) {
      errors.push('La liste des membres doit être un tableau');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Nettoyer les données avant envoi
  sanitizeGroupData(groupData) {
    return {
      nom: groupData.nom?.trim(),
      description: groupData.description?.trim() || '',
      membres: Array.isArray(groupData.membres) 
        ? groupData.membres.map(id => parseInt(id)).filter(id => !isNaN(id))
        : []
    };
  },

  // Formatter un message d'erreur utilisateur-friendly
  formatErrorMessage(error) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Messages spécifiques selon le statut HTTP
    switch (error.response?.status) {
      case 400:
        return 'Données invalides';
      case 401:
        return 'Vous devez être connecté';
      case 403:
        return 'Droits insuffisants';
      case 404:
        return 'Ressource non trouvée';
      case 409:
        return 'Conflit - cette action ne peut être effectuée';
      case 500:
        return 'Erreur serveur interne';
      default:
        return error.message || 'Une erreur inattendue s\'est produite';
    }
  },

  // Vérifier si l'utilisateur a les droits admin
  checkAdminRights(user) {
    return user && user.role === 'admin';
  },

  // Formatter la liste des membres pour l'affichage
  formatMembersList(membres) {
    if (!Array.isArray(membres) || membres.length === 0) {
      return 'Aucun membre';
    }

    if (membres.length === 1) {
      return '1 membre';
    }

    return `${membres.length} membres`;
  }
};

export default groupService;