const express = require('express');
const router = express.Router();
const User = require('../models/User'); // adjust the path if needed
const authMiddleware = require('../middleware/authenticateToken'); // optional auth middleware
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

// Setup Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profilePhotos",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage });

router.get('/allUsers', async (req, res) => {
  try {
    const users = await User.find().select('firstName lastName email title bio profilePhoto followers following');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET profile by user ID
router.post('/id', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ message: 'User ID is required' });

    // Only select firstName, lastName, and email
    const user = await User.findById(id).select('firstName lastName email title followers following profilePhoto privacy bio phoneNumber posts');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/follow/:userId', async (req, res) => {

  const { userId } = req.params; // the user to follow/unfollow
  const { currentUserId } = req.body; // the current user

  if (userId === currentUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.followers.includes(currentUserId)) {
      // Unfollow
      targetUser.followers.pull(currentUserId);
      currentUser.following.pull(userId);
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(userId);
    }

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({
      message: targetUser.followers.includes(currentUserId)
        ? 'Followed successfully'
        : 'Unfollowed successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👥 Get followers of a user
router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('followers', 'firstName lastName profilePhoto');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user.followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👤 Get following of a user
router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('following', 'firstName lastName profilePhoto');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user.following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Express route example
router.put('/privacy', async (req, res) => {
  const { userId, isPrivate } = req.body;
  try {
const user = await User.findByIdAndUpdate(userId, { privacy: isPrivate }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update privacy' });
  }
});

router.patch('/updateProfile/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { id } = req.params;

    // Allowed fields to update
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'bio', 'privacy', 'title'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // If profile photo uploaded, set Cloudinary URL
    if (req.file && req.file.path) {
      updates.profilePhoto = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
