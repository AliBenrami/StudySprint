"use client";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();

  return (
    <>
      {" "}
      <footer className="py-8 text-center text-gray-500">
        <p>© {new Date().getFullYear()} StudySprint. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Footer;
