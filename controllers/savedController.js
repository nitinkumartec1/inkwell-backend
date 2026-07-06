import Saved from '../models/Saved.js';

// @desc    Save/Unsave a story
// @route   POST /api/saved/:storyId
export const toggleSave = async (req, res) => {
  try {
    const { folder } = req.body;
    const existing = await Saved.findOne({
      user: req.user._id,
      story: req.params.storyId,
    });

    if (existing) {
      await Saved.findByIdAndDelete(existing._id);
      return res.json({ saved: false, message: 'Story unsaved' });
    }

    await Saved.create({
      user: req.user._id,
      story: req.params.storyId,
      folder: folder || 'All',
    });

    res.status(201).json({ saved: true, message: 'Story saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all saved stories
// @route   GET /api/saved
export const getSavedStories = async (req, res) => {
  try {
    const { folder } = req.query;
    const filter = { user: req.user._id };
    if (folder && folder !== 'All') filter.folder = folder;

    const saved = await Saved.find(filter)
      .populate({
        path: 'story',
        populate: { path: 'author', select: 'name username profilePic' },
      })
      .sort({ createdAt: -1 });

    res.json(saved.filter((s) => s.story));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all folders
// @route   GET /api/saved/folders
export const getFolders = async (req, res) => {
  try {
    const folders = await Saved.distinct('folder', { user: req.user._id });
    const folderCounts = await Promise.all(
      folders.map(async (folder) => {
        const count = await Saved.countDocuments({ user: req.user._id, folder });
        return { name: folder, count };
      })
    );
    res.json(folderCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move saved story to a folder
// @route   PUT /api/saved/:savedId/folder
export const moveToFolder = async (req, res) => {
  try {
    const { folder } = req.body;
    const saved = await Saved.findOneAndUpdate(
      { _id: req.params.savedId, user: req.user._id },
      { folder },
      { new: true }
    );

    if (!saved) return res.status(404).json({ message: 'Saved item not found' });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if story is saved
// @route   GET /api/saved/check/:storyId
export const checkSaved = async (req, res) => {
  try {
    const saved = await Saved.findOne({
      user: req.user._id,
      story: req.params.storyId,
    });
    res.json({ saved: !!saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
