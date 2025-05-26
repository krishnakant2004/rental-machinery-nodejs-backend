const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const machineryController = require('../controllers/machinery.controller');

// Public routes
router.get('/', machineryController.listMachinery);
router.get('/:id', machineryController.getMachineryById);

// Protected routes
router.get('/provider/:providerId', machineryController.getMachineryByProviderId);
router.post('/', auth, machineryController.addMachinery);
router.put('/:id', auth, machineryController.updateMachinery);
router.delete('/:id', auth, machineryController.deleteMachinery);

module.exports = router;
