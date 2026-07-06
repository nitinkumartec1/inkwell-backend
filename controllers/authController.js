import User from '../models/User.js';
import admin from '../config/firebase.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Firebase Auth (Login / Register)
// @route   POST /api/auth/firebase
export const firebaseAuth = async (req, res) => {
  try {
    const { name, email, profilePic, provider, username } = req.body;
    
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken || decodedToken.email !== email) {
      return res.status(401).json({ message: 'Invalid token or email mismatch' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      let baseUsername = (username || name || email.split('@')[0]).replace(/[^a-z0-9_]/gi, '').toLowerCase();
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }
      
      user = await User.create({
        name: name || email.split('@')[0],
        username: uniqueUsername,
        email,
        profilePic: profilePic || '',
        provider: provider || 'email'
      });
    } else {
       if (!user.profilePic && profilePic) {
         user.profilePic = profilePic;
         await user.save();
       }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name username profilePic')
      .populate('following', 'name username profilePic');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, username } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      if (user.profilePicId) {
        await cloudinary.uploader.destroy(user.profilePicId);
      }
      user.profilePic = req.file.path;
      user.profilePicId = req.file.filename;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by username
// @route   GET /api/auth/user/:username
export const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'name username profilePic')
      .populate('following', 'name username profilePic');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow / Unfollow user
// @route   PUT /api/auth/follow/:id
export const toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== req.params.id
      );
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);

      userToFollow.notifications.push({
        type: 'follow',
        from: req.user._id,
        message: `${req.user.name} started following you`,
      });
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({
      following: !isFollowing,
      followersCount: userToFollow.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notifications
// @route   GET /api/auth/notifications
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('notifications.from', 'name username profilePic')
      .populate('notifications.story', 'title');

    const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/auth/notifications/read
export const markNotificationsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].read': true },
    });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/auth/search?q=query
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name username profilePic bio')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
