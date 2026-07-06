import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Story from '../models/Story.js';
import Comment from '../models/Comment.js';
import Saved from '../models/Saved.js';
import Like from '../models/Like.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Generate a signed JWT for admin sessions.
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ─── Admin Login ───────────────────────────────────────────────
// @desc    Authenticate admin with email + password
// @route   POST /api/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Not an admin account.' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This admin account has no password set. Run the seed script.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Get Admin Profile ─────────────────────────────────────────
// @desc    Return current admin user info (token validation)
// @route   GET /api/admin/me
export const getAdminMe = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      profilePic: req.user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Dashboard Stats ───────────────────────────────────────────
// @desc    Get platform-wide analytics for the admin dashboard
// @route   GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStories = await Story.countDocuments();
    const totalPublished = await Story.countDocuments({ status: 'published' });
    const totalDrafts = await Story.countDocuments({ status: 'draft' });

    // Aggregate views and likes
    const storyAgg = await Story.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
        },
      },
    ]);

    const totalViews = storyAgg[0]?.totalViews || 0;
    const totalLikes = storyAgg[0]?.totalLikes || 0;

    // Recent signups (last 10)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name username email profilePic createdAt role');

    // Recent stories (last 10)
    const recentStories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'name username profilePic')
      .select('title status views createdAt form language');

    // Content breakdown by form
    const formBreakdown = await Story.aggregate([
      { $group: { _id: '$form', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalUsers,
      totalStories,
      totalPublished,
      totalDrafts,
      totalViews,
      totalLikes,
      recentUsers,
      recentStories,
      formBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── User Management ──────────────────────────────────────────
// @desc    Get all users with pagination and search
// @route   GET /api/admin/users?page=1&limit=20&search=query
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name username email profilePic role provider createdAt followers following');

    const total = await User.countDocuments(filter);

    res.json({
      users: users.map((u) => ({
        ...u.toObject(),
        followersCount: u.followers?.length || 0,
        followingCount: u.following?.length || 0,
      })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user and all their content
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete an admin account' });
    }

    // Delete user's stories and their cover images
    const stories = await Story.find({ author: user._id });
    for (const story of stories) {
      if (story.coverImageId) {
        try { await cloudinary.uploader.destroy(story.coverImageId); } catch (e) { /* ignore */ }
      }
    }
    await Story.deleteMany({ author: user._id });

    // Delete user's comments, likes, saved items
    await Comment.deleteMany({ user: user._id });
    await Like.deleteMany({ user: user._id });
    await Saved.deleteMany({ user: user._id });

    // Delete the user's profile pic from cloudinary
    if (user.profilePicId) {
      try { await cloudinary.uploader.destroy(user.profilePicId); } catch (e) { /* ignore */ }
    }

    // Remove user from followers/following lists of other users
    await User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    );
    await User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    );

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User and all associated content deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Story Management ──────────────────────────────────────────
// @desc    Get all stories with pagination, search, and status filter
// @route   GET /api/admin/stories?page=1&limit=20&search=query&status=published
export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const stories = await Story.find(filter)
      .populate('author', 'name username profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title status views likes form language tags createdAt author coverImage');

    const total = await Story.countDocuments(filter);

    res.json({
      stories: stories.map((s) => ({
        ...s.toObject(),
        likesCount: s.likes?.length || 0,
      })),
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin force-delete any story
// @route   DELETE /api/admin/stories/:id
export const adminDeleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.coverImageId) {
      try { await cloudinary.uploader.destroy(story.coverImageId); } catch (e) { /* ignore */ }
    }

    await Comment.deleteMany({ story: story._id });
    await Saved.deleteMany({ story: story._id });
    await Like.deleteMany({ story: story._id });
    await Story.findByIdAndDelete(story._id);

    res.json({ message: 'Story deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
