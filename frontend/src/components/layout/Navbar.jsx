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
import { Menu, X, MapPin, ChevronDown, ArrowLeftRight, Truck, Landmark, LockKeyhole, ArrowUpDownIcon, User, Mail, Phone, LogOut, Settings } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import mhlogo from "../../assets/MH.png";
import { useSettings } from "../../context/SettingsContext";
import { customPos } from "../../api/customPos";
import { hasOpenCashCounterFlag, syncCashCounterFlag } from "../../api/cashCounterSession";
import { useCurrentUser } from "../../hooks/useCurrentUser";

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
  const [posStatus, setPosStatus] = useState(null);

  const { user: currentUser } = useCurrentUser();

  const tellerName =
    currentUser?.full_name ||
    currentUser?.user ||
    currentUser?.first_name ||
    currentUser?.username ||
    session?.user ||
    "Authorized Teller";

  const tellerEmail =
    currentUser?.email ||
    session?.email ||
    "Not Available";

  const tellerPhone =
    currentUser?.mobile_no ||
    currentUser?.phone ||
    session?.mobile_no ||
    session?.phone ||
    "Not Available";

  const tellerRole =
    currentUser?.user_type ||
    session?.user_type ||
    "Teller";

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const clean = name.replace(/[^a-zA-Z\s]/g, "").trim();
    if (!clean) return "U";
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getInitials(tellerName);

  useEffect(() => {
    if (!isLoggedIn || !activeLocationName) { setPosStatus(null); return; }
    let live = true;
    if (hasOpenCashCounterFlag(activeLocationName)) {
      setPosStatus("open");
      return () => { live = false; };
    }
    customPos.getStatus(activeLocationName)
      .then(data => { if (live) { syncCashCounterFlag(activeLocationName, data?.status, data?.enabled); setPosStatus(data?.enabled === false ? null : data?.status || "needs_opening"); } })
      .catch(() => { if (live) setPosStatus(null); });
    return () => { live = false; };
  }, [isLoggedIn, activeLocationName, location.pathname]);

  const isLoginPage = location.pathname === "/login";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownsRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownsRef.current &&
        !dropdownsRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setProfileOpen(false);
  }, [location.pathname]);

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
    {
      label: "Operations",
      isDropdown: true,
      children: [
        { label: "MH Money Transfer", href: "/money-transfer-new", description: "Send or Receive Money", icon: ArrowUpDownIcon },
        {
          label: "Currency Exchange",
          href: "/exchange-new",
          description: "Customer foreign-currency exchange",
          icon: ArrowLeftRight,
        },
        {
          label: "Dealer Exchange",
          href: "/dealer-exchange",
          description: "Commercial dealer currency exchange",
          icon: Landmark,
        },
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
    ...(posStatus ? [{ label: "Cash Counter", href: "/pos" }] : []),
    // { label: "MH Money Transfer", href: "/money-transfer" },
    { label: "Customer Requests", href: "/customer-requests" },
    /*
    {
      label: "Exchange",
      isDropdown: true,
      children: [
        {
          label: "Currency Exchange",
          href: "/exchange",
          description: "Customer foreign-currency exchange",
          icon: ArrowLeftRight,
        },
        {
          label: "Dealer Exchange",
          href: "/dealer-exchange",
          description: "Commercial dealer currency exchange",
          icon: Landmark,
        },
      ],
    },
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
    */
    // { label: "Stocks", href: "/stocks" },
    { label: "Report", href: "/report" },
    // { label: "Settings", href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-all bg-surface/90 border-line">

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
            <div ref={dropdownsRef} className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-5">
              {navItems.map((item) => {
                if (item.isDropdown) {
                  const isAnyActive = item.children.some((child) => location.pathname === child.href);

                  return (
                    <div key={item.label} className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown((current) => current === item.label ? null : item.label)}
                        className={`px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-label font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${isAnyActive
                          ? "bg-surface-alt text-brand-600 shadow-sm"
                          : "text-ink hover:text-brand-600 hover:bg-surface-alt"
                          }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${openDropdown === item.label ? "rotate-180 text-brand-600" : "text-muted"
                            }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === item.label && (
                        <div className="absolute top-full left-0 mt-1.5 w-72 bg-surface rounded-2xl shadow-xl border border-line p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          {item.children.map((child) => {
                            const isChildActive = location.pathname === child.href;
                            const IconComponent = child.icon;

                            return (
                              <Link
                                key={child.label}
                                to={child.href}
                                onClick={() => setOpenDropdown(null)}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${isChildActive
                                  ? "bg-danger-bg text-brand-600"
                                  : "text-ink hover:bg-surface-alt"
                                  }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isChildActive
                                    ? "bg-brand-600 text-white"
                                    : "bg-surface-alt text-muted"
                                    }`}
                                >
                                  <IconComponent size={16} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-label font-semibold leading-tight">
                                    {child.label}
                                  </div>
                                  <div className="text-caption text-muted leading-normal mt-0.5">
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
                    className={`px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg text-label font-semibold transition-all duration-200 ${isActive
                      ? "bg-surface-alt text-brand-600 shadow-sm"
                      : "text-ink hover:text-brand-600 hover:bg-surface-alt"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Active Location Badge */}
              {activeLocationName ? (
                <>
                  <div className="h-5 w-px bg-line mx-0.5" />
                  <Link
                    to="/settings"
                    title={`Active Location: ${activeLocationName}${posStatus ? ` · Cash Counter ${posStatus.replaceAll("_", " ")}` : ""} · Click to manage in Settings`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-alt hover:bg-chip border border-line hover:border-brand-600/40 transition-all text-caption font-semibold group cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-danger-bg text-brand-600 shrink-0">
                      <MapPin size={12} strokeWidth={2.4} />
                    </span>
                    <span className="font-semibold text-ink max-w-[110px] lg:max-w-[150px] xl:max-w-[200px] truncate">
                      {activeLocationName}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </Link>
                  {posStatus === "open" && (
                    <Link
                      to="/pos/close"
                      title={`Start closing count at ${activeLocationName}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E00000] bg-[#E00000] px-3 py-1.5 text-caption font-semibold text-white shadow-sm transition-colors hover:bg-[#B70000]"
                    >
                      <LockKeyhole size={12} strokeWidth={2.5} />
                      Closing count
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="h-5 w-px bg-line mx-0.5" />
                  <Link
                    to="/settings"
                    title="User is not assigned to any branch location. Click to view Settings."
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-caption font-semibold group cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 shrink-0">
                      <MapPin size={12} strokeWidth={2.4} />
                    </span>
                    <span className="font-semibold text-amber-600 max-w-[140px] truncate">
                      No Branch Assigned
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  </Link>
                </>
              )}

              {/* Profile Avatar & Dropdown */}
              <div ref={profileRef} className="relative ml-1">
                <button
                  type="button"
                  id="profile-avatar-button"
                  aria-label="User Profile"
                  aria-expanded={profileOpen}
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setOpenDropdown(null);
                  }}
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer ${profileOpen
                    ? "ring-2 ring-brand-600 ring-offset-2 ring-offset-surface shadow-md scale-105"
                    : "ring-1 ring-line hover:ring-brand-600/60 hover:shadow-sm"
                    } bg-brand-600 text-white select-none`}
                >
                  {currentUser?.user_image ? (
                    <img
                      src={currentUser.user_image}
                      alt={tellerName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-black tracking-tight">
                      {userInitials}
                    </span>
                  )}
                  {/* Status indicator dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 top-full mt-2.5 w-76 bg-surface rounded-2xl shadow-2xl border border-line p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-line">
                      <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-600 text-white shadow-sm shrink-0">
                        {currentUser?.user_image ? (
                          <img
                            src={currentUser.user_image}
                            alt={tellerName}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <span className="text-sm font-black tracking-tight">
                            {userInitials}
                          </span>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-ink truncate" title={tellerName}>
                          {tellerName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-danger-bg text-brand-600">
                            {tellerRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teller Contact / Location Details */}
                    <div className="mt-3 p-3 rounded-xl bg-surface-alt border border-line space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-surface text-muted flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Mail size={12} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Email Address
                          </div>
                          <div className="text-xs font-semibold text-ink truncate mt-0.5" title={tellerEmail}>
                            {tellerEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-surface text-muted flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Phone size={12} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Mobile Number
                          </div>
                          <div className="text-xs font-semibold text-ink truncate mt-0.5" title={tellerPhone}>
                            {tellerPhone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-surface text-muted flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <MapPin size={12} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Active Location
                          </div>
                          <div className="text-xs font-semibold text-ink truncate mt-0.5" title={activeLocationName || "No Branch Assigned"}>
                            {activeLocationName || "No Branch Assigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation & Logout Action */}
                    <div className="mt-2.5 pt-2 border-t border-line space-y-1">
                      <Link
                        to="/settings-new"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-ink hover:bg-surface-alt transition-colors"
                      >
                        <Settings size={14} className="text-muted" />
                        <span>Branch & Account Settings</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-50 cursor-pointer mt-1"
                      >
                        <LogOut size={14} strokeWidth={2.2} />
                        <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 transition-colors text-ink hover:text-brand-600"
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
          <div className="mx-6 mb-4 rounded-xl shadow-lg border bg-surface border-line">

            <div className="flex flex-col p-4 space-y-3">

              {/* Mobile Active Location Badge */}
              {activeLocationName ? (
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-line hover:bg-chip transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-danger-bg text-brand-600 flex items-center justify-center shrink-0">
                      <MapPin size={15} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Active Location
                      </div>
                      <div className="text-xs font-bold text-ink truncate">
                        {activeLocationName}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </Link>
              ) : (
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                      <MapPin size={15} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        Active Location
                      </div>
                      <div className="text-xs font-bold text-amber-600 truncate">
                        No Branch Assigned
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Unassigned
                  </span>
                </Link>
              )}

              {navItems.map((item) => {
                if (item.isDropdown) {
                  return (
                    <div key={item.label} className="flex flex-col space-y-1 pt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted px-3.5 py-1">
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
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${isChildActive
                              ? "bg-surface-alt text-brand-600 shadow-sm"
                              : "text-ink hover:text-brand-600 hover:bg-surface-alt"
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
                    className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${isActive
                      ? "bg-surface-alt text-brand-600 shadow-sm"
                      : "text-ink hover:text-brand-600 hover:bg-surface-alt"
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Profile Card & Logout */}
              <div className="mt-2 pt-3 border-t border-line">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt border border-line">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white shrink-0 font-black text-xs">
                    {currentUser?.user_image ? (
                      <img
                        src={currentUser.user_image}
                        alt={tellerName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      userInitials
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink truncate">
                      {tellerName}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {tellerEmail}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {tellerPhone}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E00000] hover:bg-[#B70000] transition-colors disabled:opacity-50"
                >
                  <LogOut size={14} strokeWidth={2.2} />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );

}
