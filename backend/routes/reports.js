const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/attendance', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), reportController.getAttendanceReport);

module.exports = router;
