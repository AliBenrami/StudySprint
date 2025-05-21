"use client";
import Image from "next/image";
import Nav from "./component/nav";
import Footer from "./component/footer";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "./util/supabase";

export default function Home() {
  const router = useRouter();

  const handleNavigateToDashboard = async () => {
    if (await isLoggedIn()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Navbar */}
        <Nav></Nav>

        {/* Hero Section */}
        <section className="py-24 px-6 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join Focus Rooms. Stay Accountable.
          </h1>
          <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
            StudySprint helps you stay focused using timed study sessions with
            peers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleNavigateToDashboard}
              className="px-8 py-3 bg-teal-600 rounded-lg text-lg font-medium hover:bg-teal-700 transition"
            >
              Create Sprint Room
            </button>
            <button
              onClick={handleNavigateToDashboard}
              className="px-8 py-3 bg-gray-800 rounded-lg text-lg font-medium hover:bg-gray-700 transition"
            >
              Join Sprint Room
            </button>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-900 p-6 rounded-xl">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Create</h3>
                <p className="text-gray-400">
                  Create a sprint room or join an existing one to study with
                  others.
                </p>
              </div>
              <div className="bg-gray-900 p-6 rounded-xl">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Sprint</h3>
                <p className="text-gray-400">
                  Focus in timed 25-minute sprints with 5-minute breaks in
                  between.
                </p>
              </div>
              <div className="bg-gray-900 p-6 rounded-xl">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Reflect</h3>
                <p className="text-gray-400">
                  Track your progress and build consistent study habits over
                  time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer></Footer>
      </div>
    </div>
  );
}
