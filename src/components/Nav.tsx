import { useRouter } from "next/navigation";
import { useState } from "react";

const Nav = ({ page }: { page: string }) => {
  const router = useRouter();

  return (
    <>
      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-4 flex items-center justify-between bg-white bg-opacity-90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center">
          <a href="/">
            <span className="text-xl font-bold text-blue-600">StudySprint</span>
          </a>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="/#features"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Features
          </a>
          <a
            href="/#"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            Pricing
          </a>
          <a
            href="/#"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            About
          </a>
          <button
            onClick={() => {
              router.push("/signin");
            }}
            className={`${
              page === "/signin"
                ? "bg-blue-100 text-blue-700"
                : "bg-blue-600 text-white"
            } hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            Sign In
          </button>
        </div>
        <button className="md:hidden text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </nav>
    </>
  );
};

export default Nav;
