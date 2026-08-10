const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/dashboard', authenticateToken, authorizeRoles('STUDENT'), studentController.getDashboard);
router.get('/notifications', authenticateToken, authorizeRoles('STUDENT'), studentController.getNotifications);
router.put('/profile', authenticateToken, authorizeRoles('STUDENT'), studentController.updateProfile);

module.exports = router;
