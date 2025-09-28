const mongoose = require("mongoose");

const PollSchema = new mongoose.Schema({
  question: String,
  options: [String],
  results: { type: Map, of: Number, default: {} },
  responses: [{ studentName: String, answer: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }   // 👈 NEW: when poll ends
});

module.exports = mongoose.model("Poll", PollSchema);