import express from 'express';
import {
  loginAdmin,
  registerAdmin,
  getAdminProfile,
  refreshAdminToken,
  logoutAdmin,
  deactivateAdmin,
  getAllAdmins
} from '../controllers/admin.controller.js';

import { adminAuthenticate, adminRole } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/refresh-token', refreshAdminToken);

// Superadmin only
router.post('/register', adminAuthenticate, adminRole('superadmin'), registerAdmin);

// Admin Protected Routes
router.get('/profile', adminAuthenticate, getAdminProfile);
router.post('/logout', adminAuthenticate, logoutAdmin);
router.put('/deactivate', adminAuthenticate, deactivateAdmin);

// Only superadmin can see all admins
router.get('/all', adminAuthenticate, adminRole('superadmin'), getAllAdmins);

export default router;
