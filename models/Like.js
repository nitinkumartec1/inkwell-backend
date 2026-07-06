import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, story: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);
