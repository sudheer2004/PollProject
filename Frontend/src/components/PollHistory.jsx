import React from "react";

const PollHistory = ({ history = [], onBack }) => {
  // Sample history data if none provided
  const sampleHistory = [
    {
      _id: "1",
      question: "Which planet is known as the Red Planet?",
      results: {
        Mars: 75,
        Venus: 5,
        Jupiter: 5,
        Saturn: 15
      },
      timeLimit: 30,
      createdAt: new Date().toISOString()
    },
    {
      _id: "2", 
      question: "What is the capital of France?",
      results: {
        Paris: 85,
        London: 8,
        Berlin: 4,
        Madrid: 3
      },
      timeLimit: 20,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const pollHistory = history.length > 0 ? history : sampleHistory;

  const getTotalResponses = (results) => {
    return Object.values(results || {}).reduce((sum, count) => sum + count, 0);
  };

  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const convertResultsToOptions = (results) => {
    const total = getTotalResponses(results);
    return Object.entries(results || {}).map(([text, count], index) => ({
      text,
      percentage: getPercentage(count, total),
      number: index + 1
    }));
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* Back Button - Stays at top */}
      <div className="w-full flex justify-end mb-4 sm:mb-6 lg:mb-8">
        <button
          onClick={onBack}
          className="text-white font-medium flex items-center justify-center gap-2"
          style={{
            width: '120px',
            height: '45px',
            background: '#8F64E1',
            borderRadius: '34px',
            fontFamily: 'Sora, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>
      {/* Header */}
      <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8" style={{ marginTop: '40px' }}>
        <div className="flex items-center justify-between" style={{ width: '727px' }}>
          <div>
            <span 
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '40px',
                fontWeight: 400,
                color: '#000000'
              }}
            >
              View{" "}
            </span>
            <span 
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: '40px',
                fontWeight: 600,
                color: '#000000'
              }}
            >
              Poll History
            </span>
          </div>
        </div>
      </div>

      {/* History Content */}
      <div className="max-w-4xl mx-auto">
        {pollHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📊</span>
            </div>
            <h3 
              className="text-xl font-medium mb-2"
              style={{
                fontFamily: 'Sora, sans-serif',
                color: '#000000'
              }}
            >
              No Poll History
            </h3>
            <p 
              style={{
                fontFamily: 'Sora, sans-serif',
                color: '#666666'
              }}
            >
              You haven't created any polls yet. Start by asking your first question!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {pollHistory.map((poll, pollIdx) => {
              const options = convertResultsToOptions(poll.results);
              
              return (
                <div key={poll._id || pollIdx} className="flex justify-center">
                  <div className="flex flex-col" style={{ width: '727px' }}>
                    {/* Question Number */}
                    <div className="mb-6">
                      <h2 
                        className="text-left"
                        style={{
                          fontFamily: 'Sora, sans-serif',
                          fontWeight: 600,
                          fontSize: '22px',
                          color: '#000000'
                        }}
                      >
                        Question {pollIdx + 1}
                      </h2>
                    </div>

                    {/* Question Card - Responsive height based on options */}
                    <div 
                      style={{
                        width: '727px',
                        minHeight: '200px',
                        height: 'auto',
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
                        {poll.question}
                      </div>

                      {/* Options Container */}
                      <div className="p-6 space-y-4">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center">
                            {/* Option Bar */}
                            <div
                              className="flex items-center relative"
                              style={{
                                width: '687px',
                                height: '55px'
                              }}
                            >
                              {/* Progress Fill */}
                              <div
                                className="flex items-center px-4"
                                style={{
                                  width: `${Math.max(option.percentage, 25)}%`,
                                  height: '55px',
                                  background: '#6766D5',
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default PollHistory;