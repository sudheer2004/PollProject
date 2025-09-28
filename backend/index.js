const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pollSocket = require("./sockets/pollSocket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend vite URL
    methods: ["GET", "POST"],
  },
});

// Setup poll socket logic
pollSocket(io);

server.listen(5001, () => {
  console.log("✅ Server running on port 5001");
});
