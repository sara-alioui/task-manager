import React, { useState } from 'react';
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
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserManager = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin Test', email: 'admin@test.com', role: 'admin' },
    { id: 2, name: 'User Test', email: 'user@test.com', role: 'user' }
  ]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email.includes('@')) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs', severity: 'error' });
      return;
    }

    const newId = Math.max(...users.map(u => u.id)) + 1;
    setUsers([...users, { ...newUser, id: newId }]);
    setSnackbar({ open: true, message: 'Utilisateur créé avec succès', severity: 'success' });
    setOpenDialog(false);
    setNewUser({ name: '', email: '', role: 'user' });
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
    setSnackbar({ open: true, message: 'Utilisateur supprimé', severity: 'info' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h2>Gestion des Utilisateurs</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Ajouter
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</TableCell>
                <TableCell>
                  <IconButton color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour créer un utilisateur */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom complet"
            fullWidth
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
          />
          <Select
            fullWidth
            margin="dense"
            value={newUser.role}
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
          >
            <MenuItem value="user">Utilisateur</MenuItem>
            <MenuItem value="admin">Administrateur</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateUser} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManager;