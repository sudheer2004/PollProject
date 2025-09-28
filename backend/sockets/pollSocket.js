// sockets/pollSocket.js
const PollController = require("../controllers/pollController");

function setupPollSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    console.log("hello estavlished")
    // Send current poll state to newly connected user
    const currentPoll = PollController.getCurrentPoll();
    if (currentPoll && currentPoll.isActive) {
      const { id, question, options, timeLimit } = currentPoll;
      console.log(id, question, options, timeLimit);
      socket.emit("questionStarted", {
        id: currentPoll.id,
        question: currentPoll.question,
        options: currentPoll.options,
        timeLimit: currentPoll.timeLimit,
      });

      // Send current results if any
      const totalAnswers = Object.values(currentPoll.results).reduce(
        (sum, count) => sum + count,
        0
      );
      if (totalAnswers > 0) {
        socket.emit("updateResults", {
          pollId: currentPoll.id,
          question: currentPoll.question,
          results: currentPoll.results,
        });
      }
    }

    // Student joins the poll
    socket.on("joinPoll", ({ studentName }) => {
      console.log(`👋 Student joining: ${studentName}`);

      if (!studentName || studentName.trim() === "") {
        socket.emit("error", { message: "Student name is required" });
        return;
      }

      // Store student name with socket
      socket.studentName = studentName.trim();

      // Add student to controller
      PollController.addStudent(socket.studentName, socket.id, io);

      // Confirm join
      socket.emit("joinConfirmed", {
        studentName: socket.studentName,
        students: PollController.getConnectedStudents(),
      });
    });

    // Teacher creates new question
    socket.on("newQuestion", (pollData) => {
      console.log("📝 New question from teacher:", pollData);

      // Validate poll data
      if (
        !pollData.question ||
        !pollData.options ||
        pollData.options.length < 2
      ) {
        socket.emit("error", { message: "Invalid poll data" });
        return;
      }

      // Create new poll
      try {
        const poll = PollController.createPoll(pollData, io);

        // Confirm to teacher
        socket.emit("questionCreated", {
          success: true,
          poll: {
            id: poll.id,
            question: poll.question,
            options: poll.options,
            timeLimit: poll.timeLimit,
          },
        });

        console.log("✅ Question broadcasted to all clients");
      } catch (error) {
        console.error("❌ Error creating poll:", error);
        socket.emit("error", { message: "Failed to create poll" });
      }
    });

    // Student submits answer
    socket.on("submitAnswer", ({ studentName, answer }) => {
      console.log(`📝 Answer submission: ${studentName} -> ${answer}`);

      // Validate
      if (!studentName || !answer) {
        socket.emit("error", {
          message: "Student name and answer are required",
        });
        return;
      }

      // Ensure the student name matches the socket
      if (socket.studentName && socket.studentName !== studentName) {
        socket.emit("error", { message: "Student name mismatch" });
        return;
      }

      // Submit answer
      const result = PollController.submitAnswer(
        { studentName, answer },
        socket.id,
        io
      );

      if (!result.success) {
        socket.emit("error", { message: result.message });
      }
    });

    // Teacher ends current question manually
    socket.on("endQuestion", () => {
      console.log("🛑 Teacher ending question manually");

      const endedPoll = PollController.endPoll(io, false);

      if (endedPoll) {
        socket.emit("questionEndConfirmed", {
          success: true,
          pollId: endedPoll.id,
        });
      } else {
        socket.emit("error", { message: "No active poll to end" });
      }
    });

    // Get poll history
    socket.on("getHistory", () => {
      const history = PollController.getHistory();
      socket.emit("pollHistory", history);
    });

    // Get current poll stats
    socket.on("getPollStats", () => {
      const stats = PollController.getPollStats();
      socket.emit("pollStats", stats);
    });

    // Get connected students
    socket.on("getStudents", () => {
      const students = PollController.getConnectedStudents();
      socket.emit("studentsList", students);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`🔌 User disconnected: ${socket.id} (${reason})`);

      // If it was a student, remove them
      if (socket.studentName) {
        console.log(`👋 Student ${socket.studentName} disconnected`);
        PollController.removeStudent(socket.id, io);
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    // Handle custom error events
    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });
  });

  // Handle server-level errors
  io.engine.on("connection_error", (err) => {
    console.error("❌ Server connection error:", err);
  });

  console.log("✅ Poll socket handlers setup complete");
}

module.exports = setupPollSocket;
