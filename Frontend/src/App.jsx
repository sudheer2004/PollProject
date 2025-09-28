import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TeacherPanel from "./components/TeacherPanel";
import StudentPanel from "./components/StudentPanel";

export default function App() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleConfirmed, setRoleConfirmed] = useState(false);

  // Render panel after role is confirmed
  if (roleConfirmed) {
    if (!selectedRole) return null; // safety fallback
    return selectedRole === "teacher" ? <TeacherPanel /> : <StudentPanel />;
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
            Welcome to the <span className="text-purple-600">Live Polling System</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Student Card */}
          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedRole === "student"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20"
                : "border-border hover:border-purple-300"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <h3 className="text-xl font-semibold text-foreground mb-3">
              I'm a Student
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Participate in live polls and submit answers in real-time.
            </p>
          </div>

          {/* Teacher Card */}
          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedRole === "teacher"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20"
                : "border-border hover:border-purple-300"
            }`}
            onClick={() => setSelectedRole("teacher")}
          >
            <h3 className="text-xl font-semibold text-foreground mb-3">
              I'm a Teacher
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Create questions and view live poll results in real-time.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-8">
          <Button
            className="px-12 py-3 text-base bg-purple-600 hover:bg-purple-700"
            disabled={!selectedRole}
            onClick={() => setRoleConfirmed(true)}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
