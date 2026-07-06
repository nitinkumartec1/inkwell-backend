import mongoose from 'mongoose';

const savedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    folder: {
      type: String,
      default: 'All',
      trim: true,
    },
  },
  { timestamps: true }
);

savedSchema.index({ user: 1, story: 1 }, { unique: true });
savedSchema.index({ user: 1, folder: 1 });

export default mongoose.model('Saved', savedSchema);
