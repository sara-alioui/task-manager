import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Grid,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  People as UsersIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as ShieldIcon,
  Refresh as RefreshIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GroupManager from '../components/GroupManager';
import SaTacheHeader from '../components/Header/SaTacheHeader';

const ModernAdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const { logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'utilisateur',
    phone: '',
    password: 'DefaultPassword123!'
  });

  const [tasks, setTasks] = useState([]);
  const [assignmentType, setAssignmentType] = useState('user');
  const [newTask, setNewTask] = useState({ 
    titre: '', 
    description: '', 
    utilisateurId: '',
    groupId: ''
  });
  const [showAddTask, setShowAddTask] = useState(false);

  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({ open: true, message, severity });
    setTimeout(() => setNotification(prev => ({ ...prev, open: false })), 5000);
  }, []);

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error('Erreur API:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       defaultMessage;
    showNotification(errorMessage, 'error');
  }, [showNotification]);

  const validateUserData = useCallback((user) => {
    if (!user.name || user.name.trim().length < 2) {
      return { valid: false, message: 'Le nom doit contenir au moins 2 caractères' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return { valid: false, message: 'Email invalide' };
    }

    return { valid: true };
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        logout();
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else {
        console.error('Format de réponse inattendu:', response.data);
        throw new Error('Format de réponse API non reconnu');
      }
      
      const formattedUsers = usersData.map(user => ({
        id: user._id || user.id || user.ID,
        name: user.fullName || user.name || user.nom || user.NOM,
        email: user.email || user.EMAIL,
        role: user.role || user.ROLE,
        status: user.status || user.STATUS || 'active',
        phone: user.phoneNumber || user.phone || user.PHONE || '',
        lastLogin: user.lastLogin || new Date().toISOString().split('T')[0]
      }));

      setUsers(formattedUsers);
    } catch (error) {
      handleApiError(error, 'Erreur lors du chargement des utilisateurs');
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setUsersLoading(false);
    }
  }, [handleApiError, showNotification, logout]);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const groupsData = Array.isArray(res.data) 
        ? res.data 
        : res.data?.groups || res.data?.data || [];
      
      setGroups(groupsData.map(group => ({
        id: group._id || group.id || group.ID,
        nom: group.nom || group.name || group.NOM
      })));
    } catch (err) {
      console.error(err);
      showNotification('Erreur chargement groupes', 'error');
    }
  }, [showNotification]);

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        logout();
        return;
      }

      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tasksData = Array.isArray(res.data) 
        ? res.data 
        : res.data?.tasks || res.data?.data || [];
      
      setTasks(tasksData.map(task => ({
        id: task._id || task.id || task.ID,
        titre: task.titre || task.title || task.TITRE,
        description: task.description || task.DESCRIPTION,
        statut: task.statut || task.status || task.STATUT || 'en attente',
        utilisateurId: task.utilisateur_id || task.utilisateurId || task.UTILISATEUR_ID,
        groupId: task.groupe_id || task.groupId || task.GROUPE_ID
      })));
    } catch (err) {
      console.error(err);
      showNotification('Erreur chargement tâches', 'error');
      if (err.response?.status === 401) {
        logout();
      }
    }
  }, [showNotification, logout]);

  const createTask = async () => {
    if (!newTask.titre.trim()) {
      showNotification('Le titre est obligatoire', 'error');
      return;
    }

    if (newTask.titre.trim().length < 3) {
      showNotification('Le titre doit contenir au moins 3 caractères', 'error');
      return;
    }

    if (assignmentType === 'user' && !newTask.utilisateurId) {
      showNotification('Veuillez sélectionner un utilisateur', 'error');
      return;
    }

    if (assignmentType === 'group' && !newTask.groupId) {
      showNotification('Veuillez sélectionner un groupe', 'error');
      return;
    }

    if (assignmentType === 'both' && !newTask.utilisateurId && !newTask.groupId) {
      showNotification('Veuillez sélectionner au moins un destinataire', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construction des données selon le type d'assignation
      const taskData = {
        titre: newTask.titre.trim(),
        description: newTask.description.trim() || null
      };

      // Ajout conditionnel des assignations
      if (assignmentType === 'user' && newTask.utilisateurId) {
        taskData.utilisateurId = parseInt(newTask.utilisateurId);
      } else if (assignmentType === 'group' && newTask.groupId) {
        taskData.groupeId = parseInt(newTask.groupId);
      } else if (assignmentType === 'both') {
        if (newTask.utilisateurId) {
          taskData.utilisateurId = parseInt(newTask.utilisateurId);
        }
        if (newTask.groupId) {
          taskData.groupeId = parseInt(newTask.groupId);
        }
      }

      console.log("🟡 Données envoyées à l'API:", JSON.stringify(taskData, null, 2));

      const response = await axios.post('http://localhost:5000/api/tasks', taskData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Réponse API:", response.data);
      
      showNotification('✅ Tâche créée avec succès');
      setShowAddTask(false);
      setNewTask({ titre: '', description: '', utilisateurId: '', groupId: '' });
      setAssignmentType('user');
      await fetchTasks();
      
    } catch (err) {
      console.error('❌ Erreur création tâche:', err);
      
      let errorMessage = 'Erreur création tâche';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Données invalides - Vérifiez le formulaire';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expirée - Reconnectez-vous';
        logout();
      } else if (err.response?.status === 404) {
        errorMessage = 'Utilisateur ou groupe introuvable';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = useCallback(async () => {
    const validation = validateUserData(newUser);
    if (!validation.valid) {
      showNotification(validation.message, 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        logout();
        return;
      }

      const userData = {
        nom: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        phoneNumber: newUser.phone.trim() || undefined,
        password: newUser.password
      };

      await axios.post('http://localhost:5000/api/users', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchUsers();
      setNewUser({ name: '', email: '', role: 'utilisateur', phone: '', password: 'DefaultPassword123!' });
      setShowAddUser(false);
      showNotification('Utilisateur créé avec succès');
    } catch (error) {
      handleApiError(error, "Échec de la création de l'utilisateur");
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [newUser, validateUserData, showNotification, handleApiError, fetchUsers, logout]);

  const handleDeleteUser = useCallback(async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Session expirée, veuillez vous reconnecter', 'error');
        logout();
        return;
      }

      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchUsers();
      showNotification('Utilisateur supprimé avec succès', 'success');
    } catch (error) {
      handleApiError(error, 'Échec de la suppression');
      if (error.response?.status === 401) {
        logout();
      }
    }
  }, [showNotification, handleApiError, fetchUsers, logout]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Tâche supprimée avec succès');
      await fetchTasks();
    } catch (err) {
      console.error('Erreur suppression tâche:', err);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleRefreshUsers = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
    fetchTasks();
    fetchGroups();
  }, [fetchUsers, fetchTasks, fetchGroups]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower)
    );
  });

  const stats = [
    {
      label: 'Total Utilisateurs',
      value: users.length,
      icon: UsersIcon,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      label: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      icon: ShieldIcon,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  const drawerContent = (
    <Box sx={{ width: sidebarOpen ? 280 : 80, transition: 'width 0.3s' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {sidebarOpen && (
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AdminHub
              </Typography>
            </Box>
          )}
          <IconButton onClick={() => setSidebarOpen(!sidebarOpen)}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      <List sx={{ p: 2 }}>
        {[
          { id: 0, label: 'Utilisateurs', icon: UsersIcon },
          { id: 1, label: 'Groupes', icon: GroupIcon },
          { id: 2, label: 'Tâches', icon: TaskIcon }
        ].map((item) => (
          <ListItem
            key={item.id}
            component="div" 
            onClick={() => setCurrentTab(item.id)}
            sx={{
              borderRadius: 2,
              mb: 1,
              bgcolor: currentTab === item.id ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
              color: currentTab === item.id ? 'primary.main' : 'text.primary',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <item.icon />
            </ListItemIcon>
            {sidebarOpen && <ListItemText primary={item.label} />}
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
        <ListItem
          component="div"
          onClick={logout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Déconnexion" />}
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <SaTacheHeader 
        title="Administration - Tableau de Bord" 
        subtitle="Gestion des utilisateurs, groupes et tâches"
        showBackButton={false}
      />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? 280 : 80,
              transition: 'width 0.3s',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              position: 'relative'
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1 }}>
          <AppBar 
            position="static" 
            elevation={0}
            sx={{ 
              bgcolor: 'white',
              borderBottom: '1px solid #e0e0e0'
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
              <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                {currentTab === 0 ? 'Gestion des Utilisateurs' : 
                 currentTab === 1 ? 'Gestion des Groupes' : 'Gestion des Tâches'}
              </Typography>

              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ width: 300 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                {currentTab === 0 && (
                  <>
                    <IconButton 
                      onClick={handleRefreshUsers}
                      color="primary"
                      title="Actualiser la liste"
                    >
                      <RefreshIcon />
                    </IconButton>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowAddUser(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      Nouvel Utilisateur
                    </Button>
                  </>
                )}
                {currentTab === 2 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddTask(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    Nouvelle Tâche
                  </Button>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 ? (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between">
                            <Box>
                              <Typography color="text.secondary">
                                {stat.label}
                              </Typography>
                              <Typography variant="h4" sx={{ my: 1 }}>
                                {usersLoading ? '-' : stat.value}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                background: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}
                            >
                              <stat.icon />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Card sx={{ borderRadius: 3 }}>
                  {usersLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Chargement des utilisateurs...</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Utilisateur</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">
                                  {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ bgcolor: '#667eea' }}>
                                      {(user.name || 'U').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography fontWeight="bold">{user.name || 'Sans nom'}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                    color={user.role === 'admin' ? 'secondary' : 'primary'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.status === 'active' ? 'Actif' : 'Inactif'}
                                    color={user.status === 'active' ? 'success' : 'default'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton 
                                    onClick={() => handleDeleteUser(user.id)}
                                    color="error"
                                    title="Supprimer l'utilisateur"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Card>
              </>
            ) : currentTab === 1 ? (
              <GroupManager users={users} />
            ) : (
              <Box>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                      Liste des Tâches ({tasks.length})
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Titre</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Assigné à</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tasks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">
                                  Aucune tâche trouvée
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            tasks.map((task) => {
                              const assignedUser = users.find(u => u.id == task.utilisateurId);
                              const assignedGroup = groups.find(g => g.id == task.groupId);
                              
                              return (
                                <TableRow key={task.id}>
                                  <TableCell>
                                    <Typography fontWeight="bold">{task.titre}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {task.description || 'Aucune description'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {assignedUser ? (
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                                          {(assignedUser.name || 'U').charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography variant="body2">{assignedUser.name}</Typography>
                                      </Box>
                                    ) : assignedGroup ? (
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <GroupIcon color="primary" />
                                        <Typography variant="body2">{assignedGroup.nom}</Typography>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        Non assigné
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={task.statut || 'En attente'}
                                      color={task.statut === 'terminé' ? 'success' : 'default'}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <IconButton 
                                      onClick={() => handleDeleteTask(task.id)}
                                      color="error"
                                      title="Supprimer la tâche"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Dialog pour ajouter un utilisateur */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" component="div" fontWeight="bold">Ajouter un utilisateur</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom complet*"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                variant="outlined"
                error={!newUser.name}
                helperText={!newUser.name && 'Ce champ est obligatoire'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email*"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                variant="outlined"
                error={!newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)}
                helperText={!newUser.email ? 'Ce champ est obligatoire' : 
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email) && 'Email invalide'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Téléphone"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rôle*</InputLabel>
                <Select
                  value={newUser.role}
                  label="Rôle"
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <MenuItem value="utilisateur">Utilisateur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setShowAddUser(false)} variant="outlined" disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained"
            disabled={loading || !newUser.name || !newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour ajouter une tâche */}
      <Dialog open={showAddTask} onClose={() => setShowAddTask(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" component="div" fontWeight="bold">Créer une tâche</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre*"
                value={newTask.titre}
                onChange={(e) => setNewTask({ ...newTask, titre: e.target.value })}
                variant="outlined"
                error={!newTask.titre.trim() || newTask.titre.trim().length < 3}
                helperText={
                  !newTask.titre.trim() ? 'Ce champ est obligatoire' : 
                  newTask.titre.trim().length > 0 && newTask.titre.trim().length < 3 ? 'Minimum 3 caractères' : ''
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type d'assignation</InputLabel>
                <Select
                  value={assignmentType}
                  label="Type d'assignation"
                  onChange={(e) => {
                    setAssignmentType(e.target.value);
                    // Réinitialiser les sélections quand on change le type
                    setNewTask(prev => ({
                      ...prev,
                      utilisateurId: '',
                      groupId: ''
                    }));
                  }}
                >
                  <MenuItem value="user">Utilisateur uniquement</MenuItem>
                  <MenuItem value="group">Groupe uniquement</MenuItem>
                  <MenuItem value="both">Utilisateur ET Groupe</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {(assignmentType === 'user' || assignmentType === 'both') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>
                    Utilisateur{assignmentType === 'both' ? ' (optionnel)' : '*'}
                  </InputLabel>
                  <Select
                    value={newTask.utilisateurId}
                    label={`Utilisateur${assignmentType === 'both' ? ' (optionnel)' : '*'}`}
                    onChange={(e) => setNewTask({ ...newTask, utilisateurId: e.target.value })}
                    error={assignmentType === 'user' && !newTask.utilisateurId}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un utilisateur</em>
                    </MenuItem>
                    {users.map(u => (
                      <MenuItem key={u.id} value={u.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#667eea' }}>
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          {u.name} ({u.email})
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {(assignmentType === 'group' || assignmentType === 'both') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>
                    Groupe{assignmentType === 'both' ? ' (optionnel)' : '*'}
                  </InputLabel>
                  <Select
                    value={newTask.groupId}
                    label={`Groupe${assignmentType === 'both' ? ' (optionnel)' : '*'}`}
                    onChange={(e) => setNewTask({ ...newTask, groupId: e.target.value })}
                    error={assignmentType === 'group' && !newTask.groupId}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un groupe</em>
                    </MenuItem>
                    {groups.map(g => (
                      <MenuItem key={g.id} value={g.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <GroupIcon color="primary" />
                          {g.nom}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Aperçu de l'assignation */}
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0' 
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  📋 Aperçu de l'assignation :
                </Typography>
                <Typography variant="body2">
                  {assignmentType === 'user' && newTask.utilisateurId && (
                    `👤 Utilisateur : ${users.find(u => u.id == newTask.utilisateurId)?.name || 'Sélectionné'}`
                  )}
                  {assignmentType === 'group' && newTask.groupId && (
                    `👥 Groupe : ${groups.find(g => g.id == newTask.groupId)?.nom || 'Sélectionné'}`
                  )}
                  {assignmentType === 'both' && (
                    <>
                      {newTask.utilisateurId && `👤 Utilisateur : ${users.find(u => u.id == newTask.utilisateurId)?.name || 'Sélectionné'}`}
                      {newTask.utilisateurId && newTask.groupId && ' | '}
                      {newTask.groupId && `👥 Groupe : ${groups.find(g => g.id == newTask.groupId)?.nom || 'Sélectionné'}`}
                    </>
                  )}
                  {!newTask.utilisateurId && !newTask.groupId && (
                    <span style={{ color: '#666' }}>Aucune assignation sélectionnée</span>
                  )}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => {
              setShowAddTask(false);
              setNewTask({ titre: '', description: '', utilisateurId: '', groupId: '' });
              setAssignmentType('user');
            }} 
            variant="outlined"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant="contained"
            onClick={createTask}
            disabled={
              loading ||
              !newTask.titre.trim() || 
              newTask.titre.trim().length < 3 ||
              (assignmentType === 'user' && !newTask.utilisateurId) || 
              (assignmentType === 'group' && !newTask.groupId) ||
              (assignmentType === 'both' && !newTask.utilisateurId && !newTask.groupId)
            }
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:disabled': { 
                opacity: 0.6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {loading ? 'Création...' : 'Créer la tâche'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity} 
          sx={{ width: '100%' }}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModernAdminDashboard;