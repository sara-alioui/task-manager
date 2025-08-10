const jwt = require('jsonwebtoken');
const { execute } = require('../db');

module.exports = async (req, res, next) => {
  // 🔍 Debug : affiche le chemin de la requête
  console.log('🔍 Auth middleware - Path:', req.path, 'Method:', req.method);
  
  // ✅ Routes publiques autorisées (pas d'auth requise)
  const publicRoutes = [
    '/register', 
    '/login',
    '/set-password' // Route publique pour définir le mot de passe
  ];
  
  if (publicRoutes.includes(req.path)) {
    console.log('✅ Route publique autorisée:', req.path);
    return next();
  }
  
  try {
    // 🔍 Récupération du token depuis plusieurs sources
    const token = 
      req.cookies?.token ||
      req.headers?.authorization?.replace('Bearer ', '') ||
      req.headers?.authorization?.split(' ')[1] ||
      req.query?.token;

    if (!token) {
      console.log('❌ Aucun token fourni');
      return res.status(401).json({
        message: 'Authentification requise - Token manquant'
      });
    }

    // 🔐 Vérification du token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token décodé:', { id: decoded.id, email: decoded.email, role: decoded.role });

    // 🔍 Vérification que l'utilisateur existe en base
    const result = await execute(
      `SELECT id, nom, email, role FROM utilisateurs WHERE id = :id`,
      { id: decoded.id }  // 🔧 CORRECTION: id au lieu de userId
    );

    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Utilisateur introuvable pour ID:', decoded.id);
      return res.status(401).json({
        message: 'Utilisateur introuvable'
      });
    }

    // 📝 Ajout des informations utilisateur à la requête
    const user = result.rows[0];
    req.user = {
      id: user.ID,           // 🔧 CORRECTION: utilisation cohérente de 'id'
      nom: user.NOM,
      email: user.EMAIL,
      role: user.ROLE?.toLowerCase(),
    };

    console.log('✅ Utilisateur authentifié:', { 
      id: req.user.id, 
      email: req.user.email, 
      role: req.user.role 
    });
    
    next();

  } catch (err) {
    console.error('❌ Erreur auth middleware:', err.message);
    
    // 🔍 Messages d'erreur spécifiques selon le type d'erreur JWT
    let errorMessage = 'Token invalide';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token expiré - Reconnectez-vous';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Token malformé';
    }
    
    return res.status(401).json({
      message: errorMessage
    });
  }
};