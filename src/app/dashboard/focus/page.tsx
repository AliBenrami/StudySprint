"use client";

import { Card } from "@/app/components/ui/card";

export default function FocusPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Focus Timer</h1>
        <p className="text-gray-600 mt-2">
          Stay focused during your study sessions
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600 mb-4">
            The focus timer feature is currently under development. You'll be
            able to track your focus time during study sessions soon!
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </Card>
    </div>
  );
}
