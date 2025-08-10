import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Grid,
  Button,
  Divider,
  AppBar,
  Toolbar,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Groups,
  Person,
  ArrowBack,
  AdminPanelSettings,
  Schedule,
  AccountCircle
} from '@mui/icons-material';

const MesGroupes = () => {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    const fetchMesGroupes = async () => {
      try {
        const response = await axios.get('/groups/');
        console.log('Réponse API:', response.data);
        
        const groupesData = response.data.data || response.data || [];
        setGroupes(groupesData);
        
        // Charger les détails de chaque groupe (membres)
        groupesData.forEach(groupe => {
          fetchGroupeDetails(groupe.id);
        });
        
      } catch (err) {
        console.error('Erreur chargement groupes:', err);
        setErreur("Impossible de charger vos groupes.");
      } finally {
        setLoading(false);
      }
    };

    fetchMesGroupes();
  }, []);

  const fetchGroupeDetails = async (groupeId) => {
    try {
      setLoadingDetails(prev => ({ ...prev, [groupeId]: true }));
      const response = await axios.get(`/groups/${groupeId}`);
      
      // Mettre à jour le groupe avec ses membres
      setGroupes(prev => prev.map(groupe => 
        groupe.id === groupeId 
          ? { ...groupe, membres: response.data.data?.membres || response.data.membres || [] }
          : groupe
      ));
    } catch (err) {
      console.error(`Erreur détails groupe ${groupeId}:`, err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [groupeId]: false }));
    }
  };

  const handleRetourDashboard = () => {
    navigate('/dashboard');
  };

  const getInitials = (nom, prenom) => {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  };

  const getRandomColor = (index) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#0288d1', '#00796b', '#f9a825'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <>
      {/* En-tête */}
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleRetourDashboard}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Groups sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mes Groupes de Travail
          </Typography>
          <Chip 
            label={`${groupes.length} groupe${groupes.length > 1 ? 's' : ''}`}
            color="secondary"
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {erreur && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erreur}
          </Alert>
        )}

        {groupes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <Groups sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              Aucun groupe assigné
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Vous ne faites partie d'aucun groupe pour le moment.
            </Typography>
            <Button
              variant="contained"
              onClick={handleRetourDashboard}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Retour au tableau de bord
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {groupes.map((groupe, index) => (
              <Grid item xs={12} md={6} lg={4} key={groupe.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent>
                    {/* En-tête du groupe */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getRandomColor(index),
                          width: 56,
                          height: 56,
                          mr: 2,
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        <Groups />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {groupe.nom}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {groupe.nb_membres || (groupe.membres ? groupe.membres.length : 0)} membre{(groupe.nb_membres || 0) > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Description */}
                    {groupe.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {groupe.description}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Informations du créateur */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <AdminPanelSettings fontSize="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>Créé par :</strong> {groupe.createur_nom || 'Administrateur'}
                      </Typography>
                    </Box>

                    {/* Liste des membres */}
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <Groups fontSize="small" sx={{ mr: 1 }} />
                      Membres de l'équipe :
                    </Typography>

                    {loadingDetails[groupe.id] ? (
                      <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : groupe.membres && groupe.membres.length > 0 ? (
                      <List dense sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                        {groupe.membres.map((membre, membreIndex) => (
                          <ListItem key={membre.id || membreIndex} sx={{ py: 0.5 }}>
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.75rem',
                                  bgcolor: getRandomColor(membreIndex)
                                }}
                              >
                                {getInitials(membre.nom, membre.prenom)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {membre.prenom} {membre.nom}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {membre.email}
                                </Typography>
                              }
                            />
                            {membre.role === 'admin' && (
                              <Chip 
                                label="Admin" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            )}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                        Chargement des membres...
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Bouton de retour */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleRetourDashboard}
            startIcon={<ArrowBack />}
            size="large"
          >
            Retour au tableau de bord
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default MesGroupes;