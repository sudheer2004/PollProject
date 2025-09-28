import React from "react";

// Reusable Option Component
const OptionComponent = ({ optionNumber, optionText, isCorrect, onTextChange, onCorrectChange }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      {/* Option Input */}
      <div className="flex items-center">
        {/* Option Number Circle */}
        <div 
          className="flex items-center justify-center text-white font-semibold mr-4"
          style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #8F64E1 0%, #4E377B 100%)',
            borderRadius: '50%',
            fontSize: '12px'
          }}
        >
          {optionNumber}
        </div>
        
        {/* Option Text Input */}
        <input
          type="text"
          value={optionText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Rahul Bajaj"
          className="px-4 py-4 outline-none"
          style={{
            width: '507px',
            height: '60px',
            backgroundColor: '#F2F2F2',
            borderRadius: '2px',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            color: '#000'
          }}
        />
      </div>

      {/* Correct Answer Selector */}
      <div className="flex items-center space-x-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={`correct-${optionNumber}`}
            checked={isCorrect}
            onChange={() => onCorrectChange(true)}
            className="sr-only"
          />
          <div 
            className="relative flex items-center justify-center mr-2"
            style={{ width: '22px', height: '22px' }}
          >
            {/* Outer circle */}
            <div 
              className="absolute w-full h-full rounded-full border"
              style={{
                borderWidth: '2px',
                borderColor: '#8F64E1',
                backgroundColor: 'white'
              }}
            ></div>
            {/* Inner filled circle when selected */}
            {isCorrect && (
              <div 
                className="absolute rounded-full"
                style={{
                  width: '13px',
                  height: '13px',
                  backgroundColor: '#8F64E1'
                }}
              ></div>
            )}
          </div>
          <span 
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: '17px',
              color: '#000'
            }}
          >
            Yes
          </span>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={`correct-${optionNumber}`}
            checked={!isCorrect}
            onChange={() => onCorrectChange(false)}
            className="sr-only"
          />
          <div 
            className="relative flex items-center justify-center mr-2"
            style={{ width: '22px', height: '22px' }}
          >
            {/* Outer circle */}
            <div 
              className="absolute w-full h-full rounded-full border"
              style={{
                borderWidth: '2px',
                borderColor: '#8F64E1',
                backgroundColor: 'white'
              }}
            ></div>
            {/* Inner filled circle when selected */}
            {!isCorrect && (
              <div 
                className="absolute rounded-full"
                style={{
                  width: '13px',
                  height: '13px',
                  backgroundColor: '#8F64E1'
                }}
              ></div>
            )}
          </div>
          <span 
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: '17px',
              color: '#000'
            }}
          >
            No
          </span>
        </label>
      </div>
    </div>
  );
};

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
    setOptions([...options, { 
      id: String(Date.now()), 
      text: "", 
      isCorrect: false 
    }]);
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
    <div className="w-full max-w-4xl mx-auto p-6 bg-white">
      {/* Header Button */}
      <div 
        className="inline-flex items-center px-6 py-2 text-white font-medium text-sm rounded-3xl mb-4"
        style={{
          background: "linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)",
          borderRadius: "24px"
        }}
      >
        ⚡ Intervue Poll
      </div>

      {/* Title */}
      <h1 
        className="mb-2"
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '40px',
          color: '#000'
        }}
      >
        <span style={{ fontWeight: 400 }}>Let's</span>{' '}
        <span style={{ fontWeight: 600 }}>Get Started</span>
      </h1>

      {/* Subtitle */}
      <p 
        className="mb-6"
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 400,
          fontSize: '19px',
          color: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
      </p>

      {/* Question Input Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label 
            className="block"
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: '20px',
              color: '#000'
            }}
          >
            Enter your question
          </label>
          
          {/* Time Selector */}
          <div 
            className="flex items-center px-4 py-2 relative"
            style={{
              width: '170px',
              height: '43px',
              backgroundColor: '#F1F1F1',
              borderRadius: '8px'
            }}
          >
            <select 
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="bg-transparent outline-none flex-1 appearance-none pr-1"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 400,
                fontSize: '18px',
                color: '#000'
              }}
            >
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">120 seconds</option>
            </select>
            {/* Custom dropdown arrow */}
            <div 
              className="absolute right-1 pointer-events-none"
              style={{
                width: '24px',
                height: '22px'
              }}
            >
              <svg 
                viewBox="0 0 24 22" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path 
                  d="M4 6L12 18L20 6H4Z" 
                  fill="#480FB3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Question Text Area */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Rahul Bajaj"
          className="w-full p-6 border-none outline-none resize-none"
          maxLength={100}
          style={{
            width: '865px',
            height: '174px',
            backgroundColor: '#F2F2F2',
            borderRadius: '2px',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 400,
            fontSize: '18px',
            color: '#000'
          }}
        />
      </div>

      {/* Options Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              color: '#000'
            }}
          >
            Edit Options
          </h3>
          
          <h3 
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              color: '#000',
              marginRight: '19px'
            }}
          >
            Is it Correct?
          </h3>
        </div>

        {/* Options List - Using Reusable Component */}
        {options.map((option, index) => (
          <OptionComponent
            key={option.id}
            optionNumber={index + 1}
            optionText={option.text}
            isCorrect={option.isCorrect}
            onTextChange={(text) => updateOption(option.id, text)}
            onCorrectChange={(isCorrect) => updateCorrectAnswer(option.id, isCorrect)}
          />
        ))}

        {/* Add More Option Button */}
        <button
          onClick={addOption}
          className="px-4 py-2 border-2 bg-transparent"
          style={{
            borderColor: '#7451B6',
            borderRadius: '11px',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 500,
            fontSize: '16px',
            color: '#7451B6'
          }}
        >
          + Add More option
        </button>
      </div>

      {/* Separator Line */}
      <div 
        className="w-full mb-6"
        style={{
          height: '1px',
          backgroundColor: '#B6B6B6',
          width: '1440.01px',
          marginLeft: '-6px'
        }}
      ></div>

      {/* Ask Question Button */}
      <div className="flex justify-end">
        <button
          onClick={onAskQuestion}
          disabled={!canSubmit()}
          className="text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            width: '233.93px',
            height: '57.78px',
            background: canSubmit() 
              ? 'linear-gradient(135deg, #8F64E1 0%, #1D68BD 100%)'
              : 'rgba(143, 100, 225, 0.5)',
            borderRadius: '34px',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
            fontSize: '18px',
            color: '#FFFFFF',
            border: 'none',
            cursor: canSubmit() ? 'pointer' : 'not-allowed'
          }}
        >
          Ask Question
        </button>
      </div>

      {/* Add Sora Font */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
      `}</style>
    </div>
  );
};

export default QuestionForm;