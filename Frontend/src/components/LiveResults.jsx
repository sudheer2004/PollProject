import React from 'react';
import { Check } from 'lucide-react';

const LiveResults = ({ results, question, correctAnswer, totalResponses }) => {
  const getPercentage = (count) => {
    return totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Question</h3>
      
      {/* Question Display */}
      <div className="bg-gray-700 text-white rounded-lg p-4 mb-6">
        <p className="text-base">{question}</p>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {Object.entries(results).map(([option, count]) => {
          const percentage = getPercentage(count);
          const isCorrect = correctAnswer === option;

          return (
            <div
              key={option}
              className="flex items-center gap-3"
            >
              {/* Option Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCorrect ? 'bg-purple-600' : 'bg-purple-600'
              }`}>
                {isCorrect ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {Object.keys(results).indexOf(option) + 1}
                  </span>
                )}
              </div>

              {/* Option Text */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-gray-900 font-medium min-w-20">{option}</span>
                
                {/* Progress Bar */}
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCorrect ? 'bg-purple-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Percentage */}
                <span className="text-gray-900 font-semibold min-w-12 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveResults;