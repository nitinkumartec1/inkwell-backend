import Comment from '../models/Comment.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

// @desc    Add comment to a story
// @route   POST /api/comments/:storyId
export const addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;
    const story = await Story.findById(req.params.storyId);

    if (!story) return res.status(404).json({ message: 'Story not found' });

    const comment = await Comment.create({
      user: req.user._id,
      story: req.params.storyId,
      text,
      parentComment: parentComment || null,
    });

    await comment.populate('user', 'name username profilePic');

    if (story.author.toString() !== req.user._id.toString()) {
      const author = await User.findById(story.author);
      author.notifications.push({
        type: 'comment',
        from: req.user._id,
        story: story._id,
        message: `${req.user.name} commented on "${story.title}"`,
      });
      await author.save();
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a story
// @route   GET /api/comments/:storyId
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      story: req.params.storyId,
      parentComment: null,
    })
      .populate('user', 'name username profilePic')
      .sort({ createdAt: -1 });

    const replies = await Comment.find({
      story: req.params.storyId,
      parentComment: { $ne: null },
    })
      .populate('user', 'name username profilePic')
      .sort({ createdAt: 1 });

    const commentsWithReplies = comments.map((comment) => ({
      ...comment.toObject(),
      replies: replies.filter(
        (r) => r.parentComment.toString() === comment._id.toString()
      ),
    }));

    res.json(commentsWithReplies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
