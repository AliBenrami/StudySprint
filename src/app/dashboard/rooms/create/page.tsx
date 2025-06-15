"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { useRouter } from "next/navigation";
import { getUserId, supabase } from "@/app/lib/supabaseClient";

export default function CreateRoomPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");

  const createRoom = async () => {
    const { data, error } = await supabase
      .from("sprint_rooms")
      .insert({
        title: name,
        created_by: await getUserId(),
        is_active: true,
        subject: subject,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    router.push(`/dashboard/rooms/${data.id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoom();
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Create Study Room
        </h1>
        <p className="text-gray-600 mt-2">Set up your study session</p>
      </div>

      <Card className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              placeholder="e.g., Math Study Group"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
              placeholder="e.g., Calculus"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-800 text-base sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:py-2 rounded-lg transition-colors text-base sm:text-sm"
            >
              Create Room
            </button>
          </div>
        </form>
      </Card>

      {/* Quick Tips */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Duration Tips
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
              <div>
                <h3 className="font-medium text-gray-900">Short Sessions</h3>
                <p className="text-sm text-gray-500">
                  25-30 minutes for focused study bursts
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
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
              <div>
                <h3 className="font-medium text-gray-900">Medium Sessions</h3>
                <p className="text-sm text-gray-500">
                  45-60 minutes for deeper study
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"
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
              <div>
                <h3 className="font-medium text-gray-900">Long Sessions</h3>
                <p className="text-sm text-gray-500">
                  90-120 minutes for group study
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
