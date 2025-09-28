import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Users,
  Clock,
  BarChart3,
  Trash2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

// PollClient for real-time polling
class PollClient {
  constructor(baseUrl) {
    this.socket = io(baseUrl);
    this.events = {};

    this.socket.on("connect", () => this.trigger("connect"));
    this.socket.on("disconnect", (reason) =>
      this.trigger("disconnect", reason)
    );
    this.socket.on("pollResults", (data) => this.trigger("pollResults", data));
    this.socket.on("connectedStudents", (count) =>
      this.trigger("connectedStudents", count)
    );
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event])
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  trigger(event, data) {
    if (this.events[event]) this.events[event].forEach((cb) => cb(data));
  }
  // Add listener for connectedStudents

  createPoll(pollData) {
    console.log("in socket connection",pollData);
    this.socket.emit("questionStarted", pollData);
  }

  endPoll() {
    this.socket.emit("endPoll");
  }

  disconnect() {
    this.socket.disconnect();
  }
}

const TeacherPanel = () => {
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [options, setOptions] = useState([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [pollResults, setPollResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [connectedStudents, setConnectedStudents] = useState(0);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [error, setError] = useState("");
  const [isPollActive, setIsPollActive] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clientRef = useRef(null);

  // Debug logging
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    console.log(`[TEACHER DEBUG] ${message}`);
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    addDebugLog("Initializing PollClient connection...");
    const pollClient = new PollClient("http://localhost:5001");
    clientRef.current = pollClient;

    pollClient.on("connect", () => {
      addDebugLog("✅ Connected to poll server");
      setIsConnected(true);
      setConnectionStatus("Connected");
      setError("");
    });

    pollClient.on("disconnect", (reason) => {
      addDebugLog(`❌ Poll server disconnected: ${reason}`);
      setIsConnected(false);
      setConnectionStatus("Disconnected");
      setError(`Disconnected: ${reason}`);
    });

    pollClient.on("pollResults", (results) => {
      addDebugLog("📊 Poll results updated");
      setPollResults(results);
    });

    pollClient.on("connectedStudents", (count) => {
      setConnectedStudents(count);
    });

    return () => {
      addDebugLog("Disconnecting PollClient");
      pollClient.disconnect();
    };
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0 || !isPollActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPollActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isPollActive]);

  // Option handlers
  const addOption = () => {
    const newOption = { id: String(Date.now()), text: "", isCorrect: false };
    setOptions([...options, newOption]);
    addDebugLog(`Added option (total: ${options.length + 1})`);
  };

  const removeOption = (idToRemove) => {
    if (options.length <= 2) {
      setError("You need at least 2 options");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setOptions(options.filter((opt) => opt.id !== idToRemove));
    addDebugLog(`Removed option (remaining: ${options.length - 1})`);
  };

  const updateOption = (id, text) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const updateCorrectAnswer = (id) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      }))
    );
    addDebugLog(`Updated correct answer for option: ${id}`);
  };

  const validatePollData = () => {
    const trimmedQuestion = question.trim();
    const filteredOptions = options.filter((opt) => opt.text.trim() !== "");
    console.log("hello",trimmedQuestion,filteredOptions);
    return { question: trimmedQuestion, options: filteredOptions };
  };

  const askQuestion = () => {
    console.log("clicked");
    const validated = validatePollData();
    if (!validated) return;
     console.log("validated");
    const pollPayload = {
      question: validated.question,
      options: validated.options.map((opt) => opt.text),
      correctAnswer: validated.options.find((opt) => opt.isCorrect)?.text,
      timeLimit: parseInt(timeLimit),
    };

    setIsSubmitting(true);
    clientRef.current.createPoll(pollPayload);
    setCurrentPoll(pollPayload);
    setTimeLeft(pollPayload.timeLimit);
    setIsPollActive(true);
    setPollResults(null);
    setIsSubmitting(false);
    addDebugLog("🚀 Poll started");
  };

  const endCurrentPoll = () => {
    if (isPollActive) {
      clientRef.current.endPoll();
      setIsPollActive(false);
      setTimeLeft(0);
      addDebugLog("🛑 Poll ended manually");
    }
  };

  const canAskQuestion = () => !isPollActive && isConnected && !isSubmitting;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalResponses = () => {
    if (!pollResults) return 0;
    return Object.values(pollResults).reduce((sum, count) => sum + count, 0);
  };

  const getResponsePercentage = (count) => {
    const total = getTotalResponses();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  // --- UI starts here ---
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full font-medium mb-4">
                📊 Live Polling Teacher Dashboard
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time polling via Socket.IO
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isConnected ? (
                  <Wifi className="w-3 h-3 mr-2" />
                ) : (
                  <WifiOff className="w-3 h-3 mr-2" />
                )}
                {connectionStatus}
              </div>

              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {connectedStudents} clients connected
                </span>
              </div>

              {isPollActive && (
                <div
                  className={`flex items-center px-3 py-1 rounded-full font-medium ${
                    timeLeft > 10
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Poll
            </h2>
            <Select value={timeLimit} onValueChange={setTimeLimit}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                <SelectValue />
                <span className="text-gray-500 ml-2">seconds</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">60 seconds</SelectItem>
                <SelectItem value="90">90 seconds</SelectItem>
                <SelectItem value="120">120 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Enter your question
            </Label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="w-full bg-gray-50 border-0 text-lg py-4 px-4 rounded-lg min-h-[100px] resize-none focus:ring-2 focus:ring-purple-500"
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-500">
              {question.length}/200
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Edit Options
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Add answer options and mark the correct one
          </p>

          <div className="space-y-4">
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {idx + 1}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-white border-gray-200 py-3 px-4"
                />
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-700">
                    Correct?
                  </div>
                  <RadioGroup
                    value={opt.isCorrect ? "yes" : "no"}
                    onValueChange={() => updateCorrectAnswer(opt.id)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`yes-${opt.id}`} />
                      <Label htmlFor={`yes-${opt.id}`} className="text-sm">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`no-${opt.id}`} />
                      <Label htmlFor={`no-${opt.id}`} className="text-sm">
                        No
                      </Label>
                    </div>
                  </RadioGroup>

                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(opt.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addOption}
            className="mt-6 border-dashed border-2 bg-transparent hover:bg-purple-50 text-purple-600 border-purple-300 hover:border-purple-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add More option
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          {isPollActive && (
            <Button
              variant="outline"
              onClick={endCurrentPoll}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              End Current Poll
            </Button>
          )}
          <Button
            size="lg"
            onClick={askQuestion}
            className={`px-8 py-3 ${
              canAskQuestion()
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSubmitting
              ? "Creating..."
              : isPollActive
              ? "Start New Question"
              : "Ask Question"}
          </Button>
        </div>

        {/* Live Results */}
        {pollResults && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Live Results
              </h3>
              <div className="text-sm text-gray-600">
                {getTotalResponses()} responses
              </div>
            </div>

            {currentPoll && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {currentPoll.question}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(pollResults).map(([option, count]) => {
                const percentage = getResponsePercentage(count);
                const isCorrect = currentPoll?.correctAnswer === option;
                return (
                  <div
                    key={option}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCorrect && (
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{option}</p>
                        <div className="h-3 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              isCorrect ? "bg-green-500" : "bg-purple-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-sm font-semibold text-gray-700">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;
