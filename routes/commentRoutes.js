import express from 'express';
import { addComment, getComments, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commentSchema } from '../validations/comment.schema.js';

const router = express.Router();

router.post('/:storyId', protect, validate(commentSchema), addComment);
router.get('/:storyId', getComments);
router.delete('/:commentId', protect, deleteComment);

export default router;
