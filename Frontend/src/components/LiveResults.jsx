import React from "react";
import { Button } from "@/components/ui/button";

const LiveResults = ({ results, question, onNewQuestion, onViewHistory }) => {
  const getTotalResponses = () => {
    return Object.values(results).reduce((sum, count) => sum + count, 0);
  };

  const getPercentage = (count) => {
    const total = getTotalResponses();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-white p-6 relative">
      {/* View Poll History Button - Fixed Top Right */}
      <div className="absolute top-6 right-6">
        <Button 
          onClick={onViewHistory}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2"
        >
          <span>👁</span> View Poll History
        </Button>
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center min-h-screen max-w-2xl mx-auto">
        {/* Question Section */}
        <div className="w-full space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 text-left">Question</h2>
          
          {/* Question Card */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Question Header */}
            <div className="bg-gray-600 text-white p-4">
              <p className="text-sm font-medium">{question}</p>
            </div>
            
            {/* Results */}
            <div className="bg-white p-4 space-y-3">
              {Object.entries(results).map(([option, count], idx) => {
                const percentage = getPercentage(count);
                
                return (
                  <div key={option} className="flex items-center">
                    {/* Progress Bar */}
                    <div 
                      className="bg-purple-600 text-white flex items-center px-3 py-2 rounded-sm min-h-[40px]"
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

        {/* Ask New Question Button - Positioned to the right below card */}
        <div className="w-full flex justify-end mt-6">
          <Button 
            onClick={onNewQuestion}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-sm"
          >
            + Ask a new question
          </Button>
        </div>
      </div>

      {/* Chat Icon */}
      <div className="fixed bottom-6 right-6">
        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-purple-700 transition-colors">
          💬
        </div>
      </div>
    </div>
  );
};

export default LiveResults;