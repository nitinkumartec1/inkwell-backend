import Story from '../models/Story.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Saved from '../models/Saved.js';
import Like from '../models/Like.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Create a new story
// @route   POST /api/stories
export const createStory = async (req, res) => {
  try {
    const { title, content, description, status, form, language, tags, scheduledAt } = req.body;

    const wordCount = content ? content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const storyData = {
      title,
      content,
      description,
      author: req.user._id,
      status: status || 'draft',
      form: form || 'poetry',
      language: language || 'english',
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags) : [],
      readTime,
    };

    if (scheduledAt) storyData.scheduledAt = new Date(scheduledAt);

    if (req.file) {
      storyData.coverImage = req.file.path;
      storyData.coverImageId = req.file.filename;
    }

    const story = await Story.create(storyData);
    await story.populate('author', 'name username profilePic');

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all published stories (feed)
// @route   GET /api/stories
export const getStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { form, language, tag, sort } = req.query;

    const filter = { status: 'published' };
    if (form) filter.form = form;
    if (language) filter.language = language;
    if (tag) filter.tags = { $in: [tag] };

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { views: -1 };
    if (sort === 'most-liked') sortOption = { likes: -1 };

    const stories = await Story.find(filter)
      .populate('author', 'name username profilePic')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Story.countDocuments(filter);

    res.json({
      stories,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single story by ID
// @route   GET /api/stories/:id
export const getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate(
      'author',
      'name username profilePic bio followers'
    );

    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.views += 1;
    await story.save();

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a story
// @route   PUT /api/stories/:id
export const updateStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, content, description, status, form, language, tags, scheduledAt } = req.body;

    if (title) story.title = title;
    if (content) {
      story.content = content;
      story.readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    }
    if (description !== undefined) story.description = description;
    if (status) story.status = status;
    if (form) story.form = form;
    if (language) story.language = language;
    if (tags) {
      story.tags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    }
    if (scheduledAt) story.scheduledAt = new Date(scheduledAt);

    if (req.file) {
      if (story.coverImageId) {
        await cloudinary.uploader.destroy(story.coverImageId);
      }
      story.coverImage = req.file.path;
      story.coverImageId = req.file.filename;
    }

    await story.save();
    await story.populate('author', 'name username profilePic');

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (story.coverImageId) {
      await cloudinary.uploader.destroy(story.coverImageId);
    }

    await Comment.deleteMany({ story: story._id });
    await Saved.deleteMany({ story: story._id });
    await Story.findByIdAndDelete(story._id);

    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like / Unlike a story
// @route   PUT /api/stories/:id/like
export const toggleLike = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const isLiked = story.likes.includes(req.user._id);

    if (isLiked) {
      story.likes = story.likes.filter((id) => id.toString() !== req.user._id.toString());
      await Like.findOneAndDelete({ user: req.user._id, story: story._id });
    } else {
      story.likes.push(req.user._id);
      await Like.create({ user: req.user._id, story: story._id });

      if (story.author.toString() !== req.user._id.toString()) {
        const author = await User.findById(story.author);
        author.notifications.push({
          type: 'like',
          from: req.user._id,
          story: story._id,
          message: `${req.user.name} liked your story "${story.title}"`,
        });
        await author.save();
      }
    }

    await story.save();
    res.json({ liked: !isLiked, likesCount: story.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's stories by status
// @route   GET /api/stories/user/me?status=draft
export const getMyStories = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { author: req.user._id };
    if (status) filter.status = status;

    const stories = await Story.find(filter)
      .populate('author', 'name username profilePic')
      .sort({ updatedAt: -1 });

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stories by a specific user
// @route   GET /api/stories/user/:id
export const getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.id,
      status: 'published',
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search stories
// @route   GET /api/stories/search?q=query
export const searchStories = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const stories = await Story.find({
      status: 'published',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    })
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics for current user
// @route   GET /api/stories/analytics/me
export const getAnalytics = async (req, res) => {
  try {
    const stories = await Story.find({ author: req.user._id, status: 'published' });

    const totalViews = stories.reduce((sum, s) => sum + s.views, 0);
    const totalLikes = stories.reduce((sum, s) => sum + s.likes.length, 0);
    const totalStories = stories.length;

    const user = await User.findById(req.user._id);
    const totalFollowers = user.followers.length;
    const totalFollowing = user.following.length;

    const topStories = stories
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((s) => ({
        _id: s._id,
        title: s.title,
        views: s.views,
        likes: s.likes.length,
      }));

    res.json({
      totalViews,
      totalLikes,
      totalStories,
      totalFollowers,
      totalFollowing,
      topStories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get liked stories by user
// @route   GET /api/stories/user/:id/liked
export const getLikedStories = async (req, res) => {
  try {
    const likes = await Like.find({ user: req.params.id }).populate({
      path: 'story',
      populate: { path: 'author', select: 'name username profilePic' }
    });
    const stories = likes.map(l => l.story).filter(s => s && s.status === 'published');
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get commented stories by user
// @route   GET /api/stories/user/:id/commented
export const getCommentedStories = async (req, res) => {
  try {
    const comments = await Comment.find({ user: req.params.id }).populate({
      path: 'story',
      populate: { path: 'author', select: 'name username profilePic' }
    });
    const storyMap = new Map();
    comments.forEach(c => {
      if (c.story && c.story.status === 'published' && !storyMap.has(c.story._id.toString())) {
        storyMap.set(c.story._id.toString(), c.story);
      }
    });
    res.json(Array.from(storyMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
