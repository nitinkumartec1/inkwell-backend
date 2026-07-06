import express from 'express';
import {
  createStory,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  toggleLike,
  getMyStories,
  getUserStories,
  searchStories,
  getAnalytics,
  getLikedStories,
  getCommentedStories,
} from '../controllers/storyController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import { validate } from '../middleware/validate.js';
import { storySchema, updateStorySchema } from '../validations/story.schema.js';

const router = express.Router();

router.get('/search', searchStories);
router.get('/analytics/me', protect, getAnalytics);
router.get('/user/me', protect, getMyStories);
router.get('/user/:userId', getUserStories);
router.get('/user/:userId/liked', getLikedStories);
router.get('/user/:userId/commented', getCommentedStories);

router
  .route('/')
  .get(optionalAuth, getStories)
  .post(protect, upload.single('coverImage'), validate(storySchema), createStory);

router
  .route('/:id')
  .get(optionalAuth, getStory)
  .put(protect, upload.single('coverImage'), validate(updateStorySchema), updateStory)
  .delete(protect, deleteStory);

router.put('/:id/like', protect, toggleLike);

export default router;
