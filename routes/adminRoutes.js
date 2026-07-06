import express from 'express';
import {
  adminLogin,
  getAdminMe,
  adminLogout,
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllStories,
  adminDeleteStory,
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { adminLoginSchema, paginationSchema } from '../validations/admin.schema.js';

const router = express.Router();

// Auth
router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/logout', adminLogout);
router.get('/me', adminProtect, getAdminMe);

// Protected (admin only)
router.get('/dashboard', adminProtect, getDashboardStats);

// Users
router.get('/users', adminProtect, validate(paginationSchema), getAllUsers);
router.delete('/users/:id', adminProtect, deleteUser);

// Stories
router.get('/stories', adminProtect, validate(paginationSchema), getAllStories);
router.delete('/stories/:id', adminProtect, adminDeleteStory);

export default router;
