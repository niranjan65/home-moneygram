import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import about from "../assets/about.jpg"

const menuItems = [
  { label: "Financial Revenue", active: true },
  { label: "Private Loan", active: false },
  { label: "Online Banking", active: false },
  { label: "Transfer of Funds", active: false },
];

const features = [
  "Manage All Your Credit Cards in One Place",
  "Smart Spending Insights",
  "Goal-Oriented Financial Planning",
];

export default function SoldiAboutSection() {
  const [activeItem, setActiveItem] = useState(0);

  return (
    <div className="bg-white min-h-screen font-sans px-8 md:px-16 py-14">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <button className="border border-gray-300 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-gray-600 hover:border-gray-500 transition-colors">
          About Moneygram
        </button>

        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-snug tracking-tight max-w-md">
          Smart Money{" "}
          <span className="relative inline-block">
            Transfer
            <svg
              className="absolute -bottom-1 left-0 w-full"
              height="6"
              viewBox="0 0 100 6"
              fill="none"
            >
              <path
                d="M0 5 Q25 1 50 3 Q75 5 100 2"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>{" "}
          Solutions
  
          For Your Business
        </h2>

        <button className="bg-[#E00000] hover:bg-[#a3e000] text-white font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap">
          Learn More
        </button>
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr_1.2fr] gap-5 items-stretch">
        
        {/* Left: Menu Items */}
        <div className="flex flex-col gap-3">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveItem(i)}
              className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl font-bold text-left text-base transition-all duration-200 ${
                activeItem === i
                  ? "bg-[#421010] text-white shadow-lg"
                  : "bg-[#FCE8E8] text-gray-800 hover:bg-[#e4fad6]"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  activeItem === i
                    ? "bg-[#E00000] text-white"
                    : "bg-white text-gray-500"
                }`}
              >
                <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
        </div>

        {/* Center: Photo */}
        <div className="rounded-3xl overflow-hidden shadow-xl h-9/12">
          <img src={about} alt="" />
        </div>

        {/* Right: Info Card */}
        <div className="bg-[#fff0f1] rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden h-9/12">
          {/* Asterisk ornament */}
          <div className="absolute bottom-8 right-8 opacity-20">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 0v40M0 20h40M6 6l28 28M34 6L6 34" stroke="#334155" strokeWidth="2" />
            </svg>
          </div>

          <h3 className="text-xl font-black text-gray-900 leading-snug mb-3 max-w-xs">
            Receive Early Payments Within 24 Hours
          </h3>

          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
            We would like to confirm that the money transfer has been initiated the
            funds are being processed through our secure payment system
          </p>

          <div className="flex flex-col gap-3">
            {features.map((feat, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm w-fit"
              >
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-gray-900" strokeWidth={3} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}