const express = require('express');
const router = express.Router();
const {
  getUnits,
  createUnit,
  allocateUnit,
  getMyUnit
} = require('../controllers/unitController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Admin/Staff routes
router.get('/', verifyToken, authorizeRoles('admin', 'staff'), getUnits);
router.post('/', verifyToken, authorizeRoles('admin', 'staff'), createUnit);
router.put('/:id', verifyToken, authorizeRoles('admin', 'staff'), allocateUnit);

// Resident route
router.get('/my-unit', verifyToken, authorizeRoles('homeowner', 'tenant'), getMyUnit);

module.exports = router;
