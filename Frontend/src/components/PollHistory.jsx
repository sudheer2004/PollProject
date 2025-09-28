import React from "react";
import { Button } from "@/components/ui/button";

const PollHistory = ({ history, onBack }) => {
  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const getTotalResponses = (results) => {
    return Object.values(results || {}).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Poll History</h1>
          <Button 
            onClick={onBack}
            variant="outline" 
            className="rounded-full px-6"
          >
            ← Back
          </Button>
        </div>

        {/* History Content */}
        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-xl">📊</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Poll History</h3>
            <p className="text-gray-500">You haven't created any polls yet. Start by asking your first question!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {history.map((poll, pollIdx) => (
              <div key={poll._id || pollIdx} className="space-y-4">
                {/* Question Number */}
                <h2 className="text-xl font-semibold text-gray-900">
                  Question {pollIdx + 1}
                </h2>
                
                {/* Question Card */}
                <div className="border border-gray-300 rounded-lg overflow-hidden max-w-2xl">
                  {/* Question Header */}
                  <div className="bg-gray-600 text-white p-4">
                    <p className="text-sm font-medium">{poll.question}</p>
                  </div>
                  
                  {/* Results */}
                  <div className="bg-white p-4 space-y-3">
                    {Object.entries(poll.results || {}).map(([option, count], idx) => {
                      const total = getTotalResponses(poll.results);
                      const percentage = getPercentage(count, total);
                      
                      return (
                        <div key={option} className="flex items-center">
                          {/* Progress Bar */}
                          <div 
                            className="bg-purple-600 text-white flex items-center px-3 py-2 rounded-md min-h-[40px] relative"
                            style={{ width: `${Math.max(percentage, 15)}%` }}
                          >
                            {/* Option Number Circle */}
                            <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                              <span className="text-white text-xs font-semibold">{idx + 1}</span>
                            </div>
                            
                            {/* Option Text */}
                            <span className="text-sm font-medium text-white truncate flex-1">
                              {option}
                            </span>
                          </div>
                          
                          {/* Percentage Display */}
                          <div className="flex-1 bg-gray-100 h-10 flex items-center justify-end px-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Poll Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>Total Responses: {getTotalResponses(poll.results)}</span>
                  <span>Time Limit: {poll.timeLimit}s</span>
                  {poll.createdAt && (
                    <span>
                      Created: {new Date(poll.createdAt).toLocaleDateString()} at{" "}
                      {new Date(poll.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollHistory;