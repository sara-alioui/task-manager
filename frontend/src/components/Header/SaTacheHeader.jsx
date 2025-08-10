import React from 'react';
import { 
  Box, 
  Typography, 
  Divider,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const SaTacheHeader = ({ 
  title = "Dashboard", 
  subtitle = "",
  showBackButton = false,
  onBackClick = () => {},
  actions = null 
}) => {
  return (
    <AppBar 
      position="static" 
      elevation={1}
      sx={{ 
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid #e0e0e0'
      }}
    >
      <Toolbar sx={{ py: 2, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {/* Bouton retour optionnel */}
          {showBackButton && (
            <IconButton 
              onClick={onBackClick}
              sx={{ mr: 2, color: 'text.primary' }}
            >
              <ArrowBack />
            </IconButton>
          )}

          {/* Logo et Titre saTACHE */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            {/* Logo - Taille augmentée ici */}
            <Box sx={{ mr: 2 }}>
              <img 
                src={`${process.env.PUBLIC_URL}/sara.png`}
                alt="saTACHE Logo" 
                style={{
                  width: '64px',  // Augmenté de 48px à 64px
                  height: '64px', // Augmenté de 48px à 64px
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  console.log("❌ Erreur chargement image:", e.target.src);
                  console.log("❌ Vérifiez que sara.png est dans le dossier public/");
                  e.target.style.display = 'none';
                }}
                onLoad={() => console.log("✅ Image sara.png chargée avec succès")}
              />
            </Box>
            
            {/* Texte saTACHE stylisé */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', mr: 3 }}>
              <Typography 
                variant="h4" 
                component="span"
                sx={{ 
                  fontWeight: 300,
                  color: 'text.primary',
                  fontStyle: 'italic',
                  transform: 'skewX(-6deg)',
                  mr: 0.5
                }}
              >
                sa
              </Typography>
              <Typography 
                variant="h4" 
                component="span"
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontStyle: 'italic',
                  transform: 'skewX(-6deg)'
                }}
              >
                TACHE
              </Typography>
            </Box>
            
            {/* Séparateur vertical */}
            <Divider 
              orientation="vertical" 
              flexItem 
              sx={{ 
                mx: 2, 
                height: '32px',
                alignSelf: 'center',
                bgcolor: 'grey.300'
              }} 
            />
            
            {/* Titre et sous-titre de la page */}
            <Box>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  lineHeight: 1.2
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    mt: 0.5
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Zone droite pour actions personnalisées */}
        {actions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default SaTacheHeader;