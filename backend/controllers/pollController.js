// In-memory store
let currentPoll = null;
let pollHistory = [];
let pollTimer = null;
let pollCounter = 1;

const PollController = {
  askQuestion: (pollData, io) => {
    if (pollTimer) clearTimeout(pollTimer);

    currentPoll = {
      id: pollCounter,
      question: pollData.question,
      options: pollData.options,
      timeLimit: pollData.timeLimit || 60,
      results: {}, // { option: count }
      createdAt: new Date(),
    };

    // Send to all clients
    io.emit("newQuestion", currentPoll);

    // Auto end after timer
    pollTimer = setTimeout(() => {
      if (currentPoll) {
        pollHistory.unshift(currentPoll);
        io.emit("pollEnded", currentPoll);
        currentPoll = null;
        pollCounter++;
      }
    }, currentPoll.timeLimit * 1000);

    return currentPoll;
  },

  submitAnswer: ({ studentName, answer }, io) => {
    if (!currentPoll) return null;

    if (!currentPoll.results[answer]) {
      currentPoll.results[answer] = 0;
    }
    currentPoll.results[answer] += 1;

    io.emit("pollResults", {
      pollId: currentPoll.id,
      results: currentPoll.results,
    });

    return currentPoll;
  },

  getHistory: () => {
    return pollHistory;
  },
};

module.exports = PollController;
