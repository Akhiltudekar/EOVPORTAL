const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certification.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');

// Public routes (authenticated users)
router.get('/', authenticateToken, certificationController.getAllCertifications);
router.get('/:certificationId', authenticateToken, certificationController.getCertificationById);

// Routes accessible by both admin and regular users
router.post('/', authenticateToken, certificationController.createCertification);
router.put('/:certificationId', authenticateToken, certificationController.updateCertification);

// Admin-only route
router.delete('/:certificationId', authenticateToken, checkRole(['admin']), certificationController.deleteCertification);

module.exports = router;