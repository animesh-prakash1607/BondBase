const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String // Each will store a Cloudinary image URL
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
comments: [{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    text: String,
    name:{
      firstName: String,
      lastName: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Post", postSchema);
