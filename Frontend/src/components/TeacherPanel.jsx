import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const socket = io("http://localhost:5001");

const TeacherPanel = () => {
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [options, setOptions] = useState([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [pollResults, setPollResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    socket.on("updateResults", (poll) => setPollResults(poll.results));
    socket.on("questionEnded", (poll) => {
      setPollResults(poll.results);
      setTimeLeft(0);
      alert("Question ended!");
    });
    socket.on("questionStarted", ({ timeLimit }) => setTimeLeft(timeLimit));

    return () => {
      socket.off("updateResults");
      socket.off("questionEnded");
      socket.off("questionStarted");
    };
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const addOption = () => {
    const newOption = {
      id: String(options.length + 1),
      text: "",
      isCorrect: false
    };
    setOptions([...options, newOption]);
  };

  const updateOption = (id, text) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const updateCorrectAnswer = (id, isCorrect) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, isCorrect } : opt));
  };

  const askQuestion = () => {
    const pollOptions = options
      .filter(opt => opt.text.trim() !== "")
      .map(opt => opt.text);

    if (!question.trim() || pollOptions.length < 2) {
      return alert("Please enter a question and at least 2 options");
    }

    socket.emit("newQuestion", {
      question,
      options: pollOptions,
      timeLimit: parseInt(timeLimit),
    });

    setPollResults(null);
    setQuestion("");
    setOptions([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
    ]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Badge className="bg-poll-badge text-poll-badge-foreground px-4 py-2 rounded-full font-medium mb-8">
          📊 Intervue Poll
        </Badge>

        {/* Question Input */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Enter your question</Label>
            <Select value={timeLimit} onValueChange={setTimeLimit}>
              <SelectTrigger className="w-36 bg-poll-input-bg border-0 flex items-center justify-between px-2">
  <SelectValue />
  <span className="text-muted-foreground ml-2">seconds</span>
</SelectTrigger>
              <SelectContent className="mr-5">
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="90">90</SelectItem>
                <SelectItem value="120">120</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="bg-poll-input-bg border-0 text-lg py-4 px-4 rounded-lg min-h-[100px]"
          />
        </div>

        {/* Options */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-6">Edit Options</h3>
          <div className="space-y-4">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  {idx + 1}
                </div>
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-poll-option-bg border-0 py-3 px-4 rounded-lg"
                />
                <RadioGroup
                  value={opt.isCorrect ? "yes" : "no"}
                  onValueChange={(val) => updateCorrectAnswer(opt.id, val === "yes")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`yes-${opt.id}`} />
                    <Label htmlFor={`yes-${opt.id}`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`no-${opt.id}`} />
                    <Label htmlFor={`no-${opt.id}`}>No</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addOption}
            className="mt-6 border-dashed border-2 bg-transparent hover:bg-purple-50 text-primary border-primary/30 hover:border-primary/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add More option
          </Button>
        </div>

        {/* Ask Question */}
        <div className="flex justify-end items-center gap-4">
          {timeLeft > 0 && <span className="text-red-500 font-bold">Time Left: {timeLeft}s</span>}
          <Button size="lg" onClick={askQuestion}>
            Ask Question
          </Button>
        </div>

        {/* Live Results */}
        {pollResults && (
          <div className="mt-8 bg-card p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Live Results</h3>
            <ul className="list-disc pl-5">
              {Object.entries(pollResults).map(([opt, count]) => (
                <li key={opt}>
                  {opt}: {count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPanel;
