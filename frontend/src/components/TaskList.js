import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Avatar
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const TaskList = ({ users = [], userRole = 'user', currentUserId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [groupes, setGroupes] = useState([]);
  const [currentTask, setCurrentTask] = useState({
    id: null,
    titre: '',
    description: '',
    statut: 'à faire',
    assignedTo: [],
    deadline: '',
    groupe: ''
  });

  const isAdmin = userRole === 'admin';

  // ✅ useCallback pour stabiliser la fonction
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const tasksUrl = isAdmin 
        ? 'http://localhost:5000/api/tasks' 
        : 'http://localhost:5000/api/tasks/mes-taches';

      const [tasksRes, groupesRes] = await Promise.all([
        axios.get(tasksUrl, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/groupes', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const allTasks = tasksRes.data.tasks || [];
      setTasks(allTasks);
      setGroupes(groupesRes.data.groupes || []);
    } catch (error) {
      console.error('Erreur:', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUserId]);

  // ✅ useEffect dépend de fetchData pour éviter le warning
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}`,
        { statut: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Erreur:', error.response?.data?.error || error.message);
    }
  };

  const handleSubmit = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const taskData = {
        titre: currentTask.titre,
        description: currentTask.description,
        statut: currentTask.statut,
        dateLimite: currentTask.deadline,
        groupeId: currentTask.groupe,
        assigneA: currentTask.assignedTo[0] || null
      };

      if (currentTask.id) {
        await axios.put(
          `http://localhost:5000/api/tasks/${currentTask.id}`,
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/tasks',
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      fetchData();
      setOpen(false);
    } catch (error) {
      console.error('Erreur:', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!isAdmin) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Erreur:', error.response?.data?.error || error.message);
    }
  };

  const handleEdit = (task) => {
    if (!isAdmin) return;
    setCurrentTask({
      id: task.id || task._id,
      titre: task.titre,
      description: task.description,
      statut: task.statut,
      assignedTo: task.assigneA ? [task.assigneA] : [],
      deadline: task.dateLimite || '',
      groupe: task.groupe || ''
    });
    setOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          {isAdmin ? 'Gestion des Tâches' : 'Mes Tâches'}
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              setCurrentTask({
                id: null,
                titre: '',
                description: '',
                statut: 'à faire',
                assignedTo: [],
                deadline: '',
                groupe: ''
              });
              setOpen(true);
            }}
          >
            Nouvelle Tâche
          </Button>
        )}
      </Box>

      {loading && !tasks.length ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Titre</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
                {isAdmin && <TableCell>Assigné à</TableCell>}
                <TableCell>Groupe</TableCell>
                <TableCell>Date limite</TableCell>
                {isAdmin && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length > 0 ? tasks.map((task) => {
                const taskKey = task.id || task._id;
                const assignedUser = users.find(u => u._id === task.assigneA);
                const taskGroup = groupes.find(g => g._id === task.groupe);

                return (
                  <TableRow key={`task-${taskKey}`}>
                    <TableCell>{task.titre}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <Select
                        value={task.statut}
                        onChange={(e) => handleStatusChange(taskKey, e.target.value)}
                        size="small"
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="à faire">À faire</MenuItem>
                        <MenuItem value="en cours">En cours</MenuItem>
                        <MenuItem value="terminé">Terminé</MenuItem>
                      </Select>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {assignedUser && (
                          <Chip 
                            label={assignedUser.nom || assignedUser.name} 
                            avatar={<Avatar>{(assignedUser.nom || assignedUser.name).charAt(0)}</Avatar>}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>{taskGroup?.nom || '-'}</TableCell>
                    <TableCell>{task.dateLimite ? formatDate(task.dateLimite) : '-'}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <IconButton onClick={() => handleEdit(task)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(taskKey)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {isAdmin ? 'Aucune tâche trouvée' : 'Aucune tâche assignée'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isAdmin && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentTask.id ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                label="Titre *"
                fullWidth
                value={currentTask.titre}
                onChange={(e) => setCurrentTask({...currentTask, titre: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={currentTask.description}
                onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Statut *</InputLabel>
                <Select
                  value={currentTask.statut}
                  label="Statut"
                  onChange={(e) => setCurrentTask({...currentTask, statut: e.target.value})}
                >
                  <MenuItem value="à faire">À faire</MenuItem>
                  <MenuItem value="en cours">En cours</MenuItem>
                  <MenuItem value="terminé">Terminé</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Assigner à</InputLabel>
                <Select
                  value={currentTask.assignedTo}
                  onChange={(e) => setCurrentTask({...currentTask, assignedTo: e.target.value})}
                  renderValue={(selected) => {
                    if (selected.length === 0) return <em>Non assigné</em>;
                    const user = users.find(u => u._id === selected[0]);
                    return user ? <Chip label={user.nom || user.name} /> : null;
                  }}
                >
                  <MenuItem value={[]}>
                    <em>Non assigné</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={[user._id]}>
                      {user.nom || user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Groupe</InputLabel>
                <Select
                  value={currentTask.groupe}
                  label="Groupe"
                  onChange={(e) => setCurrentTask({...currentTask, groupe: e.target.value})}
                >
                  <MenuItem value="">
                    <em>Aucun groupe</em>
                  </MenuItem>
                  {groupes.map((groupe) => (
                    <MenuItem key={groupe._id} value={groupe._id}>
                      {groupe.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Date limite"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentTask.deadline}
                onChange={(e) => setCurrentTask({...currentTask, deadline: e.target.value})}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={loading || !currentTask.titre}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {currentTask.id ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default TaskList;
