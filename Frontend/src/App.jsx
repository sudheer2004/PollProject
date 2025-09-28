import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TeacherPanel from "./components/TeacherPanel";
import StudentPanel from "./components/StudentPanel";

export default function App() {
  const [selectedRole, setSelectedRole] = useState("");
  const [roleConfirmed, setRoleConfirmed] = useState(false);

  // Handle role selection from landing page
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setRoleConfirmed(true);
  };

  // Reset function to go back to role selection
  const resetToRoleSelection = () => {
    setSelectedRole("");
    setRoleConfirmed(false);
  };

  // Render panel after role is confirmed
  if (roleConfirmed && selectedRole) {
    return (
      <div className="min-h-screen">
        {/* Back button for returning to role selection */}
        <div className="fixed top-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToRoleSelection}
            className="bg-white shadow-md hover:bg-gray-50"
          >
            ← Back to Role Selection
          </Button>
        </div>

        {selectedRole === "teacher" ? <TeacherPanel /> : <StudentPanel />}
      </div>
    );
  }

  // Landing page with Figma design
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto text-center space-y-6">
        {/* Top Badge */}
        <div className="flex justify-center">
          <div 
            className="px-6 py-2 text-white font-medium text-sm rounded-3xl"
            style={{ 
              background: "linear-gradient(135deg, #7565D9 0%, #4D0ACD 100%)",
              borderRadius: "24px"
            }}
          >
            ⚡ Intervue Poll
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl font-normal leading-tight">
            <span className="text-gray-800">Welcome to the</span> <span className="text-black font-medium">Live Polling System</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="flex justify-center gap-8">
          {/* Student Card */}
          <div
            onClick={() => setSelectedRole("student")}
            className={`w-96 h-36 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === "student"
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 bg-white"
            }`}
            style={{ width: "387px", height: "143px" }}
          >
            <div className="text-left h-full flex flex-col justify-center">
              <h3 className="text-xl font-medium text-black mb-2">I'm a Student</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry
              </p>
            </div>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => setSelectedRole("teacher")}
            className={`w-96 h-36 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === "teacher"
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 bg-white"
            }`}
            style={{ width: "387px", height: "143px" }}
          >
            <div className="text-left h-full flex flex-col justify-center">
              <h3 className="text-xl font-medium text-black mb-2">I'm a Teacher</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Submit answers and view live poll results in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => selectedRole && handleRoleSelect(selectedRole)}
            className="text-white font-medium text-base px-12 py-4 transition-all duration-200 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8F64E1 0%, #1D68BD 100%)",
              borderRadius: "34px",
              width: "234px",
              height: "58px"
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}