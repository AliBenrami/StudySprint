"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "../component/nav";
import Footer from "../component/footer";
import { supabase, isLoggedIn } from "../util/supabase";

// Define TypeScript interfaces for your data based on your Supabase schema
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Stat {
  id: string;
  label: string;
  value: string;
}

interface SprintRoom {
  id: string;
  title: string;
  created_at: string;
  is_active: boolean;
  participant_count?: number; // We'll calculate this
}

interface Activity {
  type: string;
  description: string;
  timestamp: string;
}

// Helper function for relative time
const getRelativeTimeString = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds)) return "Invalid date";

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

export default function Dashboard() {
  const router = useRouter();
  // State for user data and UI state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [upcomingRooms, setUpcomingRooms] = useState<SprintRoom[]>([]);
  const [myRooms, setMyRooms] = useState<SprintRoom[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth status and fetch user data when component mounts
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setIsLoading(true);
      try {
        // Check if user is logged in
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          // Redirect to login page if not authenticated
          router.push("/login");
          return;
        }

        // Get user data from Supabase auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not found");
        }

        // Extract and format user data
        const userDataResult: UserData = {
          id: user.id,
          name:
            user.user_metadata?.full_name || user.user_metadata?.name || "User",
          email: user.email || "",
          avatar_url: user.user_metadata?.avatar_url,
        };

        setUserData(userDataResult);

        // Fetch different data based on active tab
        await fetchTabData(activeTab);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  // Fetch data based on active tab
  const fetchTabData = async (tab: string) => {
    if (!userData) return;

    try {
      setIsLoading(true);

      // Fetch appropriate data based on selected tab using Supabase
      if (tab === "overview" || tab === "sprints") {
        // Get active sprint rooms from Supabase with participant counts
        const { data: roomsData, error: roomsError } = await supabase
          .from("sprint_rooms")
          .select(
            `
            *,
            participants:sprint_participants(count)
          `
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (roomsError) throw roomsError;

        // Format rooms with participant counts
        const formattedRooms = roomsData.map((room) => ({
          id: room.id,
          title: room.title,
          created_at: room.created_at,
          is_active: room.is_active,
          participant_count: room.participants?.[0]?.count || 0,
        }));

        setUpcomingRooms(formattedRooms || []);

        // Get user's created rooms for "My Sprints" tab
        const { data: myRoomsData, error: myRoomsError } = await supabase
          .from("sprint_rooms")
          .select(
            `
            *,
            participants:sprint_participants(count)
          `
          )
          .eq("created_by", userData.id)
          .order("created_at", { ascending: false });

        if (myRoomsError) throw myRoomsError;

        // Format my rooms with participant counts
        const formattedMyRooms = myRoomsData.map((room) => ({
          id: room.id,
          title: room.title,
          created_at: room.created_at,
          is_active: room.is_active,
          participant_count: room.participants?.[0]?.count || 0,
        }));

        setMyRooms(formattedMyRooms || []);
      }

      if (tab === "overview" || tab === "progress") {
        // Calculate user stats based on sprint sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sprint_sessions")
          .select(
            `
            *,
            sprint_participants!inner(user_id)
          `
          )
          .eq("sprint_participants.user_id", userData.id);

        if (sessionsError) throw sessionsError;

        // Calculate total focus time
        const totalMinutes =
          sessionsData?.reduce(
            (total, session) => total + (session.duration_minutes || 0),
            0
          ) || 0;

        const totalHours = Math.floor(totalMinutes / 60);

        // Count completed sessions
        const completedSessions = sessionsData?.length || 0;

        // Count days with sessions for a simple streak calculation
        const sessionDays = new Set(
          sessionsData?.map((session) =>
            new Date(session.started_at).toDateString()
          ) || []
        );

        // Create formatted stats
        const formattedStats: Stat[] = [
          { id: "1", label: "Focus Hours", value: totalHours.toString() },
          {
            id: "2",
            label: "Sprints Completed",
            value: completedSessions.toString(),
          },
          { id: "3", label: "Days Active", value: sessionDays.size.toString() },
        ];

        setStats(formattedStats);
      }

      if (tab === "overview") {
        // Create activity based on sprint participation and session history
        const { data: participationData, error: participationError } =
          await supabase
            .from("sprint_participants")
            .select(
              `
            *,
            sprint_rooms(title)
          `
            )
            .eq("user_id", userData.id)
            .order("joined_at", { ascending: false })
            .limit(5);

        if (participationError) throw participationError;

        // Format participation data as activity
        const activities: Activity[] = (participationData || []).map(
          (participation, index) => ({
            type: "join",
            description: `Joined "${participation.sprint_rooms?.title}" sprint room`,
            timestamp: participation.joined_at,
          })
        );

        setRecentActivity(activities);
      }
    } catch (err) {
      console.error("Error fetching tab data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab changes
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    await fetchTabData(tab);
  };

  // Handle creating a new sprint room
  const handleCreateSprintRoom = async () => {
    try {
      // Insert a new sprint room into Supabase
      const { data, error } = await supabase
        .from("sprint_rooms")
        .insert({
          title: "New Sprint Room",
          created_by: userData?.id,
          is_active: true,
        })
        .select();

      if (error) throw error;

      // Add creator as a participant
      if (data && data.length > 0) {
        const { error: participantError } = await supabase
          .from("sprint_participants")
          .insert({
            room_id: data[0].id,
            user_id: userData?.id,
            current_task: "Just joined",
          });

        if (participantError) throw participantError;
      }

      // Refresh sprint data
      await fetchTabData(activeTab);

      // If sprint was created, navigate to it
      if (data && data.length > 0) {
        router.push(`/sprint-room/${data[0].id}`);
      }
    } catch (err) {
      console.error("Error creating sprint room:", err);
      setError("Failed to create sprint room. Please try again.");
    }
  };

  // Handle joining a sprint room
  const handleJoinSprintRoom = async (roomId: string) => {
    try {
      // Add user to sprint participants
      const { error } = await supabase.from("sprint_participants").insert({
        room_id: roomId,
        user_id: userData?.id,
        current_task: "Just joined",
      });

      if (error && error.code !== "23505") {
        // Ignore duplicate key errors
        throw error;
      }

      // Navigate to sprint room
      router.push(`/sprint-room/${roomId}`);
    } catch (err) {
      console.error("Error joining sprint room:", err);
      setError("Failed to join sprint room. Please try again.");
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <Nav />

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-800 p-4 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => handleTabChange("overview")}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeTab === "overview" ? "bg-teal-600" : "hover:bg-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabChange("sprints")}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeTab === "sprints" ? "bg-teal-600" : "hover:bg-gray-700"
                }`}
              >
                My Sprints
              </button>
              <button
                onClick={() => handleTabChange("progress")}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeTab === "progress" ? "bg-teal-600" : "hover:bg-gray-700"
                }`}
              >
                Progress
              </button>
              <button
                onClick={() => handleTabChange("settings")}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  activeTab === "settings" ? "bg-teal-600" : "hover:bg-gray-700"
                }`}
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-gray-700 transition mt-8"
              >
                Sign Out
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <>
                    {/* Welcome Banner */}
                    <div className="bg-gray-800 p-6 rounded-xl mb-8">
                      <h1 className="text-2xl font-bold mb-2">
                        Welcome back, {userData?.name || "User"}!
                      </h1>
                      <p className="text-gray-400">
                        Ready for another productive study session?
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-4 mb-8">
                      <button
                        onClick={handleCreateSprintRoom}
                        className="px-6 py-3 bg-teal-600 rounded-lg font-medium hover:bg-teal-700 transition"
                      >
                        Create Sprint Room
                      </button>
                      <button
                        className="px-6 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition"
                        onClick={() => {
                          setActiveTab("sprints");
                          fetchTabData("sprints");
                        }}
                      >
                        Join Sprint Room
                      </button>
                      <button className="px-6 py-3 bg-gray-800 rounded-lg font-medium hover:bg-gray-700 transition">
                        Start Solo Sprint
                      </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {stats.length > 0 ? (
                        stats.map((stat) => (
                          <div
                            key={stat.id}
                            className="bg-gray-800 p-6 rounded-xl text-center"
                          >
                            <p className="text-gray-400 mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 bg-gray-800 p-6 rounded-xl text-center">
                          <p className="text-gray-400">
                            No stats available yet. Complete your first sprint
                            to see your progress!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Active Sprint Rooms */}
                      <div className="bg-gray-800 p-6 rounded-xl">
                        <h2 className="text-xl font-bold mb-4">
                          Active Sprint Rooms
                        </h2>
                        {upcomingRooms.length > 0 ? (
                          <div className="space-y-4">
                            {upcomingRooms.map((room) => (
                              <div
                                key={room.id}
                                className="bg-gray-900 p-4 rounded-lg"
                              >
                                <h3 className="font-semibold">{room.title}</h3>
                                <div className="flex justify-between text-sm text-gray-400 mt-2">
                                  <p>
                                    Created{" "}
                                    {getRelativeTimeString(room.created_at)}
                                  </p>
                                  <p>
                                    {room.participant_count || 0} participants
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleJoinSprintRoom(room.id)}
                                  className="mt-3 px-3 py-1 bg-teal-600 text-sm rounded hover:bg-teal-700 transition"
                                >
                                  Join Room
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">
                            No active sprint rooms found
                          </p>
                        )}
                        <button
                          className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                          onClick={() => handleTabChange("sprints")}
                        >
                          View All Rooms
                        </button>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-gray-800 p-6 rounded-xl">
                        <h2 className="text-xl font-bold mb-4">
                          Recent Activity
                        </h2>
                        {recentActivity.length > 0 ? (
                          <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                              <div
                                key={index}
                                className="bg-gray-900 p-4 rounded-lg"
                              >
                                <p>{activity.description}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {getRelativeTimeString(activity.timestamp)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">No recent activity</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "sprints" && (
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">My Sprint Rooms</h2>
                      <button
                        onClick={handleCreateSprintRoom}
                        className="px-4 py-2 bg-teal-600 rounded-lg font-medium hover:bg-teal-700 transition text-sm"
                      >
                        Create New Room
                      </button>
                    </div>

                    {myRooms.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-300 mb-2">
                          Rooms You Created
                        </h3>
                        {myRooms.map((room) => (
                          <div
                            key={room.id}
                            className="bg-gray-900 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{room.title}</h3>
                                <div className="text-sm text-gray-400 mt-1">
                                  <p>
                                    Created{" "}
                                    {getRelativeTimeString(room.created_at)}
                                  </p>
                                  <p className="mt-1">
                                    {room.participant_count || 0} participants
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleJoinSprintRoom(room.id)}
                                  className="px-3 py-1 bg-teal-600 text-sm rounded hover:bg-teal-700 transition"
                                >
                                  Join
                                </button>
                                <button className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600 transition">
                                  {room.is_active ? "Close" : "Reopen"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        <h3 className="text-lg font-medium text-gray-300 mt-8 mb-2">
                          Available Rooms
                        </h3>
                        {upcomingRooms
                          .filter(
                            (room) =>
                              !myRooms.some((myRoom) => myRoom.id === room.id)
                          )
                          .map((room) => (
                            <div
                              key={room.id}
                              className="bg-gray-900 p-4 rounded-lg"
                            >
                              <h3 className="font-semibold">{room.title}</h3>
                              <div className="flex justify-between text-sm text-gray-400 mt-2">
                                <p>
                                  Created{" "}
                                  {getRelativeTimeString(room.created_at)}
                                </p>
                                <p>
                                  {room.participant_count || 0} participants
                                </p>
                              </div>
                              <button
                                onClick={() => handleJoinSprintRoom(room.id)}
                                className="mt-3 px-3 py-1 bg-teal-600 text-sm rounded hover:bg-teal-700 transition"
                              >
                                Join Room
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 mb-8">
                          You haven't created any sprint rooms yet.
                        </p>

                        <h3 className="text-lg font-medium text-gray-300 mb-4">
                          Available Rooms
                        </h3>
                        {upcomingRooms.length > 0 ? (
                          <div className="space-y-4">
                            {upcomingRooms.map((room) => (
                              <div
                                key={room.id}
                                className="bg-gray-900 p-4 rounded-lg"
                              >
                                <h3 className="font-semibold">{room.title}</h3>
                                <div className="flex justify-between text-sm text-gray-400 mt-2">
                                  <p>
                                    Created{" "}
                                    {getRelativeTimeString(room.created_at)}
                                  </p>
                                  <p>
                                    {room.participant_count || 0} participants
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleJoinSprintRoom(room.id)}
                                  className="mt-3 px-3 py-1 bg-teal-600 text-sm rounded hover:bg-teal-700 transition"
                                >
                                  Join Room
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">
                            No active sprint rooms available. Create one to get
                            started!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "progress" && (
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-6">Your Progress</h2>
                    {stats.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          {stats.map((stat) => (
                            <div
                              key={stat.id}
                              className="bg-gray-900 p-6 rounded-xl text-center"
                            >
                              <p className="text-gray-400 mb-2">{stat.label}</p>
                              <p className="text-3xl font-bold">{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl">
                          <h3 className="text-lg font-medium mb-4">
                            Progress Over Time
                          </h3>
                          <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-400">
                              Detailed statistics coming soon!
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400">
                        No progress data available yet. Complete your first
                        sprint to see stats!
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                    <div className="space-y-4">
                      {userData?.avatar_url && (
                        <div className="flex justify-center mb-6">
                          <img
                            src={userData.avatar_url}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-2 border-teal-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-gray-400 mb-2">Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={userData?.name || ""}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={userData?.email || ""}
                          readOnly
                        />
                      </div>
                      <p className="text-gray-400 mt-4">
                        Your account is managed through Google authentication.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
