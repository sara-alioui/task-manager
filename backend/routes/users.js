const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// ==================== Route Publique ====================
// Route pour définir le mot de passe (accessible sans auth)
router.post('/set-password', userController.setPassword);

// ==================== Routes Protégées Admin ====================
// Toutes les autres routes nécessitent auth + admin
router.use(auth, admin);

// CRUD utilisateurs
router.get('/', userController.getAllUsers);           // GET /api/users
router.post('/', userController.createUser);          // POST /api/users
router.delete('/:id', userController.deleteUser);     // DELETE /api/users/:id

// Gestion email
router.post('/:id/resend-email', userController.resendPasswordSetup); // POST /api/users/:id/resend-email

// Routes futures (optionnelles)
// router.get('/:id', userController.getUserById);     // GET /api/users/:id
// router.put('/:id', userController.updateUser);      // PUT /api/users/:id

module.exports = router;