import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Badge } from "@/components/ui/badge";

// Import modular components
import QuestionForm from "./QuestionForm";
import LiveResults from "./LiveResults";
import PollHistory from "./PollHistory";

const TeacherPanel = () => {
  // Form state
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [options, setOptions] = useState([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  
  // Poll state
  const [pollResults, setPollResults] = useState(null);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);
  
  // Track connected students and time remaining
  const [totalStudents, setTotalStudents] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // History state
  const [pollHistory, setPollHistory] = useState([]);
  const [currentView, setCurrentView] = useState("form"); // "form", "results", "history"
  
  // Error state
  const [error, setError] = useState("");
  
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("https://pollproject.onrender.com/", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Request initial student count
      socket.emit("getCurrentPoll");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pollResults", (results) => {
      setPollResults(results);
    });

    socket.on("pollEnded", () => {
      setTimerEnded(true);
      setTimeRemaining(0);
    });

    socket.on("pollHistory", (history) => {
      setPollHistory(history);
    });

    // Listen for student updates
    socket.on("studentUpdate", (data) => {
      console.log("Student update received:", data);
      setTotalStudents(data.totalStudents || 0);
    });

    // Listen for time updates
    socket.on("timeUpdate", (data) => {
      setTimeRemaining(data.timeLeft);
    });

    // Listen for errors from backend
    socket.on("error", (errorData) => {
      setError(errorData.message);
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
    });

    return () => socket.disconnect();
  }, []);

  const askQuestion = () => {
    const trimmedQuestion = question.trim();
    const filteredOptions = options.filter((opt) => opt.text.trim());

    if (!trimmedQuestion || filteredOptions.length < 2) return;

    const pollPayload = {
      question: trimmedQuestion,
      options: filteredOptions.map((opt) => opt.text),
      correctAnswer: filteredOptions.find((opt) => opt.isCorrect)?.text,
      timeLimit: parseInt(timeLimit),
    };

    socketRef.current.emit("questionStarted", pollPayload);
    setCurrentPoll(pollPayload);
    setShowResults(true);
    setCurrentView("results");
    setTimerEnded(false);
    setTimeRemaining(parseInt(timeLimit));
    setPollResults(
      filteredOptions.reduce((acc, opt) => ({ ...acc, [opt.text]: 0 }), {})
    );
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setOptions([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
    ]);
    setShowResults(false);
    setPollResults(null);
    setCurrentPoll(null);
    setTimerEnded(false);
    setTimeRemaining(0);
    setCurrentView("form");
    setError(""); // Clear any errors
  };

  const handleViewHistory = () => {
    socketRef.current.emit("getPollHistory");
    setCurrentView("history");
  };

  const handleBackToResults = () => {
    setCurrentView("results");
  };

  const handleBackToForm = () => {
    setCurrentView("form");
  };

  // Calculate total responses
  const totalResponses = pollResults 
    ? Object.values(pollResults).reduce((sum, count) => sum + count, 0) 
    : 0;

  // Determine if all students have responded
  const allStudentsResponded = totalStudents > 0 && totalResponses >= totalStudents;

  // Render based on current view
  if (currentView === "history") {
    return (
      <PollHistory 
        history={pollHistory} 
        onBack={showResults ? handleBackToResults : handleBackToForm}
      />
    );
  }

  if (currentView === "results" && showResults) {
    return (
      <LiveResults
        results={pollResults || {}}
        question={currentPoll?.question}
        onNewQuestion={handleNewQuestion}
        onViewHistory={handleViewHistory}
        timerEnded={timerEnded}
        totalStudents={totalStudents}
        totalResponses={totalResponses}
        allStudentsResponded={allStudentsResponded}
        timeRemaining={timeRemaining}
      />
    );
  }

  // Default form view
  return (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Connection Status */}
          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="text-yellow-800 text-sm">
                Connecting to server...
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                {error}
              </div>
            </div>
          )}

          {/* Question Form Component */}
          <QuestionForm
            question={question}
            setQuestion={setQuestion}
            timeLimit={timeLimit}
            setTimeLimit={setTimeLimit}
            options={options}
            setOptions={setOptions}
            onAskQuestion={askQuestion}
            isConnected={isConnected}
          />
        </div>
      </div>

      {/* Add Sora Font */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
      `}</style>
    </div>
  );
};

export default TeacherPanel;