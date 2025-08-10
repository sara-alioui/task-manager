const express = require('express');
const router = express.Router();

const groupController = require('../controllers/groupController');
const {
  validateGroup,
  validateIdParam,
  checkValidationErrors
} = require('../middlewares/validators');

const auth = require('../middlewares/auth');

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Seuls les administrateurs peuvent effectuer cette action.'
    });
  }
  next();
};

// 📋 Récupérer la liste des utilisateurs pour la sélection (admin uniquement)
router.get(
  '/users',
  auth,
  requireAdmin,
  groupController.getAvailableUsers
);

// 📋 Récupérer tous les groupes (admin voit tout, utilisateur voit ses groupes)
router.get(
  '/all',
  auth,
  requireAdmin,
  groupController.getAllGroups
);

// ✅ Créer un groupe (admin uniquement)
router.post(
  '/',
  auth,
  requireAdmin,
  validateGroup,
  checkValidationErrors,
  groupController.create
);

// ✏️ Modifier un groupe (admin uniquement)
router.put(
  '/:id',
  auth,
  requireAdmin,
  validateIdParam,
  validateGroup,
  checkValidationErrors,
  groupController.update
);

// 🗑️ Supprimer un groupe (admin uniquement)
router.delete(
  '/:id',
  auth,
  requireAdmin,
  validateIdParam,
  checkValidationErrors,
  groupController.delete
);

// ➕ Ajouter un membre à un groupe (admin uniquement)
router.post(
  '/:id/members',
  auth,
  requireAdmin,
  validateIdParam,
  checkValidationErrors,
  groupController.addMember
);

// ➖ Supprimer un membre d'un groupe (admin uniquement)
router.delete(
  '/:id/members',
  auth,
  requireAdmin,
  validateIdParam,
  checkValidationErrors,
  groupController.removeMember
);

// 📋 Récupérer les groupes de l'utilisateur connecté
router.get(
  '/',
  auth,
  groupController.getUserGroups
);

// 🔍 Récupérer les détails d'un groupe avec ses membres
router.get(
  '/:id',
  auth,
  validateIdParam,
  checkValidationErrors,
  groupController.getGroupDetails
);

module.exports = router;