const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/', authenticateToken, projectController.getAllProjects);
router.post('/', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), projectController.createProject);
router.post('/request', authenticateToken, authorizeRoles('STUDENT'), projectController.submitProjectRequest);
router.get('/requests', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), projectController.getProjectRequests);
router.put('/requests/:requestId', authenticateToken, authorizeRoles('TEACHER', 'ADMIN'), projectController.updateProjectRequestStatus);

module.exports = router;
