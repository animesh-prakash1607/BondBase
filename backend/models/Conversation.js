// models/Conversation.js
const mongoose = require('mongoose');
const ConversationSchema = new mongoose.Schema(
  {
    members: {
      type: [String], // contains user IDs
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Conversation', ConversationSchema);