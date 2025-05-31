const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    title: {
      type: String,
      default : "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
      match: /^\d{10,15}$/,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
     privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    notifications: [
      {
        message: { type: String },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;