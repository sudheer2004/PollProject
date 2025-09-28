const PollController = require("../controllers/pollController");

function setupPollSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("askQuestion", (pollData) => {
      PollController.askQuestion(pollData, io);
    });

    socket.on("submitAnswer", (payload) => {
      PollController.submitAnswer(payload, io);
    });

    socket.on("getHistory", () => {
      socket.emit("pollHistory", PollController.getHistory());
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = setupPollSocket;
