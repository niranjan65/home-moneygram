import { sessionFetch as fetch } from "../../api/sessionClient.js";
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
import React, { useState, useRef, useEffect } from "react";
import { Menu, X, MapPin, ChevronDown, ArrowLeftRight, Truck, Landmark } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import mhlogo from "../../assets/MH.png";
import { useSettings } from "../../context/SettingsContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { selectedWarehouse } = useSettings();

  let activeLocationName = selectedWarehouse?.warehouse;
  if (!activeLocationName) {
    try {
      const stored = localStorage.getItem("selected_warehouse");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeLocationName = parsed?.warehouse || (typeof parsed === "string" ? parsed : null);
      }
    } catch {
      // fallback
    }
  }

  const session = JSON.parse(localStorage.getItem("erpnext_session"));
  const isLoggedIn = session && session.sessionActive;

  const isLoginPage = location.pathname === "/login";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);
  const transferDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        transferDropdownRef.current &&
        !transferDropdownRef.current.contains(event.target)
      ) {
        setTransferDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/method/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("erpnext_session");
      localStorage.removeItem("selected_warehouse");
      window.location.href = "/home/login";
    }
  };

  const navItems = [
    { label: "Money Transfer", href: "/money-transfer" },
    { label: "Currency Exchange", href: "/exchange" },
    { label: "Dealer Exchange", href: "/dealer-exchange" },
    {
      label: "Transfer",
      isDropdown: true,
      children: [
        {
          label: "Vault Transfer",
          href: "/vault-transfer",
          description: "Move cash between Counter and Vault",
          icon: Landmark,
        },
        {
          label: "Branch Transfer",
          href: "/branch-transfer",
          description: "Branch-to-branch BUY & SELL exchange",
          icon: Truck,
        },
      ],
    },
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
            <div className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-5">
              {navItems.map((item) => {
                if (item.isDropdown) {
                  const isAnyActive = item.children.some((child) => location.pathname === child.href);

                  return (
                    <div key={item.label} className="relative" ref={transferDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setTransferDropdownOpen((prev) => !prev)}
                        className={`px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                          isAnyActive
                            ? "bg-white text-[#E00000] shadow-sm dark:bg-white dark:text-[#E00000]"
                            : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            transferDropdownOpen ? "rotate-180 text-[#E00000]" : "text-gray-400"
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {transferDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          {item.children.map((child) => {
                            const isChildActive = location.pathname === child.href;
                            const IconComponent = child.icon;

                            return (
                              <Link
                                key={child.label}
                                to={child.href}
                                onClick={() => setTransferDropdownOpen(false)}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                  isChildActive
                                    ? "bg-red-50/70 text-[#E00000] dark:bg-red-950/40"
                                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    isChildActive
                                      ? "bg-[#E00000] text-white"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                  }`}
                                >
                                  <IconComponent size={16} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold leading-tight">
                                    {child.label}
                                  </div>
                                  <div className="text-[10px] text-gray-400 leading-normal mt-0.5">
                                    {child.description}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-[#E00000] shadow-sm dark:bg-white dark:text-[#E00000]"
                        : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Active Location Badge */}
              {activeLocationName ? (
                <>
                  <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />
                  <Link
                    to="/settings"
                    title={`Active Location: ${activeLocationName} · Click to manage in Settings`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-red-50/60 dark:bg-gray-800/80 dark:hover:bg-gray-800 border border-gray-200/80 hover:border-[#E00000]/30 dark:border-gray-700/80 transition-all text-xs group cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-[#E00000] dark:bg-red-950/60 shrink-0">
                      <MapPin size={12} strokeWidth={2.4} />
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-200 max-w-[110px] lg:max-w-[150px] xl:max-w-[200px] truncate">
                      {activeLocationName}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />
                  <Link
                    to="/settings"
                    title="User is not assigned to any branch location. Click to view Settings."
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 transition-all text-xs group cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                      <MapPin size={12} strokeWidth={2.4} />
                    </span>
                    <span className="font-bold text-amber-800 dark:text-amber-200 max-w-[140px] truncate">
                      No Branch Assigned
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-sm font-semibold transition-colors
                  text-red-500 hover:text-red-600
                  dark:text-red-400 dark:hover:text-red-500 ml-1 disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
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

            <div className="flex flex-col p-4 space-y-3">

              {/* Mobile Active Location Badge */}
              {activeLocationName ? (
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#E00000] flex items-center justify-center shrink-0">
                      <MapPin size={15} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Active Location
                      </div>
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                        {activeLocationName}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </Link>
              ) : (
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 flex items-center justify-center shrink-0">
                      <MapPin size={15} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Active Location
                      </div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">
                        No Branch Assigned
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Unassigned
                  </span>
                </Link>
              )}

              {navItems.map((item) => {
                if (item.isDropdown) {
                  return (
                    <div key={item.label} className="flex flex-col space-y-1 pt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3.5 py-1">
                        {item.label}
                      </div>
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.href;
                        const IconComponent = child.icon;

                        return (
                          <Link
                            key={child.label}
                            to={child.href}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                              isChildActive
                                ? "bg-white text-[#E00000] shadow-sm dark:bg-white dark:text-[#E00000]"
                                : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            }`}
                          >
                            <IconComponent size={15} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-[#E00000] shadow-sm dark:bg-white dark:text-[#E00000]"
                        : "text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-sm font-semibold transition-colors
                text-red-500 hover:text-red-600
                dark:text-red-400 dark:hover:text-red-500 text-left disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>

            </div>
          </div>
        </div>
      )}
    </header>
  );

}
