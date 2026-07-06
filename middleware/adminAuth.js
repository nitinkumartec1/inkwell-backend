import admin from '../config/firebase.js';
import User from '../models/User.js';

/**
 * Admin authentication middleware.
 * Verifies a Firebase ID token from the Authorization header and checks that the
 * associated user has role === 'admin'.
 */
export const adminProtect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
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

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      next();
    } catch (firebaseError) {
      return res.status(401).json({ message: 'Not authorized, invalid Firebase token', error: firebaseError.message });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error in admin auth' });
  }
};
