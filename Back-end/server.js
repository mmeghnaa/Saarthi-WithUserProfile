require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rideRoutes = require("./Routes/rideRoutes");
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const studentRoutes = require("./Routes/studentRoutes");


const app = express();
const http = require("http");
const { Server } = require("socket.io");
// Default to 3000 (project convention). You can still force a port by setting PORT in your environment.
const PORT = process.env.PORT || 3000;

// Configure CORS. When using credentialed requests (withCredentials:true)
// you must NOT use origin: "*". Instead set the specific frontend origin
// and allow credentials. Frontend origin can be provided via env var.
// Vite dev server uses port 5173 by default; include common dev ports.
const DEFAULT_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGINS[0];

// Early request logger (runs before CORS) to capture preflight/Origin info
app.use((req, res, next) => {
  console.log(
    "EARLY REQUEST:",
    req.method,
    req.url,
    "Origin=",
    req.headers.origin || "<none>"
  );
  next();
});

app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // allow if unspecified (e.g., server-to-server) or matches one of allowed dev origins
      if (
        !incomingOrigin ||
        DEFAULT_FRONTEND_ORIGINS.indexOf(incomingOrigin) !== -1 ||
        incomingOrigin === FRONTEND_ORIGIN
      ) {
        return callback(null, true);
      }
      // otherwise reject
      return callback(new Error("CORS: origin not allowed"), false);
    },
    credentials: true,
    // include PATCH so preflight allows PATCH requests from the frontend
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json());

// Health check endpoint to verify server is up and reachable from the frontend/dev machine
app.get("/api/ping", (req, res) => {
  return res.json({ success: true, message: "pong" });
});

// Debug: return decoded token payload (for developer use only)
app.get("/api/debug/token", (req, res) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Missing Authorization header" });
  const token = auth.split(" ")[1];
  try {
    const jwt = require("jsonwebtoken");
    const payload = jwt.decode(token);
    return res.json({ success: true, payload });
  } catch (e) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Request Headers:", req.headers);
  next();
});

// Use ride and auth routes under /api
app.use("/api", rideRoutes);
app.use("/api", authRoutes);
// Mount user-related routes under /api/user so frontend requests to /api/user/me work
app.use("/api/user", userRoutes);

app.use("/api/student", studentRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Create an HTTP server and attach Socket.IO for real-time chat
const server = http.createServer(app);

// Allow socket.io connections from any of the allowed frontend origins.
// socket.io accepts an array for `origin` and will echo back the
// requesting origin when it matches one of the entries.
const io = new Server(server, {
  cors: {
    origin: DEFAULT_FRONTEND_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Lightweight socket registry for route handlers to access io
const socketUtil = require("./utils/socket");
socketUtil.setIO(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // a client may join a chat room
  socket.on("join", (room) => {
    try {
      socket.join(room);
      console.log("Socket", socket.id, "joined", room);
    } catch (e) {}
  });

  // join a user-specific room for notifications (userId expected)
  socket.on("joinUser", (userId) => {
    try {
      socket.join("user:" + userId);
      console.log("Socket", socket.id, "joined user room", "user:" + userId);
    } catch (e) {}
  });

  // handle outbound chat messages forwarded by clients
  socket.on("message", (payload) => {
    try {
      if (payload && payload.chatId) {
        io.to(payload.chatId).emit("message", payload);
      }
    } catch (e) {
      console.error("Error emitting message via socket:", e);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
// If the configured port (default 3000) is already in use, exit with an error
// so the developer can explicitly free the port or run on a different one.
const startServer = (port) => {
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Please free the port or set PORT env var to a different value.`);
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Allowed frontend origin: ${FRONTEND_ORIGIN}`);
  });
};

startServer(PORT);
