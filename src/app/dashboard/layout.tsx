"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

const menuItems = [
  { name: "Overview", path: "/dashboard" },
  { name: "Study Rooms", path: "/dashboard/rooms" },
  { name: "History", path: "/dashboard/history" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const signOut = () => {
    supabase.auth.signOut();
    router.push("/signin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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

      {/* Navigation Menu with Hamburger Button */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-all duration-300 ease-in-out z-40 ${
          isMenuOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Menu Content */}
        <div className="relative h-full">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`absolute top-5 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 z-50  ${
              isMenuOpen ? "left-45" : "left-3"
            }`}
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Menu Items */}
          <div
            className={`p-6 transition-opacity duration-300 ${
              isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              StudySprint
            </h2>
            <nav className="space-y-2  flex flex-col justify-between">
              <div>
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      pathname == item.path
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <button
                onClick={signOut}
                className="block w-full px-4 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-red-500 text-left"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          isMenuOpen ? "ml-64" : "ml-16"
        }`}
      >
        <main className="p-32 pt-16">{children}</main>
      </div>
    </div>
  );
}
