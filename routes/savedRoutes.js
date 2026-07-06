import express from 'express';
import {
  toggleSave,
  getSavedStories,
  getFolders,
  moveToFolder,
  checkSaved,
} from '../controllers/savedController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getSavedStories);
router.get('/folders', protect, getFolders);
router.post('/:storyId', protect, toggleSave);
router.put('/:savedId/folder', protect, moveToFolder);
router.get('/check/:storyId', protect, checkSaved);

export default router;
