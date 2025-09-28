import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TeacherPanel from "./components/TeacherPanel";
import StudentPanel from "./components/StudentPanel";

export default function App() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleConfirmed, setRoleConfirmed] = useState(false);

  // Reset function to go back to role selection
  const resetToRoleSelection = () => {
    setSelectedRole(null);
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

  // Role selection page
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Header Badge */}
        <div className="flex justify-center">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Interview Poll
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to the{" "}
            <span className="text-purple-600">Live Polling System</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Please select the role that best describes you to begin using the
            live polling system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Student Card */}
          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
              selectedRole === "student"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20 shadow-lg"
                : "border-border hover:border-purple-300 hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">S</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                I'm a Student
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Participate in live polls, submit answers in real-time, and see
              how your responses compare with classmates.
            </p>

            {selectedRole === "student" && (
              <div className="mt-3 text-purple-600 text-sm font-medium">
                ✓ Selected
              </div>
            )}
          </div>

          {/* Teacher Card */}
          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
              selectedRole === "teacher"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20 shadow-lg"
                : "border-border hover:border-purple-300 hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("teacher")}
          >
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold text-sm">T</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                I'm a Teacher
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Create engaging questions, manage polls, and view live results as
              students respond in real-time.
            </p>

            {selectedRole === "teacher" && (
              <div className="mt-3 text-purple-600 text-sm font-medium">
                ✓ Selected
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8">
          <Button
            className={`px-12 py-3 text-base transition-all duration-200 ${
              selectedRole
                ? "bg-purple-600 hover:bg-purple-700 transform hover:scale-105"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={!selectedRole}
            onClick={() => setRoleConfirmed(true)}
          >
            {selectedRole
              ? `Continue as ${selectedRole}`
              : "Select a role to continue"}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-muted-foreground text-sm">
          <p>You can switch roles anytime by returning to this page</p>
        </div>
      </div>
    </div>
  );
}
