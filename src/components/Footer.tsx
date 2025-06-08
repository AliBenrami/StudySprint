import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();
  return (
    <>
      {/* Footer */}
      <footer
        id="footer"
        className={`w-full py-10 bg-white border-t border-gray-100 transition-all duration-1000`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Connect
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="/#"
                    className="text-gray-500 hover:text-blue-600 text-sm"
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-100">
            © 2025 StudySprint. Built with ❤️ using Next.js & Supabase.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
