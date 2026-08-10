const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/dashboard', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), teacherController.getTeacherDashboard);
router.get('/live-attendance', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), teacherController.getLiveAttendance);
router.get('/students', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), teacherController.getStudentsList);

module.exports = router;
