import express from 'express';
import {
  firebaseAuth,
  getMe,
  updateProfile,
  getUserByUsername,
  toggleFollow,
  getNotifications,
  markNotificationsRead,
  searchUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import { validate } from '../middleware/validate.js';
import { firebaseAuthSchema, updateProfileSchema } from '../validations/auth.schema.js';

const router = express.Router();


router.post('/firebase', validate(firebaseAuthSchema), firebaseAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profilePic'), validate(updateProfileSchema), updateProfile);
router.get('/user/:username', getUserByUsername);
router.put('/follow/:id', protect, toggleFollow);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.get('/search', searchUsers);

export default router;
