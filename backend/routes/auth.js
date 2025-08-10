const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ==================== Routes Publiques (SANS middleware) ====================
router.post('/register', authController.register);
router.post('/login', authController.login);

// ==================== Routes Protégées (AVEC middleware) ====================
// 🔧 CORRECTION : Import correct du middleware
const authMiddleware = require('../middlewares/auth');

router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/verify', authMiddleware, authController.verifyToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;