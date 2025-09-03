const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // For production, replace "*" with your domain
    methods: ["GET", "POST"]
  }
});

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Default route for Render
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Store connected users
let users = {};

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // User joins with username & room
  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    console.log(`👤 ${username} joined room: ${room}`);

    // Notify the user
    socket.emit("message", { user: "System", text: `Welcome ${username} to ${room}` });

    // Notify others in the room
    socket.broadcast.to(room).emit("message", { user: "System", text: `${username} joined the chat` });
  });

  // Chat message
  socket.on("chatMessage", (msg) => {
    const user = users[socket.id];
    if (user) {
      console.log(`💬 ${user.username} (${user.room}): ${msg}`);
      io.to(user.room).emit("message", { user: user.username, text: msg });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      console.log(`❌ ${user.username} left (${user.room})`);
      io.to(user.room).emit("message", { user: "System", text: `${user.username} left the chat` });
      delete users[socket.id];
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
