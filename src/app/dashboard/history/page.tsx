"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { supabase, getUserId } from "@/app/lib/supabaseClient";

interface StudyRoom {
  id: string;
  title: string;
  subject: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  participants: number;
}

export default function StudyHistoryPage() {
  const [studyHistory, setStudyHistory] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    subject: "",
    startDate: "",
    endDate: "",
  });
  const [sortBy, setSortBy] = useState<"date" | "participants">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const deleteRoom = async (roomId: string) => {
    try {
      // First delete all participants associated with the room
      const { error: participantsError } = await supabase
        .from("sprint_participants")
        .delete()
        .eq("room_id", roomId);

      if (participantsError) {
        console.error("Error deleting participants:", participantsError);
        return;
      }

      // Then delete the room itself
      const { error: roomError } = await supabase
        .from("sprint_rooms")
        .delete()
        .eq("id", roomId);

      if (roomError) {
        console.error("Error deleting room:", roomError);
        return;
      }

      // Remove the room from local state
      setStudyHistory((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserId();
      if (id) {
        setCurrentUserId(id);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchStudyHistory = async () => {
      try {
        // Get current user ID
        const userId = await getUserId();
        if (!userId) return;

        // First get all rooms where user was a participant
        const { data: participantRooms, error: participantError } =
          await supabase
            .from("sprint_participants")
            .select("room_id")
            .eq("user_id", userId);

        if (participantError) {
          console.error("Error fetching participant rooms:", participantError);
          return;
        }

        const roomIds = participantRooms.map((p) => p.room_id);

        // Then fetch the inactive rooms from those IDs
        const { data: rooms, error: roomsError } = await supabase
          .from("sprint_rooms")
          .select("*")
          .in("id", roomIds)
          .eq("is_active", false);

        if (roomsError) {
          console.error("Error fetching rooms:", roomsError);
          return;
        }

        // For each room, get the count of participants
        const roomsWithParticipants = await Promise.all(
          rooms.map(async (room) => {
            const { count, error: countError } = await supabase
              .from("sprint_participants")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id)
              .eq("is_active", true);

            if (countError) {
              console.error("Error fetching participant count:", countError);
              return { ...room, participants: 0 };
            }

            return { ...room, participants: count || 0 };
          })
        );

        setStudyHistory(roomsWithParticipants);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyHistory();
  }, []);

  const getFilteredHistory = () => {
    return studyHistory
      .filter((room) => {
        const matchesSubject = filters.subject
          ? room.subject.toLowerCase().includes(filters.subject.toLowerCase())
          : true;
        const matchesDate =
          (!filters.startDate ||
            new Date(room.created_at) >= new Date(filters.startDate)) &&
          (!filters.endDate ||
            new Date(room.created_at) <= new Date(filters.endDate));
        return matchesSubject && matchesDate;
      })
      .sort((a, b) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;
        switch (sortBy) {
          case "date":
            return (
              multiplier *
              (new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime())
            );
          case "participants":
            return multiplier * (a.participants - b.participants);
          default:
            return 0;
        }
      });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Study History</h1>
        <p className="text-gray-600 mt-2">View your completed study sessions</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Sort Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "participants")
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="participants">Sort by Participants</option>
          </select>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
          </button>
        </div>
      </div>

      {/* Study History List */}
      <div className="space-y-4">
        {studyHistory.length > 0 ? (
          getFilteredHistory().map((room) => (
            <Card key={room.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{room.title}</h3>
                  <p className="text-sm text-gray-500">{room.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(room.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {room.participants}{" "}
                      {room.participants === 1 ? "participant" : "participants"}
                    </span>
                  </div>
                </div>
                {currentUserId === room.created_by && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to permanently delete this room? This action cannot be undone."
                        )
                      ) {
                        deleteRoom(room.id);
                      }
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </Card>
          ))
        ) : (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Study History Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Your completed study sessions will appear here
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard/rooms")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Start a Study Session
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
