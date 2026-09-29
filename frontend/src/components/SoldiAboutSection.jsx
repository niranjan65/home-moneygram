import { useState } from "react";
import { ArrowUpRight, Check, ShieldCheck, Zap, Globe, Award } from "lucide-react";
import about from "../assets/about.jpg";
import { Link } from "react-router-dom";

const menuItems = [
  { 
    label: "Global MoneyGram Transfers", 
    desc: "Send and receive international remittances across 200+ countries with official RBF regulatory tracking.",
    icon: <Globe size={18} />
  },
  { 
    label: "Physical Foreign Currency Exchange", 
    desc: "Buy and sell 15+ major world banknotes over the counter with guaranteed teller vault availability.",
    icon: <ShieldCheck size={18} />
  },
  { 
    label: "Commercial Dealer Operations", 
    desc: "High-volume wholesale FX trading for licensed corporate partners and authorized tourism merchants.",
    icon: <Zap size={18} />
  },
  { 
    label: "RBF Compliance & Audit Security", 
    desc: "Automated Reserve Bank of Fiji threshold monitoring, TIN enforcement, and tax clearance reconciliation.",
    icon: <Award size={18} />
  },
];

const features = [
  "Licensed & Regulated by Reserve Bank of Fiji (RBF)",
  "Real-Time Vault Cash Inventory Tracking",
  "Zero Hidden Spreads & Instant Thermal Receipts",
];

export default function SoldiAboutSection() {
  const [activeItem, setActiveItem] = useState(0);

  return (
    <div className="bg-white dark:bg-gray-950 font-sans px-6 md:px-16 py-20 border-t border-b border-gray-100 dark:border-gray-800">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-14">
        <div>
          <span className="inline-block border border-red-200 dark:border-red-900/50 rounded-full px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#E00000] bg-red-50 dark:bg-red-950/40 mb-3">
            About MH Money Express
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Fiji's Premier Choice for{" "}
            <span className="relative inline-block text-[#E00000]">
              Forex &amp; Remittances
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="6"
                viewBox="0 0 100 6"
                fill="none"
              >
                <path
                  d="M0 5 Q25 1 50 3 Q75 5 100 2"
                  stroke="#E00000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h2>
        </div>

        <Link
          to="/money-transfer"
          className="bg-[#E00000] hover:bg-[#C50000] text-white font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
        >
          Start a Transfer
        </Link>
      </div>

      {/* Main Back-and-Forth Layout: Photo/Visual on Left, Features/Tabs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Photo & Trust Highlights Card */}
        <div className="lg:col-span-5 relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 relative group">
            <img 
              src={about} 
              alt="MH Money Express Point of Sale" 
              className="w-full h-[460px] object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Floating Trust Banner */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-red-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-[#E00000] font-black shrink-0">
                  25+
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Years of Financial Trust</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Serving thousands of Fijian families &amp; travelers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Service Selector & Detailed Benefit Card */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Menu Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveItem(i)}
                className={`p-4 rounded-2xl font-bold text-left transition-all duration-200 border flex flex-col justify-between gap-2 ${
                  activeItem === i
                    ? "bg-[#E00000] text-white border-[#E00000] shadow-lg shadow-red-500/20"
                    : "bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-900 hover:bg-red-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${activeItem === i ? "bg-white/20 text-white" : "bg-red-100 dark:bg-red-950/80 text-[#E00000]"}`}>
                    {item.icon}
                  </div>
                  <ArrowUpRight size={16} className={activeItem === i ? "text-white" : "text-gray-400"} />
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Active Detail Showcase Card */}
          <div className="bg-gradient-to-br from-red-50/70 via-white to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-red-950/20 rounded-3xl p-7 border border-red-100 dark:border-gray-800 shadow-md">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              {menuItems[activeItem].label}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              {menuItems[activeItem].desc}
            </p>

            <div className="flex flex-col gap-2.5">
              {features.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-xl px-4 py-2.5 shadow-xs border border-gray-100 dark:border-gray-700/60"
                >
                  <div className="w-5 h-5 rounded-full bg-[#E00000] flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}