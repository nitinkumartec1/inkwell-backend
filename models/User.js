import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'email'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    bio: {
      type: String,
      maxlength: 300,
      default: '',
    },
    profilePic: {
      type: String,
      default: '',
    },
    profilePicId: {
      type: String,
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notifications: [
      {
        type: {
          type: String,
          enum: ['like', 'comment', 'follow', 'share'],
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        story: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Story',
        },
        message: String,
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
