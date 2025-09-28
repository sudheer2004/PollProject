import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QuestionForm = ({ 
  question, 
  setQuestion, 
  timeLimit, 
  setTimeLimit, 
  options, 
  setOptions, 
  onAskQuestion, 
  isConnected 
}) => {
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

  const canSubmit = () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.filter((opt) => opt.text.trim());
    return trimmedQuestion && validOptions.length >= 2 && isConnected;
  };

  return (
    <div className="space-y-8">
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
            className="w-full bg-gray-100 border-0 text-base py-4 px-4 rounded-lg min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={100}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            0/100
          </div>
        </div>
      </div>

      {/* Options Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">Edit Options</h3>
          <h3 className="text-base font-medium text-gray-900">Is it Correct?</h3>
        </div>

        <div className="space-y-3">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-4">
              {/* Option Number */}
              <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {idx + 1}
              </div>
              
              {/* Option Input */}
              <Input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder="Rahul Bajaj"
                className="flex-1 bg-gray-100 border-0 h-10 rounded-lg text-sm"
              />
              
              {/* Correct Answer Radio Buttons */}
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`yes-${opt.id}`}
                    name={`correct-${opt.id}`}
                    checked={opt.isCorrect}
                    onChange={() => updateCorrectAnswer(opt.id, true)}
                    className="w-4 h-4 text-purple-600 accent-purple-600"
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
                    className="w-4 h-4 text-gray-600 accent-gray-400"
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
          className="border-dashed border-2 text-purple-600 border-purple-300 hover:bg-purple-50 rounded-lg h-10 text-sm"
        >
          + Add More option
        </Button>
      </div>

      {/* Ask Question Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={onAskQuestion}
          disabled={!canSubmit()}
          className="bg-purple-600 hover:bg-purple-700 px-8 py-2.5 text-sm rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ask Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionForm;