const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.post('/verify', authenticateToken, authorizeRoles('STUDENT'), attendanceController.verifyAndMarkAttendance);
router.get('/history', authenticateToken, authorizeRoles('STUDENT'), attendanceController.getStudentAttendanceHistory);

module.exports = router;
