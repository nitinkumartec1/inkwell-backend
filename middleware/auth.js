import admin from '../config/firebase.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.user = await User.findOne({ email: decodedUser.email }).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in local database' });
      }
      next();
    } catch (firebaseError) {
      return res.status(401).json({ message: 'Not authorized, invalid Firebase token', error: firebaseError.message });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.user = await User.findOne({ email: decodedUser.email }).select('-password');
    }
  } catch (error) {
    req.user = null;
  }
  next();
};
