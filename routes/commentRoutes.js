import express from 'express';
import { addComment, getComments, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:storyId', protect, addComment);
router.get('/:storyId', getComments);
router.delete('/:commentId', protect, deleteComment);

export default router;
