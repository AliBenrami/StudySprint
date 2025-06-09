"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export default function Home() {
  const router = useRouter();
  // For fade-in animation on scroll
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({
    features: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const featuresSection = document.getElementById("features");

      if (featuresSection) {
        const featuresSectionTop = featuresSection.getBoundingClientRect().top;
        setIsVisible((prev) => ({
          ...prev,
          features: featuresSectionTop < window.innerHeight * 0.8,
        }));
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Trigger once on load
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const features = [
    {
      title: "Live Study Sprints",
      description:
        "Join rooms with fellow learners for focused study sessions.",
      icon: "/globe.svg",
    },
    {
      title: "Sprint Timer & Progress",
      description: "Track your focus time with our Pomodoro-style timer.",
      icon: "/file.svg",
    },
    {
      title: "Matchmaking Queue",
      description: "Get paired with students studying similar subjects.",
      icon: "/window.svg",
    },
    {
      title: "Task Board",
      description: "Organize and prioritize your study goals efficiently.",
      icon: "/file.svg",
    },
    {
      title: "Post-Sprint Reflection",
      description: "Review your progress and track your growth over time.",
      icon: "/globe.svg",
    },
    {
      title: "Built with Supabase",
      description: "Reliable backend for real-time collaboration features.",
      icon: "/vercel.svg",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center">
      <Nav page="/"></Nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center px-4 sm:px-6 py-24 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wMiIgc3Ryb2tlLXdpZHRoPSIuNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjkuNSIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="absolute top-40 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div
          className="absolute top-20 right-10 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-56 h-56 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            StudySprint
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Join real-time study sprints. Build habits. Stay accountable.
          </p>
          <button
            onClick={() => {
              router.push("/dashboard");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg text-lg shadow-md transition-all"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`w-full px-4 sm:px-6 py-24 bg-white transition-all duration-1000 ${
          isVisible.features
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
            Everything you need to stay focused
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all"
                style={{
                  transitionDelay: `${150 * index}ms`,
                  opacity: isVisible.features ? 1 : 0,
                  transform: isVisible.features
                    ? "translateY(0)"
                    : "translateY(20px)",
                }}
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-5">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={24}
                    height={24}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full px-4 sm:px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
            What our users say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  JD
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">John Doe</h4>
                  <p className="text-sm text-gray-500">
                    Computer Science Student
                  </p>
                </div>
              </div>
              <p className="text-gray-600">
                "StudySprint helped me stay focused during finals week. The live
                community aspect kept me accountable!"
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  AS
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Anna Smith</h4>
                  <p className="text-sm text-gray-500">Medical Student</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I love the matchmaking feature! Being paired with other med
                students keeps me motivated during long study sessions."
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  MJ
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Mike Johnson</h4>
                  <p className="text-sm text-gray-500">Self-taught Developer</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The sprint timer and task board combination has doubled my
                productivity. This app is a game changer!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full px-4 sm:px-6 py-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to boost your productivity?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join thousands of students achieving their goals with focused study
            sprints.
          </p>
          <button className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg text-lg shadow-md transition-all">
            Start Sprinting Today
          </button>
        </div>
      </section>

      <Footer></Footer>
    </main>
  );
}
