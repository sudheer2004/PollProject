import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";

let socket;

// LiveResults Component
const LiveResults = ({ results, question }) => {
  const getTotalResponses = () => {
    return Object.values(results).reduce((sum, count) => sum + count, 0);
  };

  const getPercentage = (count) => {
    const total = getTotalResponses();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Question</h3>
      
      <div className="bg-gray-700 text-white rounded-t-lg p-4 mb-0">
        <p className="text-sm">{question}</p>
      </div>

      <div className="border border-gray-300 rounded-b-lg p-4 space-y-3">
        {Object.entries(results).map(([option, count], idx) => {
          const percentage = getPercentage(count);

          return (
            <div key={option} className="flex items-center gap-0">
              <div className="flex items-center bg-indigo-500 text-white rounded-md px-3 py-2 min-w-0" style={{ width: `${Math.max(percentage, 10)}%` }}>
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-semibold">
                    {idx + 1}
                  </span>
                </div>
                <span className="text-sm font-medium truncate">{option}</span>
              </div>
              
              <div className="flex-1 bg-gray-100 h-10 flex items-center justify-end px-3">
                <span className="text-sm font-semibold text-gray-900">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function StudentPanel() {
  const [enteredName, setEnteredName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [error, setError] = useState("");

  // Initialize socket connection
  useEffect(() => {
    const connectionOptions = {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    socket = io("http://localhost:5001", connectionOptions);

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      setError("");
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionStatus("Connection Error");
    });

    socket.on("questionStarted", (poll) => {
      setQuestionData(poll);
      setAnswer("");
      setResults(null);
      setHasSubmitted(false);
      setShowResults(false);
      setTimeLeft(poll.timeLimit || 60);
    });

    socket.on("pollResults", (pollResults) => {
      setResults(pollResults);
    });

    socket.on("answerSubmitted", () => {
      setHasSubmitted(true);
      setShowResults(true);
    });

    socket.on("error", (errorData) => {
      setError(errorData.message);
      setTimeout(() => setError(""), 5000);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Join poll when student name is set
  useEffect(() => {
    if (!studentName || !socket || !isConnected) return;
    socket.emit("joinPoll", { studentName });
  }, [studentName, isConnected]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasSubmitted && answer) {
            submitAnswer();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, hasSubmitted, answer]);

  const handleNameSubmit = () => {
    const trimmedName = enteredName.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    if (!isConnected) {
      setError("Not connected to server. Please wait or refresh the page.");
      return;
    }
    setStudentName(trimmedName);
    setError("");
  };

  const submitAnswer = () => {
    if (!answer) {
      setError("Please select an option before submitting");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!socket || !isConnected) {
      setError("Connection lost. Please refresh and try again.");
      return;
    }

    socket.emit("submitAnswer", { studentName, answer });
    setError("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

          {/* Connection Status */}
          <div className="text-center">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : error
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected
                    ? "bg-green-500"
                    : error
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              ></div>
              {connectionStatus}
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Let's Get Started
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mx-auto max-w-full">
              you'll have the ability to create and manage polls, ask questions,
              and monitor your students' responses in real-time.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Enter your name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Rahul Bajaj"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-12"
                maxLength={50}
                disabled={!isConnected}
              />
              <div className="text-right text-xs text-muted-foreground">
                {enteredName.length}/50
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                className="w-40 py-3 h-12 text-base bg-purple-600 hover:bg-purple-700"
                onClick={handleNameSubmit}
                disabled={!isConnected || !enteredName.trim()}
              >
                {isConnected ? "Continue" : "Connecting..."}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------
  // STUDENT PANEL - SHOW RESULTS
  // ------------------------
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {studentName}!
              </h2>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  isConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                {isConnected ? "Connected" : "Disconnected"}
              </div>
            </div>
          </div>

          {/* Live Results */}
          <LiveResults
            results={results}
            question={questionData?.question}
          />
        </div>
      </div>
    );
  }

  // ------------------------
  // STUDENT PANEL - ANSWERING
  // ------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome, {studentName}!
            </h2>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Question Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {questionData ? (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Current Question
                </h3>
                <div
                  className={`px-4 py-2 rounded-full font-medium ${
                    timeLeft > 10
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Question */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-medium text-gray-900">
                  {questionData.question}
                </p>
              </div>

              {/* Options */}
              {!hasSubmitted && timeLeft > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Select your answer:
                  </p>
                  {questionData.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={answer === opt}
                        onChange={() => setAnswer(opt)}
                        className="mr-3 h-4 w-4 text-purple-600"
                      />
                      <span className="text-gray-900">{opt}</span>
                    </label>
                  ))}

                  <Button
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                    onClick={submitAnswer}
                    disabled={!answer || timeLeft <= 0}
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-2">
                    {hasSubmitted ? "Answer submitted!" : "Time's up!"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Waiting for results...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                Waiting for question...
              </div>
              <div className="text-sm text-gray-400">
                Your teacher will start a poll soon
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}