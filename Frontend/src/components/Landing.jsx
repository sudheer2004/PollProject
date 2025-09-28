import React, { useState } from "react";

const PollResultsComponent = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  const pollData = {
    question: "Which planet is known as the Red Planet?",
    options: [
      { text: "Mars", percentage: 75, number: 1 },
      { text: "Venus", percentage: 5, number: 2 },
      { text: "Jupiter", percentage: 5, number: 3 },
      { text: "Saturn", percentage: 15, number: 4 }
    ]
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* View Poll History Button */}
      <div className="w-full flex justify-end mb-4 sm:mb-6 lg:mb-8">
        <button
          className="text-white font-medium flex items-center justify-center gap-2"
          style={{
            width: '267px',
            height: '53px',
            background: '#8F64E1',
            borderRadius: '34px',
            fontFamily: 'Sora, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="white"/>
          </svg>
          View Poll history
        </button>
      </div>

      {/* Main Content Container - Vertically Centered */}
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex flex-col items-end" style={{ width: '727px' }}>
          {/* Question Label */}
          <div className="mb-6 self-start">
            <h2 
              className="text-left"
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: '22px',
                color: '#000000'
              }}
            >
              Question
            </h2>
          </div>

          {/* Question Card */}
          <div 
            className="mb-8"
            style={{
              width: '727px',
              height: '353px',
              border: '1px solid #AF8FF1',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* Question Header */}
            <div
              className="flex items-center px-4"
              style={{
                width: '727px',
                height: '50px',
                background: 'linear-gradient(135deg, #343434 0%, #6E6E6E 100%)',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: '17px',
                color: 'white'
              }}
            >
              {pollData.question}
            </div>

            {/* Options Container */}
            <div className="p-6 space-y-4">
              {pollData.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  {/* Option Bar with Border */}
                  <div
                    className="flex items-center relative"
                    style={{
                      width: '687px',
                      height: '55px',
                      cursor: 'pointer',
                      border: selectedOption === index ? '1.5px solid #8F64E1' : '1.5px solid transparent',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => setSelectedOption(index)}
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

          {/* Ask New Question Button */}
          <div>
            <button
              className="text-white font-semibold flex items-center justify-center"
              style={{
                width: '306px',
                height: '58px',
                background: 'linear-gradient(135deg, #8F64E1 0%, #1D68BD 100%)',
                borderRadius: '34px',
                fontFamily: 'Sora, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              + Ask a new question
            </button>
          </div>
        </div>
      </div>

      {/* Add Sora Font */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@100;200;300;400;500;600;700;800@display=swap');
        
        * {
          font-family: 'Sora', sans-serif !important;
        }
      `}</style>
    </div>
  );
};

export default PollResultsComponent;