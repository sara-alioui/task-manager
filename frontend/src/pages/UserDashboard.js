import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Fab
} from '@mui/material';
import { 
  Logout, 
  CheckCircle, 
  PlayCircle, 
  RestartAlt,
  Groups,
  Assignment,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import SaTacheHeader from '../components/Header/SaTacheHeader';

const STATUS_OPTIONS = {
  A_FAIRE: { label: 'À faire', color: 'warning' },
  EN_COURS: { label: 'En cours', color: 'info' },
  TERMINE: { label: 'Terminé', color: 'success' }
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [userResponse, tasksResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/tasks/mes-taches', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setUser(userResponse.data);
        setTasks(tasksResponse.data.tasks.map(task => ({
          ...task,
          id: task._id || task.id,
          titre: task.titre || 'Sans titre',
          description: task.description || '-',
          statut: task.statut || 'A_FAIRE',
          dateEcheance: task.dateEcheance || null
        })));
      } catch (error) {
        showNotification('Erreur lors du chargement des données', 'error');
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // 🚀 Nouvelle fonction pour aller vers Mes Groupes
  const handleGoToGroups = () => {
    navigate('/mes-groupes');
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}`,
        { statut: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, statut: newStatus } : task
      ));
      showNotification('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur:', error.response?.data || error.message);
      showNotification(
        error.response?.data?.message || 'Erreur lors de la mise à jour', 
        'error'
      );
    }
  };

  const getStatusActions = (currentStatus) => {
    const actions = {
      A_FAIRE: [{ status: 'EN_COURS', icon: <PlayCircle />, label: 'Commencer', color: 'primary' }],
      EN_COURS: [
        { status: 'TERMINE', icon: <CheckCircle />, label: 'Terminer', color: 'success' },
        { status: 'A_FAIRE', icon: <RestartAlt />, label: 'Reporter', color: 'warning' }
      ],
      TERMINE: [{ status: 'EN_COURS', icon: <PlayCircle />, label: 'Reprendre', color: 'info' }]
    };
    return actions[currentStatus] || [];
  };

  // Statistiques des tâches
  const taskStats = {
    total: tasks.length,
    aFaire: tasks.filter(t => t.statut === 'A_FAIRE').length,
    enCours: tasks.filter(t => t.statut === 'EN_COURS').length,
    terminees: tasks.filter(t => t.statut === 'TERMINE').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 🎯 AJOUT DE SATACHEHEADER ICI - EN HAUT DE TOUT */}
      <SaTacheHeader 
        title={`Tableau de Bord - ${user?.prenom || 'Utilisateur'}`}
        subtitle="Gérez vos tâches et suivez votre progression"
        showBackButton={false}
      />

      {/* En-tête améliorée */}
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mes Tâches - {user?.prenom || 'Utilisateur'}
          </Typography>
          
          {/* 🚀 Bouton Mes Groupes dans la barre de navigation */}
          <Button
            color="inherit"
            startIcon={<Groups />}
            onClick={handleGoToGroups}
            sx={{ mr: 2 }}
          >
            Mes Groupes
          </Button>
          
          <IconButton color="inherit" onClick={handleLogout} title="Déconnexion">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Section des statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assignment sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {taskStats.total}
                    </Typography>
                    <Typography variant="body2">
                      Total des tâches
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                    <Typography variant="h6" fontWeight="bold">!</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {taskStats.aFaire}
                    </Typography>
                    <Typography variant="body2">
                      À faire
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PlayCircle sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {taskStats.enCours}
                    </Typography>
                    <Typography variant="body2">
                      En cours
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #96fbc4 0%, #f9f9f9 100%)', color: '#2e7d32' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {taskStats.terminees}
                    </Typography>
                    <Typography variant="body2">
                      Terminées
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Section principale */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Mes Tâches
          </Typography>
          
          {/* 🚀 Bouton principal Mes Groupes */}
          <Button
            variant="contained"
            startIcon={<Groups />}
            onClick={handleGoToGroups}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            Voir Mes Groupes
          </Button>
        </Box>
        
        {tasks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <Assignment sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune tâche assignée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vous n'avez actuellement aucune tâche à effectuer.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Titre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Date limite</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task, index) => (
                  <TableRow 
                    key={`task-${task.id}`}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                      '&:hover': { backgroundColor: '#f0f0f0' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{task.titre}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={STATUS_OPTIONS[task.statut]?.label || task.statut} 
                        color={STATUS_OPTIONS[task.statut]?.color || 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      {task.dateEcheance 
                        ? new Date(task.dateEcheance).toLocaleDateString('fr-FR') 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {getStatusActions(task.statut).map(action => (
                          <Button
                            key={action.status}
                            variant="outlined"
                            size="small"
                            startIcon={action.icon}
                            color={action.color}
                            onClick={() => handleStatusChange(task.id, action.status)}
                            sx={{ minWidth: 100 }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* 🚀 Bouton flottant pour accès rapide aux groupes */}
      <Fab
        color="primary"
        aria-label="mes-groupes"
        onClick={handleGoToGroups}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          }
        }}
      >
        <Groups />
      </Fab>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDashboard;