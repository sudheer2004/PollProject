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

// LiveResults Component - matches Image 1 exactly
const LiveResults = ({ results, question, onNewQuestion, onViewHistory, timerEnded }) => {
  const getTotalResponses = () => {
    return Object.values(results).reduce((sum, count) => sum + count, 0);
  };

  const getPercentage = (count) => {
    const total = getTotalResponses();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* View Poll History Button - Top Right */}
        <div className="absolute top-6 right-6">
          <Button 
            onClick={onViewHistory}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm"
          >
            👁 View Poll History
          </Button>
        </div>

        {/* Question Section - Centered */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Question</h3>
          
          {/* Question Card */}
          <div className="border border-gray-300 rounded-lg overflow-hidden mx-auto max-w-lg">
            {/* Question Header */}
            <div className="bg-gray-600 text-white p-4">
              <p className="text-sm">{question}</p>
            </div>
            
            {/* Results */}
            <div className="bg-white p-4 space-y-3">
              {Object.entries(results).map(([option, count], idx) => {
                const percentage = getPercentage(count);
                
                return (
                  <div key={option} className="flex items-center">
                    {/* Progress Bar */}
                    <div 
                      className="bg-purple-600 text-white flex items-center px-3 py-2 rounded-md min-h-[40px]"
                      style={{ width: `${Math.max(percentage, 15)}%` }}
                    >
                      <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{idx + 1}</span>
                      </div>
                     <span className="text-sm font-medium text-white">{option}</span>
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

          {/* Ask New Question Button - Centered Below */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={onNewQuestion}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full"
            >
              + Ask a new question
            </Button>
          </div>
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
};

// Poll History Modal - matches Image 5
const PollHistoryModal = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto p-8 m-4 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">View Poll History</h2>
          <Button onClick={onClose} variant="outline" className="rounded-full">×</Button>
        </div>
        
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No previous polls found.</p>
        ) : (
          <div className="space-y-8">
            {history.map((poll, pollIdx) => (
              <div key={poll._id || pollIdx} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Question {pollIdx + 1}</h3>
                
                {/* Question Card */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {/* Question Header */}
                  <div className="bg-gray-600 text-white p-4">
                    <p className="text-sm">{poll.question}</p>
                  </div>
                  
                  {/* Results */}
                  <div className="bg-white p-4 space-y-3">
                    {Object.entries(poll.results || {}).map(([option, count], idx) => {
                      const total = Object.values(poll.results || {}).reduce((sum, c) => sum + c, 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      
                      return (
                        <div key={option} className="flex items-center">
                          {/* Progress Bar */}
                          <div 
                            className="bg-purple-600 text-white flex items-center px-3 py-2 rounded-md min-h-[40px]"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TeacherPanel = () => {
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [options, setOptions] = useState([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [pollResults, setPollResults] = useState(null);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false);
  const [pollHistory, setPollHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
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
      setShowResults(true);
    });

    socket.on("pollEnded", () => {
      setTimerEnded(true);
    });

    socket.on("pollHistory", (history) => {
      setPollHistory(history);
    });

    return () => socket.disconnect();
  }, []);

  const addOption = () => {
    setOptions([...options, { id: String(Date.now()), text: "", isCorrect: false }]);
  };

  const removeOption = (id) => {
    if (options.length <= 2) return;
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOption = (id, text) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const updateCorrectAnswer = (id, isCorrect) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id ? isCorrect : false,
      }))
    );
  };

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
  };

  const handleViewHistory = () => {
    socketRef.current.emit("getPollHistory");
    setShowHistory(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {showResults ? (
        <LiveResults
          results={pollResults || {}}
          question={currentPoll?.question}
          onNewQuestion={handleNewQuestion}
          onViewHistory={handleViewHistory}
          timerEnded={timerEnded}
        />
      ) : (
        <div className="p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header Badge */}
            <div className="flex justify-start">
              <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                Intervue Poll
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's Get Started</h1>
              <p className="text-gray-600 text-base">
                you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
              </p>
            </div>

            {/* Question Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-900">
                  Enter your question
                </label>
                <Select value={timeLimit} onValueChange={setTimeLimit}>
                  <SelectTrigger className="w-32 bg-white border border-gray-300 rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="90">90 seconds</SelectItem>
                    <SelectItem value="120">120 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Rahul Bajaj"
                  className="w-full bg-gray-100 border-0 text-base py-4 px-4 rounded-lg min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  0/100
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">Edit Options</h3>
                <h3 className="text-base font-medium text-gray-900">Is it Correct?</h3>
              </div>

              <div className="space-y-4">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-4">
                    {/* Option Number */}
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    
                    {/* Option Input */}
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, e.target.value)}
                      placeholder="Rahul Bajaj"
                      className="flex-1 bg-gray-100 border-0 h-12 rounded-lg"
                    />
                    
                    {/* Correct Answer Radio Buttons */}
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`yes-${opt.id}`}
                          name={`correct-${opt.id}`}
                          checked={opt.isCorrect}
                          onChange={() => updateCorrectAnswer(opt.id, true)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <Label htmlFor={`yes-${opt.id}`} className="text-sm text-gray-700">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`no-${opt.id}`}
                          name={`correct-${opt.id}`}
                          checked={!opt.isCorrect}
                          onChange={() => updateCorrectAnswer(opt.id, false)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <Label htmlFor={`no-${opt.id}`} className="text-sm text-gray-700">
                          No
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Option Button */}
              <Button
                variant="outline"
                onClick={addOption}
                className="border-dashed border-2 text-purple-600 border-purple-300 hover:bg-purple-50 rounded-lg"
              >
                + Add More option
              </Button>
            </div>

            {/* Ask Question Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={askQuestion}
                disabled={!isConnected || !question.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-base rounded-full"
              >
                Ask Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Poll History Modal */}
      <PollHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={pollHistory}
      />
    </div>
  );
};

export default TeacherPanel;