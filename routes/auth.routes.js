const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/updatePassword/:id',authController.updatePassword);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/roles/add', auth, authController.addRole);
router.post('/roles/remove', auth, authController.removeRole);
router.put('/labour/availability', auth, authController.updateLabourAvailability);
router.post('/logout', auth, authController.logout);
router.post('/check-auth', auth, authController.checkAuth);

module.exports = router;
