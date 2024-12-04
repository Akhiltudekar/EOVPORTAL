const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');

// Public routes (authenticated users)
router.get('/', authenticateToken, employeeController.getAllEmployees);
router.get('/:employeeId', authenticateToken, employeeController.getEmployeeById);
router.get('/profile', authenticateToken, employeeController.getEmployeeProfile);
router.get('/:employeeId/projects', authenticateToken, employeeController.getEmployeeProjects);
router.get('/:employeeId/certifications', authenticateToken, employeeController.getEmployeeCertifications);
router.get('/:employeeId/links', authenticateToken, employeeController.getEmployeeLinks);

// Admin-only routes
router.post('/', authenticateToken, checkRole(['admin']), employeeController.createEmployee);
router.put('/:employeeId', authenticateToken, checkRole(['admin']), employeeController.updateEmployee);
router.delete('/:employeeId', authenticateToken, checkRole(['admin']), employeeController.deleteEmployee);

// User can update their own profile and photo
router.put('/profile', authenticateToken, employeeController.updateEmployeeProfile);
router.put('/profile/photo', authenticateToken, employeeController.updateEmployeePhoto);

module.exports = router;