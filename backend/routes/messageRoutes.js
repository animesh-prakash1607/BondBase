// routes/messages.js
const express = require("express");
const Message = require("../models/Message.js");   

const router = express.Router();

// ➤ Send a message
router.post("/", async (req, res) => {
  console.log("Request body:", req.body);  // <-- ADD THIS LINE

  const { sender, text, conversationId } = req.body;

  try {
    const message = new Message({
      sender,
      text,
      conversationId,
    });

    const savedMessage = await message.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Message send failed:", err);
    res.status(500).json(err);
  }
});


// ➤ Get messages of a conversation
router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;