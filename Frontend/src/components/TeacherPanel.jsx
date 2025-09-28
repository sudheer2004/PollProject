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
import { Plus, Users, Trash2, Wifi, WifiOff } from "lucide-react";

// LiveResults Component
const LiveResults = ({ results, question, onNewQuestion }) => {
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

      <div className="mt-6 text-center">
        <Button 
          onClick={onNewQuestion}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-6 rounded-full text-base"
        >
          + Ask a new question
        </Button>
      </div>
    </div>
  );
};

// PollClient for real-time polling
class PollClient {
  constructor(baseUrl) {
    this.socket = io(baseUrl);
    this.events = {};

    this.socket.on("connect", () => this.trigger("connect"));
    this.socket.on("disconnect", (reason) => this.trigger("disconnect", reason));
    this.socket.on("pollResults", (data) => this.trigger("pollResults", data));
    this.socket.on("connectedStudents", (count) => this.trigger("connectedStudents", count));
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  trigger(event, data) {
    if (this.events[event]) this.events[event].forEach((cb) => cb(data));
  }

  createPoll(pollData) {
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
  const [connectedStudents, setConnectedStudents] = useState(0);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [showResults, setShowResults] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    const pollClient = new PollClient("http://localhost:5001");
    clientRef.current = pollClient;

    pollClient.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
    });

    pollClient.on("disconnect", (reason) => {
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    });

    pollClient.on("pollResults", (results) => {
      setPollResults(results);
      setShowResults(true);
    });

    pollClient.on("connectedStudents", (count) => {
      setConnectedStudents(count);
    });

    return () => pollClient.disconnect();
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

  const updateCorrectAnswer = (id) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
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

    clientRef.current.createPoll(pollPayload);
    setCurrentPoll(pollPayload);
    setShowResults(true);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Badge className="bg-purple-600 text-white px-4 py-2 rounded-full">
            Intervue Poll
          </Badge>
          <div className="flex items-center gap-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {isConnected ? <Wifi className="w-3 h-3 mr-2" /> : <WifiOff className="w-3 h-3 mr-2" />}
              {connectionStatus}
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">{connectedStudents}</span>
            </div>
          </div>
        </div>

        {showResults ? (
          <LiveResults
            results={pollResults || {}}
            question={currentPoll?.question}
            onNewQuestion={handleNewQuestion}
          />
        ) : (
          <>
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Let's Get Started</h1>
              <p className="text-gray-600 text-base">
                you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
              </p>
            </div>

            {/* Question Input Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-normal text-gray-900">
                  Enter your question
                </label>
                <Select value={timeLimit} onValueChange={setTimeLimit}>
                  <SelectTrigger className="w-36 bg-white border border-gray-300">
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

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Rahul Bajaj"
                className="w-full bg-gray-100 border-0 text-base py-4 px-4 rounded-lg min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={100}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {question.length}/100
              </div>
            </div>

            {/* Options Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-normal text-gray-900">Edit Options</h3>
                <h3 className="text-base font-normal text-gray-900">Is it Correct?</h3>
              </div>

              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, e.target.value)}
                      placeholder="Rahul Bajaj"
                      className="flex-1 bg-gray-100 border-0 h-12"
                    />
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
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addOption}
                className="mt-4 border-dashed border-2 text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More option
              </Button>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={askQuestion}
                disabled={!isConnected || !question.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-12 py-6 text-base rounded-full"
              >
                Ask Question
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;