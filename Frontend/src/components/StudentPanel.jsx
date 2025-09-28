import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

export default function StudentPanel() {
  const [enteredName, setEnteredName] = useState(""); // onboarding input
  const [studentName, setStudentName] = useState(""); // confirmed name
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Join poll once studentName is confirmed
  useEffect(() => {
    if (!studentName) return;

    socket.emit("joinPoll", { studentName });

    socket.on("questionStarted", (poll) => {
      setQuestionData(poll);
      setAnswer("");
      setResults(null);
      setTimeLeft(poll.timeLimit || 60);
    });

    socket.on("updateResults", (pollResults) => setResults(pollResults.results));

    socket.on("questionEnded", (endedPoll) => {
      setResults(endedPoll.results);
      setTimeLeft(0);
      alert("Time's up!");
    });

    return () => {
      socket.off("questionStarted");
      socket.off("updateResults");
      socket.off("questionEnded");
    };
  }, [studentName]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const submitAnswer = () => {
    if (!answer) return alert("Select an option");
    socket.emit("submitAnswer", { studentName, answer });
  };

  // ------------------------
  // ONBOARDING SCREEN
  // ------------------------
  if (!studentName) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header Badge */}
          <div className="flex justify-center">
            <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Interview Poll
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Let's Get Started
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mx-auto max-w-full">
              If you're a student, you'll be able to{" "}
              <span className="font-semibold text-foreground">submit your answers</span>, 
              participate in live polls, and see how your responses compare with your classmates.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-6 pt-4 ml-10">
            <div className="space-y-3 ">
              <label htmlFor="name" className="block text-sm font-medium text-foreground ml-25">
                Enter your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Rahul Bajaj"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                className="w-100 h-12 ml-25"
              />
            </div>

            <Button
              className="ml-54 mt-5 w-40 py-3 h-10 text-base bg-purple-700 hover:bg-purple-700"
              onClick={() => setStudentName(enteredName.trim())}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------
  // STUDENT PANEL
  // ------------------------
  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Student Panel ({studentName})</h2>

      {questionData ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">{questionData.question}</h3>
          <p className="mb-2 text-red-500 font-bold">Time Left: {timeLeft}s</p>
          {questionData.options.map((opt, idx) => (
            <div key={idx} className="mb-1">
              <input
                type="radio"
                name="answer"
                value={opt}
                checked={answer === opt}
                onChange={() => setAnswer(opt)}
                className="mr-2"
              />
              {opt}
            </div>
          ))}
          <button
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={submitAnswer}
            disabled={timeLeft <= 0}
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <p>Waiting for question...</p>
      )}

      {results && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Live Results</h3>
          <ul className="list-disc pl-5">
            {Object.entries(results).map(([opt, count]) => (
              <li key={opt}>
                {opt}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
