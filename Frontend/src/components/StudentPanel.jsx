import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";

// Debug version with connection testing
let socket;

export default function StudentPanel() {
  const [enteredName, setEnteredName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [error, setError] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);

  // Debug logging function
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]); // Keep last 10 logs
    console.log(`[STUDENT DEBUG] ${message}`);
  };

  // Initialize socket connection
  useEffect(() => {
    addDebugLog("Initializing socket connection...");

    try {
      // Try different connection approaches
      const connectionOptions = {
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        forceNew: true,
      };

      // Try localhost first, then 127.0.0.1 as fallback
      socket = io("http://localhost:5001", connectionOptions);
      addDebugLog("Socket created with localhost:5001");

      // Connection event handlers
      socket.on("connect", () => {
        addDebugLog("✅ Connected successfully!");
        setIsConnected(true);
        setConnectionStatus("Connected");
        setError("");
      });

      socket.on("disconnect", (reason) => {
        addDebugLog(`❌ Disconnected: ${reason}`);
        setIsConnected(false);
        setConnectionStatus("Disconnected");
        setError(`Disconnected: ${reason}`);
      });

      socket.on("connect_error", (error) => {
        addDebugLog(`❌ Connection error: ${error.message}`);
        setIsConnected(false);
        setConnectionStatus("Connection Error");
        setError(`Connection failed: ${error.message}`);

        // Try fallback to 127.0.0.1
        setTimeout(() => {
          addDebugLog("Trying fallback connection to 127.0.0.1:5001");
          socket.disconnect();
          socket = io("http://127.0.0.1:5001", connectionOptions);
          setupSocketEvents();
        }, 2000);
      });

      socket.on("reconnect", (attemptNumber) => {
        addDebugLog(`🔄 Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setConnectionStatus("Reconnected");
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        addDebugLog(`🔄 Reconnection attempt #${attemptNumber}`);
        setConnectionStatus(`Reconnecting... (${attemptNumber})`);
      });

      socket.on("reconnect_error", (error) => {
        addDebugLog(`❌ Reconnection error: ${error.message}`);
      });

      socket.on("reconnect_failed", () => {
        addDebugLog("❌ All reconnection attempts failed");
        setConnectionStatus("Connection Failed");
        setError(
          "Unable to connect to server. Please check if the server is running on port 5001."
        );
      });

      setupSocketEvents();
    } catch (error) {
      addDebugLog(`❌ Socket initialization error: ${error.message}`);
      setError("Failed to initialize socket connection");
    }

    return () => {
      if (socket) {
        addDebugLog("Cleaning up socket connection");
        socket.disconnect();
      }
    };
  }, []);

  // Setup socket event listeners
  const setupSocketEvents = () => {
    if (!socket) return;

    socket.on("joinConfirmed", (data) => {
      addDebugLog(`✅ Join confirmed: ${data.studentName}`);
    });

    socket.on("questionStarted", (poll) => {
      addDebugLog(`📝 Question received: ${poll.question}`);
      setQuestionData(poll);
      setAnswer("");
      setResults(null);
      setHasSubmitted(false);
      setTimeLeft(poll.timeLimit || 60);
    });

    socket.on("updateResults", (pollResults) => {
      addDebugLog("📊 Results updated");
      setResults(pollResults.results);
    });

    socket.on("questionEnded", (endedPoll) => {
      addDebugLog("🏁 Question ended");
      setResults(endedPoll.results);
      setTimeLeft(0);
    });

    socket.on("answerSubmitted", () => {
      addDebugLog("✅ Answer submission confirmed");
      setHasSubmitted(true);
    });

    socket.on("error", (errorData) => {
      addDebugLog(`❌ Server error: ${errorData.message}`);
      setError(errorData.message);
      setTimeout(() => setError(""), 5000);
    });
  };

  // Join poll when student name is confirmed
  useEffect(() => {
    if (!studentName || !socket || !isConnected) return;

    addDebugLog(`Attempting to join poll as: ${studentName}`);
    socket.emit("joinPoll", { studentName });
  }, [studentName, isConnected]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasSubmitted && answer) {
            addDebugLog("⏰ Auto-submitting due to timeout");
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
    addDebugLog(`Setting student name: ${trimmedName}`);
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

    addDebugLog(`Submitting answer: ${answer}`);
    socket.emit("submitAnswer", { studentName, answer });
    setError("");
  };

  const testConnection = async () => {
    addDebugLog("Testing server connection...");
    setConnectionStatus("Testing...");

    try {
      const response = await fetch("http://localhost:5001/health");
      if (response.ok) {
        const data = await response.json();
        addDebugLog("✅ Server is reachable via HTTP");
        setConnectionStatus("Server reachable");
      } else {
        addDebugLog("❌ Server HTTP error: " + response.status);
        setConnectionStatus("Server error");
      }
    } catch (error) {
      addDebugLog("❌ Server not reachable: " + error.message);
      setConnectionStatus("Server unreachable");
      setError("Cannot reach server. Make sure it's running on port 5001.");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Debug panel component
  const DebugPanel = () => (
    <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
      <h4 className="font-bold mb-2">Debug Information:</h4>
      <div className="space-y-1">
        <div>
          Status: <span className="font-mono">{connectionStatus}</span>
        </div>
        <div>
          Connected:{" "}
          <span className="font-mono">{isConnected ? "Yes" : "No"}</span>
        </div>
        <div>
          Socket ID: <span className="font-mono">{socket?.id || "N/A"}</span>
        </div>
        <div>
          Transport:{" "}
          <span className="font-mono">
            {socket?.io?.engine?.transport?.name || "N/A"}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="font-bold">Recent Logs:</div>
        <div className="bg-black text-green-400 p-2 rounded font-mono text-xs h-32 overflow-y-auto">
          {debugLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>
      <Button
        onClick={testConnection}
        size="sm"
        className="mt-2 bg-blue-600 hover:bg-blue-700"
      >
        Test Server Connection
      </Button>
    </div>
  );

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

          {/* Debug Panel */}
          <DebugPanel />
        </div>
      </div>
    );
  }

  // ------------------------
  // STUDENT PANEL
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

        {/* Results Panel */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Live Results
            </h3>
            <div className="space-y-3">
              {Object.entries(results).map(([opt, count]) => {
                const total = Object.values(results).reduce(
                  (sum, c) => sum + c,
                  0
                );
                const percentage =
                  total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div
                    key={opt}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{opt}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-16 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Debug Panel */}
        <DebugPanel />
      </div>
    </div>
  );
}
