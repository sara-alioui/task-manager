import React from 'react';
import { Card, CardContent, Typography, Avatar, Box } from '@mui/material';

const StatsWidget = ({ icon, title, value, color }) => {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ 
            bgcolor: `${color}20`, 
            color: color,
            width: 56,
            height: 56
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsWidget;