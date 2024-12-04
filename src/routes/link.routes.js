const express = require('express');
const router = express.Router();
const linkController = require('../controllers/link.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');

// Public routes (authenticated users)
router.get('/', authenticateToken, linkController.getAllLinks);
router.get('/:linkId', authenticateToken, linkController.getLinkById);

// Admin-only routes
router.post('/', authenticateToken, checkRole(['admin']), linkController.createLink);
router.put('/:linkId', authenticateToken, checkRole(['admin']), linkController.updateLink);
router.delete('/:linkId', authenticateToken, checkRole(['admin']), linkController.deleteLink);

module.exports = router;