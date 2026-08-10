const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.post('/start', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), sessionController.startSession);
router.post('/stop', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), sessionController.stopSession);
router.get('/current', sessionController.getCurrentActiveSession); // Open endpoint for PC lab display & student scan

module.exports = router;
