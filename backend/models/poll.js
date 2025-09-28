const mongoose = require("mongoose");

const ResponseSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  answer: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: String,
  results: { type: Object, default: {} }, // Changed from Map to Object for better JSON serialization
  responses: [ResponseSchema],
  timeLimit: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: Date,
  autoEnded: { type: Boolean, default: false },
  totalStudents: { type: Number, default: 0 },
  totalResponses: { type: Number, default: 0 }
});

// Ensure results is always an object
PollSchema.pre('save', function() {
  if (!this.results || typeof this.results !== 'object') {
    this.results = {};
  }
});

module.exports = mongoose.model("Poll", PollSchema);