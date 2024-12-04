const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');

// Public routes (authenticated users)
router.get('/', authenticateToken, projectController.getAllProjects);
router.get('/:projectId', authenticateToken, projectController.getProjectById);

// Admin-only routes
router.post('/', authenticateToken, checkRole(['admin']), projectController.createProject);
router.put('/:projectId', authenticateToken, checkRole(['admin']), projectController.updateProject);
router.delete('/:projectId', authenticateToken, checkRole(['admin']), projectController.deleteProject);

module.exports = router;