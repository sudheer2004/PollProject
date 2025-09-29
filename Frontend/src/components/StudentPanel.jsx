import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
  </div>
);

// Custom Waiting Screen Component
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
        maxWidth: '90vw',
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
  </div>
);

export default function StudentPanel() {
  const [enteredName, setEnteredName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
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
    const socket = io("https://pollproject.onrender.com/", {
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
      setSelectedOption(null);
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
      selectedOption !== null &&
      questionData &&
      !isSubmitting
    ) {
      console.log("Time's up, auto-submitting answer");
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
    if (selectedOption === null) {
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

    const answer = questionData.options[selectedOption];
    console.log("Submitting answer:", answer);
    setIsSubmitting(true);
    setError("");
    setUserAnswer(answer);

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

  // ONBOARDING SCREEN
  if (!studentName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto text-center space-y-6">
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
                  width: "100%",
                  maxWidth: "507px",
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

  // WAITING SCREEN
  if (!questionData && !showResults) {
    return <WaitingScreen isConnected={isConnected} />;
  }

  // SHOW RESULTS SCREEN
  if (showResults && results) {
    const optionsData = Object.entries(results).map(([text, count], index) => {
      const total = Object.values(results).reduce((sum, c) => sum + c, 0);
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { text, percentage, number: index + 1 };
    });

    const cardHeight = optionsData.length === 4 ? '353px' : 'auto';

    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col" style={{ width: '100%', maxWidth: '727px' }}>
            {/* Header with Question Number and Timer */}
            <div className="flex items-center gap-6 mb-6">
              <h1 
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 600,
                  fontSize: '22px',
                  color: '#000000',
                  margin: 0,
                  lineHeight: '1'
                }}
              >
                Question 1
              </h1>
              
              {/* Timer */}
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z" stroke="black" strokeWidth="2"/>
                  <path d="M12 12V8" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 2H15" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 2V5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 7L6 9" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 7L18 9" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span 
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 600,
                    fontSize: '18px',
                    color: '#CB1206'
                  }}
                >
                  {formatTime(Math.max(0, timeLeft))}
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div 
              className="mb-8"
              style={{
                width: '100%',
                maxWidth: '727px',
                height: cardHeight,
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

              {/* Options Container */}
              <div className="p-6 space-y-4">
                {optionsData.map((option, index) => (
                  <div key={index} className="flex items-center justify-center">
                    {/* Option Bar with Border */}
                    <div
                      className="flex items-center relative"
                      style={{
                        width: '100%',
                        maxWidth: '678px',
                        height: '55px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Progress Fill */}
                      <div
                        className="flex items-center px-4"
                        style={{
                          width: `${Math.max(option.percentage, 25)}%`,
                          height: '100%',
                          background: '#6766D5',
                          borderRadius: '4px',
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
                            color: '#6766D5',
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
                          height: '100%',
                          background: '#F6F6F6',
                          borderRadius: '4px',
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
                ))}
              </div>
            </div>

            {/* Wait message */}
            <div className="text-center">
              <p 
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#000000'
                }}
              >
                Wait for the teacher to ask a new question..
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        `}</style>
      </div>
    );
  }

  // ANSWERING SCREEN - Using exact styling from poll question component
  const cardHeight = questionData?.options?.length === 4 ? '353px' : 'auto';

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col" style={{ width: '100%', maxWidth: '727px' }}>
          {/* Header with Question Number and Timer */}
          <div className="flex items-center gap-6 mb-6">
            <h1 
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: '22px',
                color: '#000000',
                margin: 0,
                lineHeight: '1'
              }}
            >
              Question 1
            </h1>
            
            {/* Timer */}
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z" stroke="black" strokeWidth="2"/>
                <path d="M12 12V8" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 2H15" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 2V5" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 7L6 9" stroke="black" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 7L18 9" stroke="black" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span 
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 600,
                  fontSize: '18px',
                  color: '#CB1206'
                }}
              >
                {formatTime(Math.max(0, timeLeft))}
              </span>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4">
              <div className="text-red-800 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>{error}</div>
            </div>
          )}

          {/* Question Card */}
          <div 
            className="mb-8"
            style={{
              width: '100%',
              maxWidth: '727px',
              height: cardHeight,
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

            {/* Options Container */}
            <div className="p-6 space-y-4">
              {hasSubmitted ? (
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
                    Waiting for other students...
                  </div>
                </div>
              ) : (
                // Show options for answering
                questionData?.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-center">
                    <div
                      className="flex items-center cursor-pointer"
                      style={{
                        width: '100%',
                        maxWidth: '678px',
                        height: '55px',
                        background: '#F6F6F6',
                        border: selectedOption === index ? '1.5px solid #8F64E1' : '1.5px solid transparent',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                        padding: '0 16px'
                      }}
                      onClick={() => !isSubmitting && setSelectedOption(index)}
                    >
                      {/* Option Number Circle */}
                      <div
                        className="flex items-center justify-center mr-3 flex-shrink-0"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: selectedOption === index ? '#8F64E1' : '#8D8D8D',
                          background: selectedOption === index ? 'linear-gradient(135deg, #8F64E1 0%, #4E377B 100%)' : '#8D8D8D',
                          color: '#FFFFFF',
                          fontFamily: 'Sora, sans-serif',
                          fontSize: '11px',
                          fontWeight: 400
                        }}
                      >
                        {index + 1}
                      </div>
                      
                      {/* Option Text */}
                      <span
                        className="truncate"
                        style={{
                          fontFamily: 'Sora, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#000000'
                        }}
                      >
                        {option}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          {!hasSubmitted && timeLeft > 0 && (
            <div className="flex justify-end">
              <button
                className="text-white font-semibold flex items-center justify-center"
                onClick={submitAnswer}
                disabled={selectedOption === null || timeLeft <= 0 || isSubmitting}
                style={{
                  width: '233.93px',
                  height: '57.58px',
                  background: selectedOption !== null && !isSubmitting
                    ? 'linear-gradient(135deg, #8F64E1 0%, #1D68BD 100%)'
                    : '#CCCCCC',
                  borderRadius: '34px',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: selectedOption !== null && !isSubmitting ? 'pointer' : 'not-allowed'
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        
        * {
          font-family: 'Sora', sans-serif !important;
        }
      `}</style>
    </div>
  );
}