const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// All Admin routes require valid JWT token and ADMIN role
router.use(authenticateToken, authorizeRoles('ADMIN'));

// Delete Student
router.delete('/students/:id', adminController.deleteStudent);

// Delete Teacher (Faculty)
router.delete('/teachers/:id', adminController.deleteTeacher);


router.get('/dashboard', adminController.getAdminDashboard);

// Students Management
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.put('/students/:id/password', adminController.changeStudentPassword);
router.post('/students/:id/reset-password', adminController.resetStudentPassword);
router.post('/students/:id/status', adminController.updateStudentStatus);

// Faculty Management
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.put('/teachers/:id/password', adminController.changeTeacherPassword);
router.post('/teachers/:id/reset-password', adminController.resetTeacherPassword);
router.post('/teachers/:id/status', adminController.updateTeacherStatus);

// Labs Management
router.get('/labs', adminController.getLabs);
router.post('/labs', adminController.createLab);

// System Audit Logs & Settings
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
