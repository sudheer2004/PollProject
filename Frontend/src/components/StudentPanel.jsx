import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { io } from "socket.io-client";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
  </div>
);

export default function StudentPanel() {
  const [enteredName, setEnteredName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [totalResponses, setTotalResponses] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
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
      console.log("Connected to server");
      setIsConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("questionStarted", (poll) => {
      console.log("Question started:", poll);
      setQuestionData(poll);
      setAnswer("");
      setUserAnswer("");
      setResults(null);
      setHasSubmitted(false);
      setShowResults(false);
      setIsSubmitting(false);
      setTimeLeft(poll.timeLimit || 60);
      setError("");
    });

    // Listen for real-time timer updates from server
    socket.on("timeUpdate", (data) => {
      console.log("Timer update received:", data.timeLeft);
      setTimeLeft(data.timeLeft);
    });

    socket.on("pollResults", (pollResults) => {
      console.log("Poll results received:", pollResults);
      setResults(pollResults);
      const total = Object.values(pollResults).reduce((sum, count) => sum + count, 0);
      setTotalResponses(total);
    });

    socket.on("answerSubmitted", (data) => {
      console.log("Answer submitted confirmation received:", data);
      setHasSubmitted(true);
      setIsSubmitting(false);
      setUserAnswer(answer);
      // Immediately switch to results view after successful submission
      setShowResults(true);
    });

    socket.on("pollEnded", (data) => {
      console.log("Poll ended:", data);
      setResults(data.results);
      setTotalResponses(data.totalResponses);
      setShowResults(true);
      setTimeLeft(0);
      // Poll is now completely finished, can show final state
    });

    socket.on("error", (errorData) => {
      console.error("Socket error:", errorData);
      setError(errorData.message);
      setIsSubmitting(false);
      setTimeout(() => setError(""), 5000);
    });

    socket.on("joinConfirmed", (data) => {
      console.log("Join confirmed:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join poll when student name is set
  useEffect(() => {
    if (!studentName || !socketRef.current || !isConnected) return;
    console.log("Joining poll as:", studentName);
    socketRef.current.emit("joinPoll", { studentName });
  }, [studentName, isConnected]);

  // Auto-submit when time runs out (but only if not already submitted)
  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted && answer && questionData && !isSubmitting) {
      console.log("Time's up, auto-submitting answer:", answer);
      const timer = setTimeout(() => {
        if (!hasSubmitted && !isSubmitting) {
          submitAnswer();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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

    if (!socketRef.current || !isConnected) {
      setError("Connection lost. Please refresh and try again.");
      return;
    }

    if (hasSubmitted) {
      setError("You have already submitted your answer");
      return;
    }

    if (timeLeft <= 0) {
      setError("Time is up!");
      return;
    }

    console.log("Submitting answer:", answer);
    setIsSubmitting(true);
    setError("");
    
    socketRef.current.emit("submitAnswer", { studentName, answer });
    
    // Set a timeout to handle if the server doesn't respond
    setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false);
        setError("Submission timeout. Please try again.");
      }
    }, 5000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              ⚡ Intervue Poll
            </Badge>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Let's Get Started
            </h1>
            <p className="text-gray-600 text-base leading-relaxed">
              If you're a student, you'll be able to <span className="font-semibold">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-6 pt-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Enter your Name
              </label>
              <Input
                type="text"
                placeholder="Rahul Bajaj"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-12 bg-gray-100 border-0 text-base rounded-lg"
                maxLength={50}
                disabled={!isConnected}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700 rounded-full"
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
          <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            ⚡ Intervue Poll
          </Badge>
          
          <div className="space-y-6">
            <LoadingSpinner />
            
            <h2 className="text-2xl font-bold text-gray-900">
              Wait for the teacher to ask questions..
            </h2>
            
            {!isConnected && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                Connection lost. Please refresh the page.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------
  // SHOW RESULTS SCREEN - Show when student has submitted OR poll has ended
  // ------------------------
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Question Header with Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Question 1</h3>
              <div className="flex items-center text-red-600">
                <span className="text-lg">⏰</span>
                <span className="ml-1 font-mono">
                  {formatTime(Math.max(0, timeLeft))}
                </span>
              </div>
            </div>
          </div>
          
          {/* Question Card */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mx-auto max-w-lg">
            {/* Question Header */}
            <div className="bg-gray-600 text-white p-4">
              <p className="text-sm">{questionData?.question}</p>
            </div>
            
            {/* Results */}
            <div className="bg-white p-4 space-y-3">
              {Object.entries(results).map(([option, count], idx) => {
                const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                const isUserAnswer = option === userAnswer;
                
                return (
                  <div key={option} className="flex items-center">
                    {/* Progress Bar */}
                    <div 
                      className={`${isUserAnswer ? 'bg-green-600' : 'bg-purple-600'} text-white flex items-center px-3 py-2 rounded-md min-h-[40px]`}
                      style={{ width: `${Math.max(percentage, 15)}%` }}
                    >
                      <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{idx + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-white truncate">{option}</span>
                    </div>
                    
                    {/* Percentage */}
                    <div className="flex-1 bg-gray-100 h-10 flex items-center justify-end px-3">
                      <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wait message */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              Wait for the teacher to ask a new question..
            </p>
          </div>

          {/* Chat Icon */}
          <div className="fixed bottom-6 right-6">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white cursor-pointer">
              💬
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------
  // ANSWERING SCREEN
  // ------------------------
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Question Header with LIVE Timer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Question 1</h3>
            <div className="flex items-center text-red-600">
              <span className="text-lg">⏰</span>
              <span className="ml-1 font-mono">
                {formatTime(Math.max(0, timeLeft))}
              </span>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        {/* Question Card */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mx-auto max-w-lg">
          {questionData && (
            <>
              {/* Question Header */}
              <div className="bg-gray-600 text-white p-4">
                <p className="text-sm">{questionData.question}</p>
              </div>

              {/* Options or Submitted State */}
              <div className="bg-white p-4 space-y-3">
                {timeLeft > 0 ? (
                  hasSubmitted ? (
                    // Show submitted state but keep timer running
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600 text-2xl">✓</span>
                      </div>
                      <div className="text-green-600 font-medium mb-2">
                        Answer Submitted Successfully!
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        Your answer: "{userAnswer}"
                      </div>
                      <div className="text-sm text-gray-500">
                        Waiting for other students... Timer continues below
                      </div>
                      
                      {/* Show live results if available */}
                      {results && Object.keys(results).length > 0 && (
                        <div className="mt-6 space-y-2">
                          <div className="text-sm text-gray-600 mb-3">Live Results:</div>
                          {Object.entries(results).map(([option, count], idx) => {
                            const total = Object.values(results).reduce((sum, c) => sum + c, 0);
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            const isUserAnswer = option === userAnswer;
                            
                            return (
                              <div key={option} className="flex items-center text-sm">
                                <div className={`w-4 h-4 rounded-full mr-2 ${isUserAnswer ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                                <span className={`flex-1 ${isUserAnswer ? 'font-medium' : ''}`}>{option}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show options for answering
                    questionData.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                          answer === opt
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={opt}
                          checked={answer === opt}
                          onChange={() => setAnswer(opt)}
                          className="mr-3 h-4 w-4 text-purple-600"
                          disabled={isSubmitting}
                        />
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-semibold ${
                          answer === opt ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-gray-900">{opt}</span>
                      </label>
                    ))
                  )
                ) : (
                  // Time is up - show final waiting state
                  <div className="text-center py-8">
                    <LoadingSpinner />
                    <div className="text-gray-600 mt-4">
                      {hasSubmitted ? "Time's up! Waiting for final results..." : "Time's up! Poll ended without submission"}
                    </div>
                    {hasSubmitted && userAnswer && (
                      <div className="mt-2 text-sm text-purple-600">
                        Your answer: "{userAnswer}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Submit Button - Only show when NOT submitted and time is left */}
        {!hasSubmitted && timeLeft > 0 && (
          <div className="flex justify-center">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full disabled:opacity-50"
              onClick={submitAnswer}
              disabled={!answer || timeLeft <= 0 || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        )}

        {/* Timer Info - Show even after submission */}
        {hasSubmitted && timeLeft > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Poll continues for {formatTime(timeLeft)} more...
            </p>
          </div>
        )}

        {/* Chat Icon */}
        <div className="fixed bottom-6 right-6">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white cursor-pointer">
            💬
          </div>
        </div>
      </div>
    </div>
  );
}