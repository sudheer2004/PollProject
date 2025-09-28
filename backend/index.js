// index.js - Backend consistent with current PollClient
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// ====== Logging utility ======
const log = (message, type = "INFO") => {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: "\x1b[36m",
    SUCCESS: "\x1b[32m",
    WARNING: "\x1b[33m",
    ERROR: "\x1b[31m",
    RESET: "\x1b[0m",
  };
  console.log(`${colors[type]}[${timestamp}] [${type}] ${message}${colors.RESET}`);
};

// ====== Middleware ======
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Basic routes ======
app.get("/", (req, res) => res.json({ message: "Polling API Running" }));
app.get("/health", (req, res) => res.json({ status: "healthy", connections: io.engine.clientsCount }));

// ====== Socket.IO setup ======
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// ====== In-memory data ======
let currentPoll = null;
let connectedStudents = new Map();
let studentAnswers = new Map();

// ====== Socket events ======
io.on("connection", (socket) => {
  log(`New connection: ${socket.id}`, "SUCCESS");

  // --- Student joins ---
  socket.on("joinPoll", ({ studentName }) => {
    if (!studentName || studentName.trim() === "") {
      socket.emit("error", { message: "Student name required" });
      return;
    }
    const name = studentName.trim();
    socket.studentName = name;
    connectedStudents.set(name, socket.id);

    // Notify all clients
    io.emit("connectedStudents", connectedStudents.size);
    log(`Student joined: ${name} (Total: ${connectedStudents.size})`, "INFO");

    // Send current poll if exists
    if (currentPoll) {
      socket.emit("questionStarted", currentPoll);
      socket.emit("pollResults", currentPoll.results);
    }
  });

  // --- Teacher creates poll ---
  socket.on("questionStarted", (pollData) => {
    if (!pollData.question || !pollData.options || pollData.options.length < 2) {
      socket.emit("error", { message: "Invalid poll data" });
      return;
    }

    // Reset previous poll
    studentAnswers.clear();

    // Initialize results
    const results = {};
    pollData.options.forEach((opt) => (results[opt] = 0));

    currentPoll = {
      ...pollData,
      id: Date.now(),
      results,
      isActive: true,
    };

    io.emit("questionStarted", currentPoll);
    log(`Poll started: ${currentPoll.question}`, "SUCCESS");

    // Auto-end timer
    setTimeout(() => {
      if (currentPoll && currentPoll.id === currentPoll.id) endCurrentPoll(true);
    }, pollData.timeLimit * 1000);
  });

  // --- Student submits answer ---
  socket.on("submitAnswer", ({ answer }) => {
    if (!currentPoll || !currentPoll.isActive) {
      socket.emit("error", { message: "No active poll" });
      return;
    }
    if (!currentPoll.options.includes(answer)) {
      socket.emit("error", { message: "Invalid answer" });
      return;
    }
    if (studentAnswers.has(socket.id)) {
      socket.emit("error", { message: "Already answered" });
      return;
    }

    studentAnswers.set(socket.id, answer);
    currentPoll.results[answer] += 1;

    socket.emit("answerSubmitted");
    io.emit("pollResults", currentPoll.results);

    // Auto-end if all students answered
    if (studentAnswers.size >= connectedStudents.size) {
      setTimeout(() => endCurrentPoll(false), 500);
    }
  });

  // --- Teacher ends poll manually ---
  socket.on("endPoll", () => {
    endCurrentPoll(false);
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    if (socket.studentName) connectedStudents.delete(socket.studentName);
    studentAnswers.delete(socket.id);
    io.emit("connectedStudents", connectedStudents.size);
    log(`Socket disconnected: ${socket.id}`, "WARNING");
  });
});

// ====== Helper function ======
function endCurrentPoll(autoEnded = false) {
  if (!currentPoll) return;
  currentPoll.isActive = false;
  io.emit("pollEnded", currentPoll);
  log(`Poll ended: ${currentPoll.question} (autoEnded: ${autoEnded})`, "SUCCESS");
  currentPoll = null;
  studentAnswers.clear();
}

// ====== Start server ======
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  log(`Server running on port ${PORT}`, "SUCCESS");
});

