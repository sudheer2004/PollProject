const express = require("express");
const router = express.Router();
const PollController = require("../controllers/pollController");

// Get poll by ID
router.get("/:pollId", async (req, res) => {
  const poll = await PollController.getPoll(req.params.pollId);
  res.json(poll);
});

// Get all polls (past polls)
router.get("/", async (req, res) => {
  const polls = await PollController.getAllPolls();
  res.json(polls);
});

module.exports = router;
