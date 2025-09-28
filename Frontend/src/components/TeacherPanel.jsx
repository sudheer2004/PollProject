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
  
  // History state
  const [pollHistory, setPollHistory] = useState([]);
  const [currentView, setCurrentView] = useState("form"); // "form", "results", "history"
  
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5001", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pollResults", (results) => {
      setPollResults(results);
    });

    socket.on("pollEnded", () => {
      setTimerEnded(true);
    });

    socket.on("pollHistory", (history) => {
      setPollHistory(history);
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
    setPollResults(
      filteredOptions.reduce((acc, opt) => ({ ...acc, [opt.text]: 0 }), {})
    );

    // Set timer to mark when poll ends
    setTimeout(() => {
      setTimerEnded(true);
    }, pollPayload.timeLimit * 1000);
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
    setCurrentView("form");
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

          {/* Question Form Component - Now contains all header elements */}
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
    </div>
  );
};

export default TeacherPanel;