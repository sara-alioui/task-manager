import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  Select,
  MenuItem
} from '@mui/material';

const STATUS_CONFIG = {
  'A_FAIRE': { label: 'À faire', color: 'default' },
  'EN_COURS': { label: 'En cours', color: 'warning' },
  'TERMINE': { label: 'Terminé', color: 'success' }
};

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/mes-taches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Erreur tâches:', err);
      setError(err.response?.data?.error || 'Erreur de chargement');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userResponse = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserData(userResponse.data.user);
        await fetchTasks(userResponse.data.user.id);
      } catch (err) {
        console.error('Erreur dashboard:', err);
        setError(err.response?.data?.error || 'Erreur de chargement');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}`,
        { statut: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, statut: newStatus } : task
      ));
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    }
  };

  if (loading && !userData) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ padding: '2rem' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ padding: '2rem' }}>
      <Box sx={{ marginBottom: '2rem' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          📋 Mes Tâches
        </Typography>
        {userData && (
          <Typography variant="subtitle1" gutterBottom>
            Bienvenue, {userData.nom}
          </Typography>
        )}
      </Box>

      <Box sx={{ marginBottom: '3rem' }}>
        {loading ? (
          <CircularProgress />
        ) : tasks.length === 0 ? (
          <Paper elevation={3} sx={{ padding: '2rem', textAlign: 'center' }}>
            <Typography>Aucune tâche assignée</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Titre</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date limite</TableCell>
                  <TableCell>Groupe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.titre}</TableCell>
                    <TableCell>{task.description || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={task.statut}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <MenuItem key={value} value={value}>
                            <Chip label={config.label} color={config.color} size="small" />
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      {task.dateEcheance ? new Date(task.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell>{task.groupe || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;