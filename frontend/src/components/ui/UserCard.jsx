import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Chip, 
  Button, 
  Box 
} from '@mui/material';
import { Person, Email, Phone, Edit, Delete } from '@mui/icons-material';

const UserCard = ({ user, onEdit, onDelete }) => {
  const getRoleColor = () => {
    switch(user?.role) {
      case 'admin': return { bg: '#ff00f520', text: '#ff00f5', label: '⚡ Admin' };
      case 'editor': return { bg: '#00f5ff20', text: '#00f5ff', label: '✍️ Editeur' };
      default: return { bg: '#b5ff0020', text: '#b5ff00', label: '👤 Utilisateur' };
    }
  };

  const { bg, text, label } = getRoleColor();

  return (
    <Card sx={{ 
      borderRadius: 3,
      transition: 'all 0.3s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ 
            width: 60, 
            height: 60, 
            mr: 2,
            bgcolor: text
          }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">{user.name}</Typography>
            <Chip 
              label={label}
              size="small"
              sx={{ 
                bgcolor: bg,
                color: text,
                mt: 0.5
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Email sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>

        {user.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Phone sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {user.phone}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            startIcon={<Edit />}
            onClick={() => onEdit(user)}
          >
            Modifier
          </Button>
          <Button 
            size="small" 
            color="error" 
            startIcon={<Delete />}
            onClick={() => onDelete(user.id)}
          >
            Supprimer
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserCard;