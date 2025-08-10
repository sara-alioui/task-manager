import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  Checkbox,
  IconButton,
  Tooltip,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// Hook pour récupérer l'utilisateur connecté
const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (error) {
        console.error('Erreur décodage token:', error);
      }
    }
  }, []);
  
  return currentUser;
};

const GroupManager = () => {
  const currentUser = useCurrentUser();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    nom: '',
    description: '',
    membres: []
  });
  const [editMode, setEditMode] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Charger la liste des groupes
  const loadGroups = useCallback(async () => {
    try {
      let response;
      try {
        response = await api.get('/groups/all');
      } catch (error) {
        if (error.response?.status === 403) {
          response = await api.get('/groups');
        } else {
          throw error;
        }
      }
      
      const groupsData = response.data?.data || response.data || [];
      
      const formattedGroups = Array.isArray(groupsData) 
        ? groupsData.map(group => ({
            id: group.id || group.ID,
            nom: group.nom || group.NOM,
            description: group.description || group.DESCRIPTION || '',
            createur_nom: group.createur_nom || group.CREATEUR_NOM || 'Inconnu',
            nb_membres: group.nb_membres || group.NB_MEMBRES || 0,
            date_creation: group.date_creation || group.DATE_CREATION
          }))
        : [];
        
      setGroups(formattedGroups);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      setGroups([]);
      showNotification('Erreur lors du chargement des groupes', 'error');
    }
  }, []);

  // Charger la liste des utilisateurs disponibles
  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get('/groups/users');
      const usersData = response.data?.users || response.data || [];
      
      const formattedUsers = Array.isArray(usersData)
        ? usersData.map(user => ({
            id: user.id || user.ID,
            nom: user.nom || user.NOM,
            email: user.email || user.EMAIL,
            role: user.role || user.ROLE
          }))
        : [];
        
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
      
      if (error.response?.status !== 403) {
        showNotification('Erreur lors du chargement des utilisateurs', 'warning');
      }
    }
  }, []);

  // Charger les données initiales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGroups(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadGroups, loadUsers]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Créer ou modifier un groupe
  const handleCreateGroup = async () => {
    if (!newGroup.nom.trim()) {
      showNotification('Le nom du groupe est requis', 'error');
      return;
    }

    if (newGroup.nom.trim().length < 3) {
      showNotification('Le nom doit contenir au moins 3 caractères', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Filtrer les membres pour exclure l'utilisateur connecté (créateur)
      const filteredMembers = newGroup.membres
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id !== currentUser?.id);
      
      const groupData = {
        nom: newGroup.nom.trim(),
        description: newGroup.description.trim(),
        membres: filteredMembers
      };
      
      console.log('🔍 Données envoyées:', groupData);
      console.log('🔍 Utilisateur connecté ID:', currentUser?.id);
      
      if (editMode && currentGroupId) {
        await api.put(`/groups/${currentGroupId}`, groupData);
        showNotification('Groupe modifié avec succès', 'success');
      } else {
        await api.post('/groups', groupData);
        showNotification('Groupe créé avec succès', 'success');
      }
      
      await loadGroups();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde groupe:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage = 'Droits insuffisants pour cette action';
      } else if (error.response?.status === 401) {
        errorMessage = 'Vous devez être connecté';
      } else if (error.response?.status === 400) {
        errorMessage = 'Données invalides - Vérifiez le formulaire';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un groupe
  const handleDeleteGroup = async (group) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le groupe "${group.nom}" ?\n\nCette action est irréversible.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSubmitting(true);
      await api.delete(`/groups/${group.id}`);
      showNotification('Groupe supprimé avec succès', 'success');
      await loadGroups();
    } catch (error) {
      console.error('Erreur suppression groupe:', error);
      
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 403) {
        errorMessage = 'Droits insuffisants pour supprimer ce groupe';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Préparer l'édition d'un groupe
  const handleEditGroup = async (group) => {
    try {
      setSubmitting(true);
      
      const response = await api.get(`/groups/${group.id}`);
      const groupDetails = response.data?.data || response.data;
      
      // Filtrer les membres pour exclure le créateur lors de l'édition
      const membersWithoutCreator = groupDetails.membres 
        ? groupDetails.membres
            .filter(m => (m.id || m.ID) !== currentUser?.id)
            .map(m => (m.id || m.ID).toString())
        : [];
      
      setNewGroup({
        nom: groupDetails.nom || group.nom,
        description: groupDetails.description || '',
        membres: membersWithoutCreator
      });
      
      setCurrentGroupId(group.id);
      setEditMode(true);
      setOpenDialog(true);
      
    } catch (error) {
      console.error('Erreur chargement détails groupe:', error);
      
      setNewGroup({
        nom: group.nom,
        description: group.description || '',
        membres: []
      });
      
      setCurrentGroupId(group.id);
      setEditMode(true);
      setOpenDialog(true);
      
      showNotification('⚠️ Membres non chargés - Modification limitée', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setNewGroup({
      nom: '',
      description: '',
      membres: []
    });
    setEditMode(false);
    setCurrentGroupId(null);
  };

  // Gérer la sélection des membres
  const handleMemberToggle = (userId) => {
    const userIdStr = userId.toString();
    setNewGroup(prev => ({
      ...prev,
      membres: prev.membres.includes(userIdStr)
        ? prev.membres.filter(id => id !== userIdStr)
        : [...prev.membres, userIdStr]
    }));
  };

  // Afficher une notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Obtenir les noms des membres d'un groupe
  const getMemberNames = (memberCount) => {
    const count = memberCount || 0;
    return count === 0 ? 'Aucun membre' : 
           count === 1 ? '1 membre' : 
           `${count} membres`;
  };

  if (loading && groups.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        p: 4,
        minHeight: '50vh'
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Chargement des groupes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ 
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🏢 Gestion des Groupes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={submitting}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': { transform: 'scale(1.02)' },
            '&:disabled': { opacity: 0.7 }
          }}
        >
          Nouveau Groupe
        </Button>
      </Box>

      {/* Table des groupes */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Créateur</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Membres</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Box>
                    <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucun groupe trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Créez votre premier groupe pour commencer !
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: '#667eea' }}>
                        <GroupIcon />
                      </Avatar>
                      <Typography fontWeight="bold">{group.nom}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || 'Aucune description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {group.createur_nom || 'Inconnu'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getMemberNames(group.nb_membres)}
                      avatar={<Avatar><PersonIcon /></Avatar>}
                      size="small"
                      color={group.nb_membres > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Modifier">
                      <IconButton
                        onClick={() => handleEditGroup(group)}
                        disabled={submitting}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.light', color: 'white' },
                          '&:disabled': { opacity: 0.5 }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        onClick={() => handleDeleteGroup(group)}
                        disabled={submitting}
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'white' },
                          '&:disabled': { opacity: 0.5 }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de création/modification */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          {editMode ? '✏️ Modifier Groupe' : '✨ Nouveau Groupe'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du groupe"
                value={newGroup.nom}
                onChange={(e) => setNewGroup({...newGroup, nom: e.target.value})}
                variant="outlined"
                required
                error={newGroup.nom.trim().length > 0 && newGroup.nom.trim().length < 3}
                helperText={
                  newGroup.nom.trim().length > 0 && newGroup.nom.trim().length < 3 
                    ? 'Le nom doit contenir au moins 3 caractères' 
                    : ''
                }
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optionnelle)"
                value={newGroup.description}
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                variant="outlined"
                multiline
                rows={2}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Sélectionnez les membres ({newGroup.membres.length} sélectionné{newGroup.membres.length > 1 ? 's' : ''}):
              </Typography>
              <Box sx={{ 
                maxHeight: 300, 
                overflow: 'auto',
                border: '1px solid #eee',
                borderRadius: 2,
                p: 2
              }}>
                {users.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      {submitting ? 'Chargement...' : 'Aucun utilisateur disponible'}
                    </Typography>
                  </Box>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.id === currentUser?.id;
                    
                    return (
                      <Box 
                        key={user.id} 
                        display="flex" 
                        alignItems="center" 
                        sx={{ 
                          p: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: isCurrentUser ? '#e3f2fd' : '#f5f5f5' },
                          cursor: submitting || isCurrentUser ? 'default' : 'pointer',
                          opacity: submitting ? 0.7 : 1,
                          bgcolor: isCurrentUser ? '#f3e5f5' : 'transparent'
                        }}
                        onClick={() => !submitting && !isCurrentUser && handleMemberToggle(user.id)}
                      >
                        <Checkbox
                          checked={isCurrentUser || newGroup.membres.includes(user.id.toString())}
                          onChange={() => !submitting && !isCurrentUser && handleMemberToggle(user.id)}
                          icon={<PersonIcon />}
                          checkedIcon={<CheckCircleIcon color={isCurrentUser ? "warning" : "success"} />}
                          disabled={submitting || isCurrentUser}
                        />
                        <Box ml={2} sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                            {user.nom} {isCurrentUser && '(Vous - Créateur)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email} • {user.role}
                          </Typography>
                        </Box>
                        {isCurrentUser && (
                          <Chip 
                            label="Créateur" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => { setOpenDialog(false); resetForm(); }} 
            variant="outlined"
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!newGroup.nom.trim() || newGroup.nom.trim().length < 3 || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { transform: 'scale(1.02)' },
              '&:disabled': { opacity: 0.7 }
            }}
          >
            {submitting ? 'En cours...' : (editMode ? 'Mettre à jour' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupManager;