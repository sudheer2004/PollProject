// controllers/pollController.js
// In-memory store
let currentPoll = null;
let pollHistory = [];
let pollTimer = null;
let pollCounter = 1;
let connectedStudents = new Map(); // studentName -> socketId
let studentAnswers = new Map(); // socketId -> answer

const PollController = {
  // Create and start a new poll
  createPoll: (pollData, io) => {
    // Clear any existing timer
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }

    // Clear previous student answers
    studentAnswers.clear();

    // Initialize results object with all options set to 0
    const results = {};
    pollData.options.forEach((option) => {
      results[option] = 0;
    });

    currentPoll = {
      id: pollCounter,
      question: pollData.question,
      options: pollData.options,
      timeLimit: pollData.timeLimit || 60,
      results: results,
      correctAnswer: pollData.correctAnswer || null,
      createdAt: new Date(),
      isActive: true,
    };

    console.log("🚀 New poll created:", currentPoll);

    // Broadcast to all clients that question has started
    io.emit("questionStarted", {
      id: currentPoll.id,
      question: currentPoll.question,
      options: currentPoll.options,
      timeLimit: currentPoll.timeLimit,
    });

    // Set auto-end timer
    pollTimer = setTimeout(() => {
      PollController.endPoll(io, true); // true = auto-ended
    }, currentPoll.timeLimit * 1000);

    return currentPoll;
  },

  // Submit student answer
  submitAnswer: ({ studentName, answer }, socketId, io) => {
    if (!currentPoll || !currentPoll.isActive) {
      console.log("❌ No active poll for answer submission");
      return { success: false, message: "No active poll" };
    }

    // Check if this socket has already answered
    if (studentAnswers.has(socketId)) {
      console.log("❌ Student already answered:", studentName);
      return { success: false, message: "Already answered" };
    }

    // Check if answer is valid
    if (!currentPoll.options.includes(answer)) {
      console.log("❌ Invalid answer:", answer);
      return { success: false, message: "Invalid answer" };
    }

    // Record the answer
    studentAnswers.set(socketId, answer);

    // Update results
    currentPoll.results[answer] = (currentPoll.results[answer] || 0) + 1;

    console.log(`✅ Answer submitted: ${studentName} -> ${answer}`);
    console.log("📊 Current results:", currentPoll.results);

    // Notify the student that answer was received
    io.to(socketId).emit("answerSubmitted");

    // Broadcast updated results to all clients
    io.emit("updateResults", {
      pollId: currentPoll.id,
      question: currentPoll.question,
      results: currentPoll.results,
    });

    // Check if all students have answered
    const totalAnswers = Object.values(currentPoll.results).reduce(
      (sum, count) => sum + count,
      0
    );
    const connectedCount = connectedStudents.size;

    if (connectedCount > 0 && totalAnswers >= connectedCount) {
      console.log("🎯 All students answered, ending poll");
      setTimeout(() => PollController.endPoll(io, false), 1000); // Small delay for UI
    }

    return { success: true, poll: currentPoll };
  },

  // End current poll
  endPoll: (io, autoEnded = false) => {
    if (!currentPoll) {
      console.log("❌ No active poll to end");
      return null;
    }

    // Clear timer if it exists
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }

    // Mark poll as ended
    currentPoll.isActive = false;
    currentPoll.endedAt = new Date();
    currentPoll.autoEnded = autoEnded;

    console.log(
      `🏁 Poll ended (${autoEnded ? "auto" : "manual"}):`,
      currentPoll.id
    );

    // Add to history
    pollHistory.unshift({ ...currentPoll });

    // Broadcast final results
    io.emit("questionEnded", {
      pollId: currentPoll.id,
      question: currentPoll.question,
      results: currentPoll.results,
      correctAnswer: currentPoll.correctAnswer,
      autoEnded: autoEnded,
    });

    const endedPoll = currentPoll;
    currentPoll = null;
    pollCounter++;

    // Clear student answers for next poll
    studentAnswers.clear();

    return endedPoll;
  },

  // Student management
  addStudent: (studentName, socketId, io) => {
    // Remove student if they were connected before (reconnection)
    PollController.removeStudentByName(studentName, io);

    connectedStudents.set(studentName, socketId);
    console.log(`👋 Student joined: ${studentName} (${socketId})`);

    // Broadcast updated student list
    io.emit("studentJoined", {
      studentName,
      totalStudents: connectedStudents.size,
      students: Array.from(connectedStudents.keys()),
    });

    // If there's an active poll, send it to the new student
    if (currentPoll && currentPoll.isActive) {
      io.to(socketId).emit("questionStarted", {
        id: currentPoll.id,
        question: currentPoll.question,
        options: currentPoll.options,
        timeLimit: currentPoll.timeLimit,
      });

      // Send current results if available
      const totalAnswers = Object.values(currentPoll.results).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalAnswers > 0) {
        io.to(socketId).emit("updateResults", {
          pollId: currentPoll.id,
          question: currentPoll.question,
          results: currentPoll.results,
        });
      }
    }

    return Array.from(connectedStudents.keys());
  },

  removeStudent: (socketId, io) => {
    let studentName = null;

    // Find student by socketId
    for (let [name, id] of connectedStudents.entries()) {
      if (id === socketId) {
        studentName = name;
        connectedStudents.delete(name);
        break;
      }
    }

    // Remove their answer if they had one
    studentAnswers.delete(socketId);

    if (studentName) {
      console.log(`👋 Student left: ${studentName} (${socketId})`);

      // Broadcast updated student list
      io.emit("studentLeft", {
        studentName,
        totalStudents: connectedStudents.size,
        students: Array.from(connectedStudents.keys()),
      });

      // If there's an active poll, recalculate results
      if (currentPoll && currentPoll.isActive) {
        // Recalculate results based on remaining answers
        const newResults = {};
        currentPoll.options.forEach((option) => {
          newResults[option] = 0;
        });

        // Count answers from remaining connected students
        for (let [sid, answer] of studentAnswers.entries()) {
          if (Array.from(connectedStudents.values()).includes(sid)) {
            newResults[answer] = (newResults[answer] || 0) + 1;
          }
        }

        currentPoll.results = newResults;

        // Broadcast updated results
        io.emit("updateResults", {
          pollId: currentPoll.id,
          question: currentPoll.question,
          results: currentPoll.results,
        });
      }
    }

    return Array.from(connectedStudents.keys());
  },

  removeStudentByName: (studentName, io) => {
    const socketId = connectedStudents.get(studentName);
    if (socketId) {
      return PollController.removeStudent(socketId, io);
    }
    return Array.from(connectedStudents.keys());
  },

  // Get current poll state
  getCurrentPoll: () => {
    return currentPoll;
  },

  // Get poll history
  getHistory: () => {
    return pollHistory;
  },

  // Get connected students
  getConnectedStudents: () => {
    return Array.from(connectedStudents.keys());
  },

  // Get current poll stats
  getPollStats: () => {
    if (!currentPoll) return null;

    const totalAnswers = Object.values(currentPoll.results).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalStudents = connectedStudents.size;

    return {
      pollId: currentPoll.id,
      question: currentPoll.question,
      totalStudents: totalStudents,
      answeredStudents: totalAnswers,
      remainingTime: pollTimer
        ? Math.max(
            0,
            currentPoll.timeLimit * 1000 -
              (Date.now() - currentPoll.createdAt.getTime())
          ) / 1000
        : 0,
      isActive: currentPoll.isActive,
    };
  },
};

module.exports = PollController;
