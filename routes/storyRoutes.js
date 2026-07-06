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
import {
  createStorySchema,
  updateStorySchema,
  idParamSchema,
  paginationQuerySchema,
} from '../utils/validators.js';

const router = express.Router();

router.get('/search', searchStories);
router.get('/analytics/me', protect, getAnalytics);
router.get('/user/me', protect, getMyStories);
router.get('/user/:userId', validate(idParamSchema), getUserStories);
router.get('/user/:userId/liked', validate(idParamSchema), getLikedStories);
router.get('/user/:userId/commented', validate(idParamSchema), getCommentedStories);

router
  .route('/')
  .get(optionalAuth, validate(paginationQuerySchema), getStories)
  .post(protect, upload.single('coverImage'), validate(createStorySchema), createStory);

router
  .route('/:id')
  .get(optionalAuth, validate(idParamSchema), getStory)
  .put(protect, upload.single('coverImage'), validate(updateStorySchema), updateStory)
  .delete(protect, validate(idParamSchema), deleteStory);

router.put('/:id/like', protect, validate(idParamSchema), toggleLike);

export default router;
