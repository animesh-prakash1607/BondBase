// postRoutes.js
const express = require('express');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const User = require('../models/User');

const createPostRouter = (io) => {
  const router = express.Router();

  // Cloudinary config
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'BondBase_Posts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1080, height: 1080, crop: 'limit' }]
    },
  });

  const upload = multer({ storage });

  router.post('/create', upload.array('images', 5), async (req, res) => {
    try {
      const { userId, description } = req.body;
      const imageUrls = req.files.map(file => file.path);

      const newPost = new Post({ userId, description, images: imageUrls });
      const savedPost = await newPost.save();

      io.emit('newPost', savedPost); // 🔴 Emit real-time event
      res.status(201).json(savedPost);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/allPosts', async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('userId', 'firstName lastName profilePhoto privacy followers following title bio')
              .populate('comments.userId', 'firstName lastName')   // <--- add this line
        .sort({ createdAt: -1 });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

 router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .populate('comments.userId', 'firstName lastName')   // <--- add here too if needed
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/like/:postId', async (req, res) => {
  const { userId } = req.body;

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    // Re-fetch post with populated user info for comments and replies
    const updatedPost = await Post.findById(post._id)
      .populate('userId', 'firstName lastName profilePhoto')
      .populate({
        path: 'comments.userId',
        select: 'firstName lastName profilePhoto',
      })
      .populate({
        path: 'comments.replies.userId',
        select: 'firstName lastName profilePhoto',
      });

    io.emit('postLiked', { postId: updatedPost._id, likes: updatedPost.likes });

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


 router.post('/comment/:postId', async (req, res) => {
  const { userId, text } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, text });
    await post.save();

    // ✅ Re-fetch the post with populated comments.userId
    const updatedPost = await Post.findById(req.params.postId)
      .populate('comments.userId', 'firstName lastName profilePhoto');

    io.emit('postCommented', {
      postId: updatedPost._id,
      comments: updatedPost.comments, // Now includes full user details
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reply/:postId/:commentId
router.post('/reply/:postId/:commentId', async (req, res) => {  
  const { userId, text } = req.body;

  try {
    // Find the post
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Find the comment inside the post
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Get user details
    const user = await User.findById(userId).select('firstName lastName');
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create the reply object
    const newReply = {
      userId,
      text,
      name: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      createdAt: new Date()
    };

    // Add reply to the comment
    comment.replies.push(newReply);

    // Save post
    await post.save();

    // Emit the updated replies via socket
    io.emit('commentReplied', {
      postId: post._id,
      commentId: comment._id,
      replies: comment.replies
    });

    // Send response
    res.status(200).json({
      postId: post._id,
      commentId: comment._id,
      replies: comment.replies
    });

  } catch (err) {
    console.error('Error replying to comment:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete/:postId/:userId', async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    await Post.findByIdAndDelete(postId);
    io.emit('postDeleted', { postId });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete/comment/:postId/:commentId/:userId', async (req, res) => {
  const { postId, commentId, userId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Authorization check
    if (comment.userId.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    // Remove comment using pull by _id
    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
    
    await post.save();
    await post.populate('comments.userId', 'firstName lastName profilePhoto');
    io.emit('commentDeleted', { postId, commentId });    

    res.status(200).json({ message: "Comment deleted successfully", comments: post.comments });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
});



router.delete('/delete/reply/:postId/:commentId/:replyId/:userId', async (req, res) => {
  const { postId, commentId, replyId, userId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const replyIndex = comment.replies.findIndex(
      (r) => r._id.toString() === replyId && r.userId.toString() === userId
    );

    if (replyIndex === -1)
      return res.status(403).json({ message: "Unauthorized or reply not found" });

    comment.replies.splice(replyIndex, 1);
    await post.save();

    // ✅ Repopulate user info inside replies if needed
    await post.populate('comments.userId', 'firstName lastName profileUrl');
    await post.populate('comments.replies.userId', 'firstName lastName profileUrl');

    const updatedComment = post.comments.id(commentId);

    io.emit('replyDeleted', { postId, commentId, replyId });

    res.status(200).json({
      message: "Reply deleted successfully",
      comment: updatedComment // return full comment with updated replies
    });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ error: err.message });
  }
});


  return router;
};

module.exports = createPostRouter;
