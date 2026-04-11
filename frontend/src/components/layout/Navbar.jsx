// import React, { useState } from "react";
// import { Menu, X } from "lucide-react";
// import { useLocation, Link } from "react-router-dom";
// import mhlogo from "../../assets/MH.png"; // adjust path if needed

// export default function Navbar() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const location = useLocation();

//   const session = JSON.parse(localStorage.getItem("erpnext_session"));
//   const isLoggedIn = session && session.sessionActive;

//   const isLoginPage = location.pathname === "/";

//   const handleLogout = () => {
//     localStorage.removeItem("erpnext_session");
//     window.location.href = "/";
//   };

//   const navItems = [
//     { label: "Money Transfer", href: "/money-transfer" },
//     { label: "Currency Exchange", href: "/exchange" },
//     { label: "Contact Us", href: "/contact-us" },
//   ];

//   return (
//   <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-all
//     bg-white/80 border-gray-200
//     dark:bg-gray-900/80 dark:border-gray-800">

//     <div className="flex items-center justify-between px-6 lg:px-10 py-3">

//       {/* Logo */}
//       {isLoggedIn ? (
//         <Link to="/home" className="flex items-center gap-3">
//           <img
//             src={mhlogo}
//             alt="MH Logo"
//             className="h-10 w-auto object-contain"
//           />
//         </Link>
//       ) : (
//         <div className="flex items-center gap-3">
//           <img
//             src={mhlogo}
//             alt="MH Logo"
//             className="h-10 w-auto object-contain"
//           />
//         </div>
//       )}

//       {/* Navigation */}
//       {!isLoginPage && isLoggedIn && (
//         <>
//           {/* Desktop */}
//           <div className="hidden md:flex items-center gap-8">

//             {navItems.map((item) => (
//               <Link
//                 key={item.label}
//                 to={item.href}
//                 className="text-sm font-semibold transition-colors
//                   text-gray-700 hover:text-primary
//                   dark:text-gray-300 dark:hover:text-primary"
//               >
//                 {item.label}
//               </Link>
//             ))}

//             <button
//               onClick={handleLogout}
//               className="text-sm font-semibold transition-colors
//                 text-red-500 hover:text-red-600
//                 dark:text-red-400 dark:hover:text-red-500"
//             >
//               Logout
//             </button>
//           </div>

//           {/* Mobile Toggle */}
//           <button
//             onClick={() => setMenuOpen(!menuOpen)}
//             className="md:hidden p-2 transition-colors
//               text-gray-700 dark:text-gray-300"
//           >
//             {menuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </>
//       )}
//     </div>

//     {/* Mobile Dropdown */}
//     {!isLoginPage && isLoggedIn && (
//       <div
//         className={`md:hidden overflow-hidden transition-all duration-300 ${
//           menuOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
//         }`}
//       >
//         <div className="mx-6 mb-4 rounded-xl shadow-lg border
//           bg-white border-gray-200
//           dark:bg-gray-900 dark:border-gray-800">

//           <div className="flex flex-col p-4 space-y-4">

//             {navItems.map((item) => (
//               <Link
//                 key={item.label}
//                 to={item.href}
//                 onClick={() => setMenuOpen(false)}
//                 className="text-sm font-semibold transition-colors
//                   text-gray-700 hover:text-primary
//                   dark:text-gray-300 dark:hover:text-primary"
//               >
//                 {item.label}
//               </Link>
//             ))}

//             <button
//               onClick={handleLogout}
//               className="text-sm font-semibold transition-colors
//                 text-red-500 hover:text-red-600
//                 dark:text-red-400 dark:hover:text-red-500 text-left"
//             >
//               Logout
//             </button>

//           </div>
//         </div>
//       </div>
//     )}
//   </header>
// );

// }
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import mhlogo from "../../assets/MH.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const session = JSON.parse(localStorage.getItem("erpnext_session"));
  const isLoggedIn = session && session.sessionActive;

  // const isLoginPage = location.pathname === "/";
  const isLoginPage = location.pathname === "/login";

  const handleLogout = () => {
    localStorage.removeItem("erpnext_session");
    window.location.href = "/";
  };

  const navItems = [
    { label: "Money Transfer", href: "/money-transfer" },
    { label: "Currency Exchange", href: "/exchange" },
    { label: "Dealer Exchange", href: "/dealer-exchange" },
    // { label: "Stocks", href: "/stocks" },
    { label: "Report", href: "/report" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-all
  bg-white/90 border-gray-200
  dark:bg-gray-900/90 dark:border-gray-800">


      <div className="flex items-center justify-between px-6 lg:px-10 py-3">

        {/* Logo */}
        {isLoggedIn ? (
          <Link to="/home" className="flex items-center gap-3">
            <img
              src={mhlogo}
              alt="MH Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={mhlogo}
              alt="MH Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
        )}

        {/* Navigation */}
        {!isLoginPage && isLoggedIn && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                        : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className="text-sm font-semibold transition-colors
                  text-red-500 hover:text-red-600
                  dark:text-red-400 dark:hover:text-red-500"
              >
                Logout
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 transition-colors
                text-gray-700 dark:text-gray-300"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        )}

        {/* Login Button (For logged-out users on public pages) */}
        {!isLoggedIn && !isLoginPage && (
          <Link to="/login">
            <button className="bg-[#E00000] hover:bg-[#B70000] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
              Login
            </button>
          </Link>
        )}
      </div>


      {!isLoginPage && isLoggedIn && (
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
            }`}
        >
          <div className="mx-6 mb-4 rounded-xl shadow-lg border
          bg-white border-gray-200
          dark:bg-gray-900 dark:border-gray-800">

            <div className="flex flex-col p-4 space-y-4">

              {navItems.map((item) => {
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}



              <button
                onClick={handleLogout}
                className="text-sm font-semibold transition-colors
                text-red-500 hover:text-red-600
                dark:text-red-400 dark:hover:text-red-500 text-left"
              >
                Logout
              </button>

            </div>
          </div>
        </div>
      )}
    </header>
  );

}
