import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center">
    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

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
      setError("");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto space-y-8 text-center">
          {/* Header Badge */}
          <div className="flex justify-center">
            <Badge className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Intervue Poll
            </Badge>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Let's Get Started
            </h1>
            <p className="text-gray-600 text-base leading-relaxed">
              If you're a student, you'll be able to <span className="font-semibold">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-4 pt-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Enter your Name
              </label>
              <Input
                type="text"
                placeholder="Rahul Bajaj"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-12 bg-gray-100 border-0 text-base"
                maxLength={50}
                disabled={!isConnected}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 rounded-full"
              onClick={handleNameSubmit}
              disabled={!isConnected || !enteredName.trim()}
            >
              {isConnected ? "Continue" : "Connecting..."}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------
  // WAITING SCREEN
  // ------------------------
  if (!questionData && !showResults) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto space-y-8 text-center">
          <Badge className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Intervue Poll
          </Badge>
          
          <LoadingSpinner />
          
          <h2 className="text-2xl font-bold text-gray-900">
            Wait for the teacher to ask questions..
          </h2>
        </div>
      </div>
    );
  }

  // ------------------------
  // SHOW RESULTS
  // ------------------------
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <Badge className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Intervue Poll
            </Badge>
          </div>
          <LiveResults results={results} question={questionData?.question} />
        </div>
      </div>
    );
  }

  // ------------------------
  // ANSWERING SCREEN
  // ------------------------
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <Badge className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Intervue Poll
          </Badge>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {questionData && (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Question
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
              <div className="bg-gray-700 text-white rounded-lg p-4">
                <p className="text-base">{questionData.question}</p>
              </div>

              {/* Options */}
              {!hasSubmitted && timeLeft > 0 ? (
                <div className="space-y-3">
                  {questionData.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        answer === opt
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={answer === opt}
                        onChange={() => setAnswer(opt)}
                        className="mr-3 h-4 w-4 text-indigo-600"
                      />
                      <span className="text-gray-900 font-medium">{opt}</span>
                    </label>
                  ))}

                  <Button
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-12 text-base rounded-full"
                    onClick={submitAnswer}
                    disabled={!answer || timeLeft <= 0}
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <LoadingSpinner />
                  <div className="text-gray-600 mt-4 text-lg">
                    {hasSubmitted ? "Answer submitted!" : "Time's up!"}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Waiting for results...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}