import React, { useState } from 'react';
import { Box, Tab, Tabs, Button } from '@mui/material';
import UserManager from './UserManager';
import GroupManager from './GroupManager';

const AdminPanel = ({ handleLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    if (newValue === 2) { // Si c'est l'onglet Déconnexion
      handleLogout();
    } else {
      setCurrentTab(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {/* Barre d'onglets */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="onglets admin"
        >
          <Tab label="Utilisateurs" id="tab-0" aria-controls="panel-0" />
          <Tab label="Groupes" id="tab-1" aria-controls="panel-1" />
          <Tab label="Déconnexion" id="tab-2" />
        </Tabs>
        
        <Button 
          variant="contained" 
          color="primary"
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Exporter les données
        </Button>
      </Box>

      {/* Contenu des onglets */}
      <Box sx={{ width: '100%' }}>
        <div
          role="tabpanel"
          hidden={currentTab !== 0}
          id="panel-0"
          aria-labelledby="tab-0"
        >
          {currentTab === 0 && <UserManager />}
        </div>
        
        <div
          role="tabpanel"
          hidden={currentTab !== 1}
          id="panel-1"
          aria-labelledby="tab-1"
        >
          {currentTab === 1 && <GroupManager />}
        </div>
      </Box>
    </Box>
  );
};

export default AdminPanel;