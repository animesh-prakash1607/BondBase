const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authenticateToken = require("./middleware/authenticateToken");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',             // local dev
  'https://bondbase.netlify.app'       // Netlify deployment
];

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // your frontend URL
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

// Attach io instance to app
app.set("io", io);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes(io));
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Default Route
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// Protected Route
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted to protected route", user: req.user });
});

// ============================
// Socket.IO Real-time Chat
// ============================
const users = {}; // userId: socketId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user with their socket ID
  socket.on("addUser", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} is online with socket ${socket.id}`);
  });

  // Handle sending a message
  socket.on("sendMessage", ({ sender, receiverId, text, conversationId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        sender,
        text,
        conversationId,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
