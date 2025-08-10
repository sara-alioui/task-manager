module.exports = (req, res, next) => {
  console.log('🔍 Admin middleware - Vérification des droits');
  console.log('👤 Utilisateur:', {
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role
  });
  
  if (!req.user) {
    console.log('❌ Aucun utilisateur authentifié');
    return res.status(401).json({
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    console.log('❌ Accès refusé - Rôle requis: admin, rôle actuel:', req.user.role);
    return res.status(403).json({
      message: 'Accès réservé aux administrateurs'
    });
  }

  console.log('✅ Accès admin autorisé pour:', req.user.email);
  next();
};