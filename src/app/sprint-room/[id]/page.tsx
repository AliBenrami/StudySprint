"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Nav from "../../component/nav";
import Footer from "../../component/footer";
import { supabase, isLoggedIn } from "../../util/supabase";

// Types
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Participant {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  current_task: string;
  role: string;
  joined_at: string;
}

interface SprintRoom {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  creator_name?: string;
}

interface SprintSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

// Format time from seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export default function SprintRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;

  // States
  const [userData, setUserData] = useState<UserData | null>(null);
  const [roomData, setRoomData] = useState<SprintRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [currentTask, setCurrentTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25 minutes
  const [timerType, setTimerType] = useState<"focus" | "break">("focus");
  const [currentSession, setCurrentSession] = useState<SprintSession | null>(
    null
  );

  // Refs
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const realtimeSubscription = useRef<any>(null);

  // Load room data and set up realtime subscriptions
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setIsLoading(true);

        // Check if user is logged in
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          router.push("/login");
          return;
        }

        // Get user data
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not found");
        }

        const userDataResult: UserData = {
          id: user.id,
          name:
            user.user_metadata?.full_name || user.user_metadata?.name || "User",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url,
        };
        setUserData(userDataResult);

        // Get room data - without trying to join with auth.users
        const { data: roomData, error: roomError } = await supabase
          .from("sprint_rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError) throw roomError;
        if (!roomData) {
          throw new Error("Sprint room not found");
        }

        if (!roomData.is_active) {
          // Room is closed, redirect to dashboard
          setError("This sprint room has been closed");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000); // Give user 3 seconds to see the error before redirecting
          return;
        }

        // Get creator's user data separately - works around schema join limitation
        const {
          data: { user: creatorUser },
        } = await supabase.auth.admin.getUserById(roomData.created_by);

        // Set room data with creator info
        setRoomData({
          ...roomData,
          creator_name:
            creatorUser?.user_metadata?.full_name ||
            creatorUser?.user_metadata?.name ||
            "Unknown",
        });

        // Check if user is owner
        const isOwner = roomData.created_by === userDataResult.id;
        setIsOwner(isOwner);

        // Get participant data
        const { data: participantData, error: participantError } =
          await supabase
            .from("sprint_participants")
            .select("*")
            .eq("room_id", roomId);

        if (participantError) throw participantError;

        // We need to get user info for each participant separately
        const participantPromises = participantData.map(async (participant) => {
          // Get user data for this participant
          const {
            data: { user: participantUser },
          } = await supabase.auth.admin.getUserById(participant.user_id);

          return {
            id: participant.id,
            user_id: participant.user_id,
            name:
              participantUser?.user_metadata?.full_name ||
              participantUser?.user_metadata?.name ||
              "User",
            avatar_url: participantUser?.user_metadata?.avatar_url,
            current_task: participant.current_task || "",
            role: participant.role || "participant",
            joined_at: participant.joined_at,
          };
        });

        // Resolve all user data promises
        const formattedParticipants = await Promise.all(participantPromises);
        setParticipants(formattedParticipants);

        // Find current user's participant record
        const currentUserParticipant = formattedParticipants.find(
          (p) => p.user_id === userDataResult.id
        );

        if (currentUserParticipant) {
          setCurrentTask(currentUserParticipant.current_task || "");
          setIsModerator(
            currentUserParticipant.role === "owner" ||
              currentUserParticipant.role === "moderator"
          );
        }

        // Get any active session
        const { data: sessionDataArray, error: sessionError } = await supabase
          .from("sprint_sessions")
          .select("*")
          .eq("room_id", roomId)
          .is("ended_at", null)
          .order("started_at", { ascending: false })
          .limit(1);

        if (sessionError) throw sessionError;

        // Check if we have any data and use the first item if so
        const sessionData =
          sessionDataArray && sessionDataArray.length > 0
            ? sessionDataArray[0]
            : null;

        if (sessionData) {
          setCurrentSession(sessionData);

          // Calculate remaining time
          const startTime = new Date(sessionData.started_at).getTime();
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const totalSeconds = sessionData.duration_minutes * 60;
          const remainingSeconds = totalSeconds - elapsedSeconds;

          if (remainingSeconds > 0) {
            setTimerSeconds(remainingSeconds);
            setTimerActive(true);
            startTimer();
          } else {
            // Session should be ended
            endSession(sessionData.id);
          }
        }

        // Set up realtime subscription
        setupRealtimeSubscription();
      } catch (err) {
        console.error("Error loading room data:", err);
        setError("Failed to load sprint room. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomData();

    return () => {
      // Clean up timer and subscription
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }

      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [roomId, router]);

  // Set up realtime subscription
  const setupRealtimeSubscription = async () => {
    // Subscribe to changes in participants
    const participantsSubscription = supabase
      .channel("public:sprint_participants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprint_participants",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          refreshParticipants();
        }
      )
      .subscribe();

    // Subscribe to changes in the room
    const roomSubscription = supabase
      .channel("public:sprint_rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprint_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          refreshRoomData();
        }
      )
      .subscribe();

    // Subscribe to changes in sessions
    const sessionsSubscription = supabase
      .channel("public:sprint_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sprint_sessions",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          refreshSessionData();
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    realtimeSubscription.current = {
      unsubscribe: () => {
        participantsSubscription.unsubscribe();
        roomSubscription.unsubscribe();
        sessionsSubscription.unsubscribe();
      },
    };
  };

  // Refresh participants data - with fix for cross-schema issue
  const refreshParticipants = async () => {
    try {
      const { data: participantData, error: participantError } = await supabase
        .from("sprint_participants")
        .select("*")
        .eq("room_id", roomId);

      if (participantError) throw participantError;

      // We need to fetch user data separately for each participant
      const userDataMap = new Map();

      // First collect all user IDs we need
      const userIds = participantData.map((p) => p.user_id);

      // Then batch fetch user data for all participants - this approach would be more efficient
      // In a real app, you'd implement a batch user data fetching function
      // For now, we'll use individual queries
      for (const userId of userIds) {
        try {
          const {
            data: { user },
          } = await supabase.auth.admin.getUserById(userId);
          if (user) {
            userDataMap.set(userId, {
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                "User",
              avatar_url: user.user_metadata?.avatar_url,
            });
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }

      const formattedParticipants = participantData.map((participant) => {
        const userData = userDataMap.get(participant.user_id) || {
          name: "Unknown User",
        };
        return {
          id: participant.id,
          user_id: participant.user_id,
          name: userData.name,
          avatar_url: userData.avatar_url,
          current_task: participant.current_task || "",
          role: participant.role || "participant",
          joined_at: participant.joined_at,
        };
      });

      // Add this before setting participants to deduplicate by user_id
      const uniqueParticipants = [];
      const seenUserIds = new Set();

      for (const participant of formattedParticipants) {
        if (!seenUserIds.has(participant.user_id)) {
          seenUserIds.add(participant.user_id);
          uniqueParticipants.push(participant);
        }
      }

      setParticipants(uniqueParticipants);
    } catch (err) {
      console.error("Error refreshing participants:", err);
    }
  };

  // Refresh room data - fixed for cross-schema issue
  const refreshRoomData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("sprint_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Get creator data separately
      const {
        data: { user: creatorUser },
      } = await supabase.auth.admin.getUserById(roomData.created_by);

      setRoomData({
        ...roomData,
        creator_name:
          creatorUser?.user_metadata?.full_name ||
          creatorUser?.user_metadata?.name ||
          "Unknown",
      });
    } catch (err) {
      console.error("Error refreshing room data:", err);
    }
  };

  // The rest of your functions remain unchanged
  const refreshSessionData = async () => {
    try {
      // Remove .single() and handle array response instead
      const { data: sessionDataArray, error: sessionError } = await supabase
        .from("sprint_sessions")
        .select("*")
        .eq("room_id", roomId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      // Check if we have any data and use the first item if so
      const sessionData =
        sessionDataArray && sessionDataArray.length > 0
          ? sessionDataArray[0]
          : null;

      if (sessionData) {
        setCurrentSession(sessionData);

        if (!timerActive) {
          // Calculate remaining time
          const startTime = new Date(sessionData.started_at).getTime();
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const totalSeconds = sessionData.duration_minutes * 60;
          const remainingSeconds = totalSeconds - elapsedSeconds;

          if (remainingSeconds > 0) {
            setTimerSeconds(remainingSeconds);
            setTimerActive(true);
            startTimer();
          } else {
            // Session should be ended
            endSession(sessionData.id);
          }
        }
      } else {
        setCurrentSession(null);
        setTimerActive(false);
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
      }
    } catch (err) {
      console.error("Error refreshing session data:", err);
    }
  };

  const updateCurrentTask = async () => {
    if (!userData) return;

    try {
      const { error } = await supabase
        .from("sprint_participants")
        .update({ current_task: currentTask })
        .eq("room_id", roomId)
        .eq("user_id", userData.id);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update your task. Please try again.");
    }
  };

  // Rest of your existing functions remain the same
  const startSession = async (durationMinutes: number = 25) => {
    if (!userData || !isModerator) return;

    try {
      // End any existing session
      if (currentSession) {
        await endSession(currentSession.id);
      }

      // Create a new session
      const { data, error } = await supabase
        .from("sprint_sessions")
        .insert({
          room_id: roomId,
          started_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentSession(data[0]);
        setTimerSeconds(durationMinutes * 60);
        setTimerActive(true);
        setTimerType("focus");
        startTimer();
      }
    } catch (err) {
      console.error("Error starting session:", err);
      setError("Failed to start sprint session. Please try again.");
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sprint_sessions")
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;

      setCurrentSession(null);
      setTimerActive(false);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    timerInterval.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(timerInterval.current!);
          timerInterval.current = null;

          // If in a session, end it
          if (currentSession) {
            endSession(currentSession.id);
          }

          // Switch timer type
          if (timerType === "focus") {
            setTimerType("break");
            setTimerSeconds(5 * 60); // 5 minute break
            startTimer(); // Start break timer
          } else {
            setTimerActive(false);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLeaveRoom = async () => {
    try {
      // If user is the owner and there are other participants, show warning
      if (isOwner && participants.length > 1) {
        if (
          !confirm(
            "As the owner, leaving will close the room for everyone. Continue?"
          )
        ) {
          return;
        }

        // Close the room
        await supabase
          .from("sprint_rooms")
          .update({ is_active: false })
          .eq("id", roomId);
      } else if (!isOwner) {
        // Just remove the user from participants
        await supabase
          .from("sprint_participants")
          .delete()
          .eq("room_id", roomId)
          .eq("user_id", userData?.id);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error leaving room:", err);
      setError("Failed to leave room. Please try again.");
    }
  };

  // Update this function
  const handleJoinSprintRoom = async (roomId: string) => {
    try {
      // Use upsert instead of insert to handle the case where user rejoins
      const { error } = await supabase.from("sprint_participants").upsert(
        {
          room_id: roomId,
          user_id: userData?.id,
          current_task: "Just joined",
        },
        {
          onConflict: "room_id,user_id",
          ignoreDuplicates: false, // Update the record if it exists
        }
      );

      if (error) throw error;

      // Navigate to sprint room
      router.push(`/sprint-room/${roomId}`);
    } catch (err) {
      console.error("Error joining sprint room:", err);
      setError("Failed to join sprint room. Please try again.");
    }
  };

  // Add this new function to close a room without leaving it
  const handleCloseRoom = async () => {
    try {
      if (!isOwner && !isModerator) {
        setError("Only room owners or moderators can close a room");
        return;
      }

      // Confirm before closing
      if (
        !confirm(
          "Are you sure you want to close this sprint room? All participants will be redirected to the dashboard."
        )
      ) {
        return;
      }

      // Close the room (mark as inactive)
      const { error } = await supabase
        .from("sprint_rooms")
        .update({ is_active: false })
        .eq("id", roomId);

      if (error) throw error;

      // End any active session
      if (currentSession) {
        await endSession(currentSession.id);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error closing room:", err);
      setError("Failed to close the room. Please try again.");
    }
  };

  // Your return statement remains the same
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Nav />
      {/* The rest of your UI code is unchanged */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {/* Room Header */}
            <div className="bg-gray-800 p-6 rounded-xl mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">
                    {roomData?.title || "Sprint Room"}
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Created by {roomData?.creator_name || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Only show Close Room button to owners/moderators */}
                  {(isOwner || isModerator) && (
                    <button
                      onClick={handleCloseRoom}
                      className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition"
                    >
                      Close Room
                    </button>
                  )}
                  <button
                    onClick={handleLeaveRoom}
                    className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Timer and Controls */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 p-6 rounded-xl mb-8">
                  <h2 className="text-xl font-bold mb-4">
                    {timerType === "focus" ? "Focus Time" : "Break Time"}
                  </h2>

                  <div className="text-center py-8">
                    <div className="text-5xl font-bold mb-6">
                      {formatTime(timerSeconds)}
                    </div>

                    {isModerator && (
                      <div className="space-y-4">
                        {!timerActive ? (
                          <>
                            <button
                              onClick={() => startSession(25)}
                              className="w-full px-4 py-3 bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                            >
                              Start 25 Min Sprint
                            </button>
                            <button
                              onClick={() => startSession(50)}
                              className="w-full px-4 py-3 bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                            >
                              Start 50 Min Sprint
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              currentSession && endSession(currentSession.id)
                            }
                            className="w-full px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
                          >
                            End Sprint Early
                          </button>
                        )}
                      </div>
                    )}

                    {!isModerator && timerActive && (
                      <p className="text-gray-400 mt-4">
                        Sprint in progress... Stay focused!
                      </p>
                    )}

                    {!isModerator && !timerActive && (
                      <p className="text-gray-400 mt-4">
                        Waiting for moderator to start a sprint...
                      </p>
                    )}
                  </div>
                </div>

                {/* Your Task */}
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h2 className="text-xl font-bold mb-4">Your Current Task</h2>
                  <textarea
                    value={currentTask}
                    onChange={(e) => setCurrentTask(e.target.value)}
                    onBlur={updateCurrentTask}
                    placeholder="What are you working on?"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white resize-none h-32 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={updateCurrentTask}
                    className="w-full mt-2 px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition"
                  >
                    Update Task
                  </button>
                </div>
              </div>

              {/* Right Column: Participants */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h2 className="text-xl font-bold mb-4">
                    Participants ({participants.length})
                  </h2>

                  <div className="space-y-4">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="bg-gray-900 p-4 rounded-lg flex gap-4"
                      >
                        <div className="flex-shrink-0">
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt={participant.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                              {participant.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {participant.name}
                            </h3>
                            {participant.role === "owner" && (
                              <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">
                                Owner
                              </span>
                            )}
                            {participant.role === "moderator" && (
                              <span className="text-xs bg-teal-600 px-2 py-0.5 rounded">
                                Mod
                              </span>
                            )}
                          </div>

                          <p className="text-gray-400 text-sm mt-1">
                            {participant.current_task || "No task set"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
