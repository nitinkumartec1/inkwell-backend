import express from 'express';
import {
  adminLogin,
  getAdminMe,
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllStories,
  adminDeleteStory,
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/adminAuth.js';

const router = express.Router();

// Public
router.post('/login', adminLogin);

// Protected (admin only)
router.get('/me', adminProtect, getAdminMe);
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/users', adminProtect, getAllUsers);
router.delete('/users/:id', adminProtect, deleteUser);
router.get('/stories', adminProtect, getAllStories);
router.delete('/stories/:id', adminProtect, adminDeleteStory);

export default router;
