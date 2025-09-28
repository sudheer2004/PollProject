const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Poll = require("./models/poll");

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

// ====== Connect to MongoDB ======
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/polling_system", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log("Connected to MongoDB", "SUCCESS");
  } catch (error) {
    log(`MongoDB connection error: ${error.message}`, "ERROR");
    log("Continuing in development mode without persistent storage", "WARNING");
  }
};

// ====== Middleware ======
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
  methods: ["GET", "POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Routes ======
app.get("/", (req, res) => res.json({ message: "Polling API Running" }));
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    connections: io.engine.clientsCount,
    activePoll: currentPoll ? currentPoll.id : null,
    connectedStudents: connectedStudents.size,
    dbConnection: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/api/polls/history", async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: false })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(polls);
  } catch (error) {
    log(`Error fetching poll history: ${error.message}`, "ERROR");
    res.status(500).json({ error: error.message });
  }
});

// ====== Socket.IO setup ======
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
});

// ====== In-memory data ======
let currentPoll = null;
let connectedStudents = new Map(); // studentName -> { socketId, joinedAt }
let studentAnswers = new Map(); // socketId -> { studentName, answer, timestamp }
let pollTimer = null;
let pollStartTime = null;

// ====== Helper Functions ======
const savePollToDB = async (poll) => {
  if (!mongoose.connection.readyState) return null;
  
  try {
    // Convert responses from Map to Array
    const responses = Array.from(studentAnswers.entries()).map(([socketId, data]) => ({
      studentName: data.studentName,
      answer: data.answer,
      timestamp: data.timestamp
    }));

    const pollDoc = new Poll({
      question: poll.question,
      options: poll.options,
      correctAnswer: poll.correctAnswer,
      results: poll.results, // Keep as plain object, not Map
      responses: responses,
      timeLimit: poll.timeLimit,
      isActive: poll.isActive,
      createdAt: poll.createdAt,
      endedAt: poll.endedAt,
      autoEnded: poll.autoEnded,
      totalStudents: connectedStudents.size,
      totalResponses: responses.length
    });
    
    const saved = await pollDoc.save();
    log(`Poll saved to database: ${poll.id}`, "SUCCESS");
    return saved;
  } catch (error) {
    log(`Error saving poll to database: ${error.message}`, "ERROR");
    return null;
  }
};

const getStudentNameBySocket = (socketId) => {
  for (let [name, data] of connectedStudents.entries()) {
    if (data.socketId === socketId) return name;
  }
  return "Unknown";
};

const calculateTimeRemaining = () => {
  if (!currentPoll || !pollStartTime) return 0;
  const elapsed = Math.floor((Date.now() - pollStartTime) / 1000);
  return Math.max(0, currentPoll.timeLimit - elapsed);
};

const broadcastTimeUpdate = () => {
  if (!currentPoll || !currentPoll.isActive) return;
  const timeLeft = calculateTimeRemaining();
  
  if (timeLeft <= 0) {
    endCurrentPoll(true);
    return;
  }
  
  io.emit("timeUpdate", { timeLeft });
};

const endCurrentPoll = async (autoEnded = false) => {
  if (!currentPoll) return;
  
  log(`Ending poll: ${currentPoll.question} (${autoEnded ? 'auto' : 'manual'})`, "INFO");
  
  // Clear timer
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  
  currentPoll.isActive = false;
  currentPoll.endedAt = new Date();
  currentPoll.autoEnded = autoEnded;
  
  // Save to database
  const savedPoll = await savePollToDB(currentPoll);
  
  const totalResponses = Array.from(studentAnswers.values()).length;
  
  // Notify all clients
  io.emit("pollEnded", {
    pollId: currentPoll.id,
    question: currentPoll.question,
    results: currentPoll.results,
    correctAnswer: currentPoll.correctAnswer,
    totalResponses: totalResponses,
    totalStudents: connectedStudents.size,
    autoEnded: autoEnded,
    savedId: savedPoll ? savedPoll._id : null
  });
  
  log(`Poll ended: ${currentPoll.question} (${autoEnded ? 'auto' : 'manual'}) - ${totalResponses}/${connectedStudents.size} responses`, "SUCCESS");
  
  currentPoll = null;
  pollStartTime = null;
  studentAnswers.clear();
};

// ====== Socket Events ======
io.on("connection", (socket) => {
  log(`New connection: ${socket.id}`, "SUCCESS");

  // Send current state to new connection
  socket.emit("connectionStatus", {
    connected: true,
    totalStudents: connectedStudents.size,
    serverId: socket.id
  });

  // If there's an active poll, send it to the new connection
  if (currentPoll && currentPoll.isActive) {
    const timeLeft = calculateTimeRemaining();
    
    socket.emit("questionStarted", {
      id: currentPoll.id,
      question: currentPoll.question,
      options: currentPoll.options,
      timeLimit: timeLeft, // Send remaining time, not original time limit
      correctAnswer: currentPoll.correctAnswer
    });
    
    // Send current results
    socket.emit("pollResults", currentPoll.results);
  }

  // --- Student joins ---
  socket.on("joinPoll", ({ studentName }) => {
    try {
      if (!studentName || studentName.trim() === "") {
        socket.emit("error", { message: "Student name is required" });
        return;
      }
      
      const name = studentName.trim();
      
      // Check for duplicate names and handle reconnection
      const existingStudent = connectedStudents.get(name);
      if (existingStudent && existingStudent.socketId !== socket.id) {
        // Disconnect the old socket if it exists
        const oldSocket = io.sockets.sockets.get(existingStudent.socketId);
        if (oldSocket) {
          oldSocket.disconnect();
        }
      }
      
      socket.studentName = name;
      connectedStudents.set(name, { 
        socketId: socket.id, 
        joinedAt: new Date() 
      });

      socket.emit("joinConfirmed", { studentName: name });
      
      // Broadcast student update
      io.emit("studentUpdate", { 
        totalStudents: connectedStudents.size,
        students: Array.from(connectedStudents.keys())
      });
      
      log(`Student joined: ${name} (Total: ${connectedStudents.size})`, "INFO");
      
      // If there's an active poll, send current state
      if (currentPoll && currentPoll.isActive) {
        const timeLeft = calculateTimeRemaining();
        socket.emit("questionStarted", {
          id: currentPoll.id,
          question: currentPoll.question,
          options: currentPoll.options,
          timeLimit: timeLeft,
          correctAnswer: currentPoll.correctAnswer
        });
        socket.emit("pollResults", currentPoll.results);
      }
    } catch (error) {
      log(`Error in joinPoll: ${error.message}`, "ERROR");
      socket.emit("error", { message: "Failed to join poll" });
    }
  });

  // --- Teacher creates poll ---
  socket.on("questionStarted", async (pollData) => {
    try {
      if (!pollData.question || !pollData.options || pollData.options.length < 2) {
        socket.emit("error", { message: "Invalid poll data: question and at least 2 options required" });
        return;
      }

      // Validate options
      const validOptions = pollData.options.filter(opt => opt && opt.trim() !== "");
      if (validOptions.length < 2) {
        socket.emit("error", { message: "At least 2 valid options are required" });
        return;
      }

      // End previous poll if exists
      if (currentPoll && currentPoll.isActive) {
        await endCurrentPoll(false);
      }
      
      // Clear previous data
      studentAnswers.clear();

      // Initialize results for all options
      const results = {};
      validOptions.forEach((opt) => (results[opt] = 0));

      currentPoll = {
        id: Date.now(),
        question: pollData.question.trim(),
        options: validOptions,
        correctAnswer: pollData.correctAnswer,
        timeLimit: Math.max(10, Math.min(300, pollData.timeLimit || 60)), // Clamp between 10s and 5min
        results,
        isActive: true,
        createdAt: new Date()
      };

      pollStartTime = Date.now();

      // Broadcast to all clients
      io.emit("questionStarted", {
        id: currentPoll.id,
        question: currentPoll.question,
        options: currentPoll.options,
        timeLimit: currentPoll.timeLimit,
        correctAnswer: currentPoll.correctAnswer
      });
      
      // Send initial empty results
      io.emit("pollResults", currentPoll.results);

      log(`Poll started: "${currentPoll.question}" (${currentPoll.timeLimit}s, ${validOptions.length} options)`, "SUCCESS");

      // Set auto-end timer
      pollTimer = setTimeout(() => {
        endCurrentPoll(true);
      }, currentPoll.timeLimit * 1000);

      // Send periodic time updates every second
      const timeUpdateInterval = setInterval(() => {
        if (!currentPoll || !currentPoll.isActive) {
          clearInterval(timeUpdateInterval);
          return;
        }
        
        const timeLeft = calculateTimeRemaining();
        if (timeLeft <= 0) {
          clearInterval(timeUpdateInterval);
          endCurrentPoll(true);
          return;
        }
        
        io.emit("timeUpdate", { timeLeft });
      }, 1000);

    } catch (error) {
      log(`Error in questionStarted: ${error.message}`, "ERROR");
      socket.emit("error", { message: "Failed to start poll" });
    }
  });

  // --- Student submits answer ---
  socket.on("submitAnswer", ({ studentName, answer }) => {
    try {
      if (!currentPoll || !currentPoll.isActive) {
        socket.emit("error", { message: "No active poll available" });
        return;
      }

      if (!studentName || studentName.trim() === "") {
        socket.emit("error", { message: "Student name is required" });
        return;
      }
      
      if (!answer || !currentPoll.options.includes(answer)) {
        socket.emit("error", { message: "Invalid answer option" });
        return;
      }
      
      // Check if student already answered
      const existingAnswer = Array.from(studentAnswers.values()).find(
        data => data.studentName === studentName.trim()
      );
      
      if (existingAnswer) {
        socket.emit("error", { message: "You have already submitted an answer" });
        return;
      }

      // Record answer
      const answerData = {
        studentName: studentName.trim(),
        answer: answer,
        timestamp: new Date()
      };
      
      studentAnswers.set(socket.id, answerData);
      
      // Update results
      currentPoll.results[answer] = (currentPoll.results[answer] || 0) + 1;

      // Immediately confirm submission to the student
      socket.emit("answerSubmitted", { 
        answer: answer,
        timestamp: answerData.timestamp 
      });
      
      // Immediately broadcast updated results to ALL clients
      io.emit("pollResults", currentPoll.results);

      const totalResponses = Object.values(currentPoll.results).reduce((sum, count) => sum + count, 0);
      log(`Answer submitted: ${studentName} -> "${answer}" (${totalResponses}/${connectedStudents.size} responses)`, "INFO");

      // Auto-end if all students answered
      if (totalResponses >= connectedStudents.size && connectedStudents.size > 0) {
        log("All students answered, ending poll in 1 second", "INFO");
        setTimeout(() => {
          if (currentPoll && currentPoll.isActive) {
            endCurrentPoll(false);
          }
        }, 1000);
      }
      
    } catch (error) {
      log(`Error in submitAnswer: ${error.message}`, "ERROR");
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });

  // --- Teacher ends poll manually ---
  socket.on("endPoll", () => {
    if (currentPoll && currentPoll.isActive) {
      endCurrentPoll(false);
    } else {
      socket.emit("error", { message: "No active poll to end" });
    }
  });

  // --- Get poll history ---
  socket.on("getPollHistory", async () => {
    try {
      if (!mongoose.connection.readyState) {
        log("Database not connected for poll history request", "WARNING");
        socket.emit("pollHistory", []);
        return;
      }
      
      const polls = await Poll.find({ isActive: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
        
      log(`Found ${polls.length} polls in history`, "INFO");
        
      // Ensure proper format for frontend
      const formattedPolls = polls.map(poll => ({
        _id: poll._id,
        question: poll.question,
        options: poll.options || [],
        correctAnswer: poll.correctAnswer,
        results: poll.results || {},
        responses: poll.responses || [],
        timeLimit: poll.timeLimit || 60,
        createdAt: poll.createdAt,
        endedAt: poll.endedAt,
        totalStudents: poll.totalStudents || 0,
        totalResponses: poll.totalResponses || 0
      }));
        
      socket.emit("pollHistory", formattedPolls);
      log(`Sent poll history: ${formattedPolls.length} polls`, "SUCCESS");
    } catch (error) {
      log(`Error fetching poll history: ${error.message}`, "ERROR");
      socket.emit("pollHistory", []);
    }
  });

  // --- Get current poll status ---
  socket.on("getCurrentPoll", () => {
    if (currentPoll && currentPoll.isActive) {
      const timeLeft = calculateTimeRemaining();
      socket.emit("currentPoll", {
        ...currentPoll,
        timeLeft: timeLeft,
        totalResponses: Array.from(studentAnswers.values()).length
      });
    } else {
      socket.emit("currentPoll", null);
    }
  });

  // --- Disconnect handling ---
  socket.on("disconnect", (reason) => {
    try {
      if (socket.studentName) {
        connectedStudents.delete(socket.studentName);
        io.emit("studentUpdate", { 
          totalStudents: connectedStudents.size,
          students: Array.from(connectedStudents.keys())
        });
        log(`Student disconnected: ${socket.studentName} (${reason})`, "WARNING");
      }
      
      // Remove answer if student disconnected
      if (studentAnswers.has(socket.id)) {
        const answerData = studentAnswers.get(socket.id);
        studentAnswers.delete(socket.id);
        
        // Update results if there was an active poll
        if (currentPoll && currentPoll.isActive && answerData) {
          currentPoll.results[answerData.answer] = Math.max(0, currentPoll.results[answerData.answer] - 1);
          io.emit("pollResults", currentPoll.results);
          log(`Removed answer from disconnected student: ${answerData.studentName}`, "INFO");
        }
      }
      
      log(`Socket disconnected: ${socket.id} (${reason})`, "WARNING");
    } catch (error) {
      log(`Error handling disconnect: ${error.message}`, "ERROR");
    }
  });

  // --- General error handling ---
  socket.on("error", (error) => {
    log(`Socket error from ${socket.id}: ${error.message || error}`, "ERROR");
  });
});

// ====== Graceful shutdown ======
const gracefulShutdown = async (signal) => {
  log(`Received ${signal}, shutting down gracefully...`, "WARNING");
  
  if (currentPoll && currentPoll.isActive) {
    log("Ending active poll before shutdown...", "INFO");
    await endCurrentPoll(false);
  }
  
  server.close(() => {
    log("HTTP server closed", "INFO");
    mongoose.connection.close(false, () => {
      log("MongoDB connection closed", "INFO");
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    log("Forcing exit...", "ERROR");
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ====== Start server ======
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  server.listen(PORT, () => {
    log(`Server running on port ${PORT}`, "SUCCESS");
    log(`CORS origins: ${corsOptions.origin.join(', ')}`, "INFO");
    log(`Socket.IO transports: websocket, polling`, "INFO");
  });
}).catch(error => {
  log(`Failed to start server: ${error.message}`, "ERROR");
  process.exit(1);
});