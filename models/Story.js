import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    coverImageId: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'unlisted', 'submission'],
      default: 'draft',
    },
    form: {
      type: String,
      enum: ['shayari', 'ghazal', 'nazm', 'poetry', 'short_story'],
      default: 'poetry',
      required: true,
    },
    language: {
      type: String,
      enum: ['hindi', 'urdu', 'english'],
      default: 'english',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    scheduledAt: {
      type: Date,
    },
    readTime: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

storySchema.index({ title: 'text', content: 'text', tags: 'text' }, { language_override: 'disable_language_override' });
storySchema.index({ author: 1, status: 1 });
storySchema.index({ createdAt: -1 });

export default mongoose.model('Story', storySchema);
