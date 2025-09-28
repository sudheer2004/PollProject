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

// Custom Waiting Screen Componenta
const WaitingScreen = ({ isConnected }) => (
  <div className="flex flex-col items-center justify-center bg-white min-h-screen w-full">
    {/* Intervue Poll Label */}
    <div 
      className="flex items-center justify-center text-white font-medium mb-8"
      style={{
        width: '134px',
        height: '31px',
        background: 'linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)',
        borderRadius: '24px',
        fontFamily: 'Sora, sans-serif',
        fontSize: '12px',
        fontWeight: 500
      }}
    >
      ⚡ Intervue Poll
    </div>

    {/* Spinner */}
    <div className="mb-8">
      <div 
        className="animate-spin rounded-full border-gray-200"
        style={{
          width: '61px',
          height: '62px',
          border: '8px solid #e5e7eb',
          borderTopColor: '#500ECE',
          borderRightColor: '#500ECE'
        }}
      ></div>
    </div>

    {/* Wait Text */}
    <div
      style={{
        width: '737px',
        height: '42px',
        fontFamily: 'Sora, sans-serif',
        fontWeight: 600,
        fontSize: '33px',
        color: '#000',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      Wait for the teacher to ask questions..
    </div>

    {!isConnected && (
      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">
        Connection lost. Please refresh the page.
      </div>
    )}

    {/* Add Sora Font */}
    <style jsx>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `}</style>
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
  const timerRef = useRef(null);

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

    socket.on("timeUpdate", (data) => {
      console.log("Timer update received:", data.timeLeft);
      setTimeLeft(data.timeLeft);
      console.log("sudheer", data.timeLeft);
    });

    socket.on("pollResults", (pollResults) => {
      console.log("Poll results received:", pollResults);
      setResults(pollResults);
      const total = Object.values(pollResults).reduce(
        (sum, count) => sum + count,
        0,
      );
      setTotalResponses(total);
    });

    socket.on("answerSubmitted", (data) => {
      console.log("Answer submitted confirmation received:", data);
      setHasSubmitted(true);
      setIsSubmitting(false);
      setUserAnswer(answer);
      setShowResults(true);
    });

    socket.on("pollEnded", (data) => {
      console.log("Poll ended:", data);
      setResults(data.results);
      setTotalResponses(data.totalResponses);
      setShowResults(true);
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (questionData && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [questionData]);

  useEffect(() => {
    if (!studentName || !socketRef.current || !isConnected) return;
    console.log("Joining poll as:", studentName);
    socketRef.current.emit("joinPoll", { studentName });
  }, [studentName, isConnected]);

  useEffect(() => {
    if (
      timeLeft === 0 &&
      !hasSubmitted &&
      answer &&
      questionData &&
      !isSubmitting
    ) {
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ------------------------
  // FIGMA ONBOARDING SCREEN
  // ------------------------
  if (!studentName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto text-center space-y-6">
          {/* Top Badge */}
          <div className="flex justify-center">
            <div 
              className="px-6 py-2 text-white font-medium text-sm rounded-3xl"
              style={{ 
                background: "linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)",
                borderRadius: "24px",
                fontFamily: 'Sora, sans-serif'
              }}
            >
              ⚡ Intervue Poll
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-4xl text-black leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              <span className="font-normal">Let's</span>{" "}
              <span className="font-semibold">Get Started</span>
            </h1>
            
            <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#5C5B5B", fontFamily: 'Sora, sans-serif' }}>
              If you're a student, you'll be able to{" "}
              <span className="font-semibold text-black">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
            </p>
          </div>

          {/* Name Input Section */}
          <div className="space-y-6 pt-4">
            <div className="text-left max-w-lg mx-auto">
              <label className="block text-lg font-normal text-black mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                Enter your Name
              </label>
              <Input
                type="text"
                placeholder="Rahul Bajaj"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-0 font-normal text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  width: "507px",
                  height: "60px",
                  backgroundColor: "#F2F2F2",
                  borderRadius: "2px",
                  fontSize: "18px",
                  padding: "0 16px",
                  color: "#000000",
                  fontFamily: 'Sora, sans-serif'
                }}
                maxLength={50}
                disabled={!isConnected}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg max-w-lg mx-auto">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleNameSubmit}
                disabled={!isConnected || !enteredName.trim()}
                className="text-white font-medium text-base px-12 py-4 transition-all duration-200 hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #8F64E1 0%, #1D68BD 100%)",
                  borderRadius: "34px",
                  width: "234px",
                  height: "58px",
                  fontFamily: 'Sora, sans-serif'
                }}
              >
                {isConnected ? "Continue" : "Connecting..."}
              </Button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        `}</style>
      </div>
    );
  }

  // ------------------------
  // CUSTOM WAITING SCREEN
  // ------------------------
  if (!questionData && !showResults) {
    return <WaitingScreen isConnected={isConnected} />;
  }

  // ------------------------
  // SHOW RESULTS SCREEN - Using your design system
  // ------------------------
  if (showResults && results) {
    const optionsData = Object.entries(results).map(([text, count], index) => {
      const total = Object.values(results).reduce((sum, c) => sum + c, 0);
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { text, percentage, number: index + 1 };
    });

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Question Header with Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                Question 1
              </h3>
              <div className="flex items-center text-red-600">
                <span className="text-lg">⏰</span>
                <span className="ml-1 font-mono" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {formatTime(Math.max(0, timeLeft))}
                </span>
              </div>
            </div>
          </div>

          {/* Question Card - Following your design system */}
          <div className="flex justify-center">
            <div 
              style={{
                width: '650px',
                minHeight: '300px',
                border: '1px solid #AF8FF1',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* Question Header */}
              <div
                className="flex items-center px-4"
                style={{
                  width: '100%',
                  height: '50px',
                  background: 'linear-gradient(135deg, #343434 0%, #6E6E6E 100%)',
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 600,
                  fontSize: '17px',
                  color: 'white'
                }}
              >
                {questionData?.question}
              </div>

              {/* Results */}
              <div className="p-6 space-y-4" style={{ backgroundColor: 'white' }}>
                {optionsData.map((option, idx) => {
                  const isUserAnswer = option.text === userAnswer;

                  return (
                    <div key={option.text} className="flex items-center">
                      {/* Progress Bar Container */}
                      <div
                        className="flex items-center relative"
                        style={{
                          width: '100%',
                          height: '55px'
                        }}
                      >
                        {/* Progress Fill */}
                        <div
                          className="flex items-center px-4"
                          style={{
                            width: `${Math.max(option.percentage, 25)}%`,
                            height: '55px',
                            background: isUserAnswer ? '#10B981' : '#6766D5',
                            borderRadius: '6px',
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
                          {/* Option Number Circle */}
                          <div
                            className="flex items-center justify-center mr-3 flex-shrink-0"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              color: isUserAnswer ? '#10B981' : '#6766D5',
                              fontFamily: 'Sora, sans-serif',
                              fontSize: '11px',
                              fontWeight: 400
                            }}
                          >
                            {option.number}
                          </div>
                          
                          {/* Option Text */}
                          <span
                            className="text-white truncate"
                            style={{
                              fontFamily: 'Sora, sans-serif',
                              fontSize: '16px',
                              fontWeight: 400
                            }}
                          >
                            {option.text}
                          </span>
                        </div>

                        {/* Background Bar */}
                        <div
                          className="absolute top-0 left-0 flex items-center justify-end px-4"
                          style={{
                            width: '100%',
                            height: '55px',
                            background: '#F6F6F6',
                            borderRadius: '6px',
                            zIndex: 1
                          }}
                        >
                          {/* Percentage Text */}
                          <span
                            style={{
                              fontFamily: 'Sora, sans-serif',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#000000'
                            }}
                          >
                            {option.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wait message */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
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

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        `}</style>
      </div>
    );
  }

  // ------------------------
  // ANSWERING SCREEN - Using your design system
  // ------------------------
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Question Header with Timer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Question 1
            </h3>
            <div className="flex items-center text-red-600">
              <span className="text-lg">⏰</span>
              <span className="ml-1 font-mono" style={{ fontFamily: 'Sora, sans-serif' }}>
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

        {/* Question Card - Following your design system */}
        <div className="flex justify-center">
          <div 
            style={{
              width: '650px',
              minHeight: '300px',
              border: '1px solid #AF8FF1',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {questionData && (
              <>
                {/* Question Header */}
                <div
                  className="flex items-center px-4"
                  style={{
                    width: '100%',
                    height: '50px',
                    background: 'linear-gradient(135deg, #343434 0%, #6E6E6E 100%)',
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 600,
                    fontSize: '17px',
                    color: 'white'
                  }}
                >
                  {questionData.question}
                </div>

                {/* Options */}
                <div className="p-6 space-y-3" style={{ backgroundColor: 'white' }}>
                  {timeLeft > 0 ? (
                    hasSubmitted ? (
                      // Show submitted state
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-green-600 text-2xl">✓</span>
                        </div>
                        <div className="text-green-600 font-medium mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                          Answer Submitted Successfully!
                        </div>
                        <div className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                          Your answer: "{userAnswer}"
                        </div>
                        <div className="text-sm text-gray-500" style={{ fontFamily: 'Sora, sans-serif' }}>
                          Waiting for other students... Timer continues above
                        </div>

                        {/* Show live results if available */}
                        {results && Object.keys(results).length > 0 && (
                          <div className="mt-6 space-y-2">
                            <div className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
                              Live Results:
                            </div>
                            {Object.entries(results).map(
                              ([option, count], idx) => {
                                const total = Object.values(results).reduce(
                                  (sum, c) => sum + c,
                                  0,
                                );
                                const percentage =
                                  total > 0
                                    ? Math.round((count / total) * 100)
                                    : 0;
                                const isUserAnswer = option === userAnswer;

                                return (
                                  <div
                                    key={option}
                                    className="flex items-center text-sm"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full mr-2 ${isUserAnswer ? "bg-green-500" : "bg-purple-500"}`}
                                    ></div>
                                    <span
                                      className={`flex-1 ${isUserAnswer ? "font-medium" : ""}`}
                                      style={{ fontFamily: 'Sora, sans-serif' }}
                                    >
                                      {option}
                                    </span>
                                    <span className="font-medium" style={{ fontFamily: 'Sora, sans-serif' }}>
                                      {percentage}%
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Show options for answering - Using your design system
                      questionData.options.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                            answer === opt
                              ? "border-purple-600 bg-purple-50"
                              : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                          }`}
                          style={{ minHeight: '60px' }}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={opt}
                            checked={answer === opt}
                            onChange={() => setAnswer(opt)}
                            className="mr-4 h-4 w-4 text-purple-600"
                            disabled={isSubmitting}
                          />
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-semibold ${
                              answer === opt
                                ? "bg-purple-600 text-white"
                                : "bg-gray-300 text-gray-600"
                            }`}
                            style={{ fontFamily: 'Sora, sans-serif' }}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-gray-900 flex-1" style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px' }}>
                            {opt}
                          </span>
                        </label>
                      ))
                    )
                  ) : (
                    // Time is up - show final waiting state
                    <div className="text-center py-8">
                      <LoadingSpinner />
                      <div className="text-gray-600 mt-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {hasSubmitted
                          ? "Time's up! Waiting for final results..."
                          : "Time's up! Poll ended without submission"}
                      </div>
                      {hasSubmitted && userAnswer && (
                        <div className="mt-2 text-sm text-purple-600" style={{ fontFamily: 'Sora, sans-serif' }}>
                          Your answer: "{userAnswer}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        {!hasSubmitted && timeLeft > 0 && (
          <div className="flex justify-center">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full disabled:opacity-50"
              onClick={submitAnswer}
              disabled={!answer || timeLeft <= 0 || isSubmitting}
              style={{ 
                fontFamily: 'Sora, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                width: '200px',
                height: '50px'
              }}
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
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Sora, sans-serif' }}>
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

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}