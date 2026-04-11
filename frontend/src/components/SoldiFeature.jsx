import { useState } from "react";
import { Diamond, Zap, Shield, Globe, ArrowRight } from "lucide-react";

const partners = [
  { name: "Border", icon: <Diamond size={18} className="text-white" /> },
  { name: "Nextmove", icon: <Zap size={18} className="text-white" /> },
  { name: "Proline", icon: <Zap size={18} className="text-white" /> },
  { name: "Penta", icon: <ArrowRight size={18} className="text-white" /> },
  { name: "Network", icon: <Zap size={18} className="text-white" /> },
];

const PhoneTransactionMockup = () => (
  <div className="relative mt-6 flex justify-center">
    <div className="relative w-44 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100" style={{ height: "210px" }}>
      <div className="bg-gray-50 px-3 pt-3 pb-2">
        <p className="text-[9px] text-gray-400">← Transaction</p>
      </div>
      {/* Balance card */}
      <div className="mx-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 p-2 text-white text-[9px]">
        <p className="opacity-70">Main Wallet</p>
        <p className="font-bold text-sm">$ 320,299</p>
        <div className="flex gap-1 mt-1">
          <button className="bg-white/20 rounded-full px-2 py-0.5 text-[8px]">Send Money</button>
          <button className="bg-white/20 rounded-full px-2 py-0.5 text-[8px]">Request Money</button>
        </div>
      </div>
      {/* Connected card pill */}
      <div className="mx-2 mt-1 bg-blue-50 rounded-lg p-1.5 flex items-center gap-1">
        <div className="w-5 h-5 rounded bg-blue-400" />
        <div>
          <p className="text-[8px] font-semibold text-gray-700">Halca Alane</p>
          <p className="text-[7px] text-gray-400">2462 6334 8503***</p>
        </div>
        <div className="ml-auto w-6 h-3 bg-blue-200 rounded-full" />
      </div>
      {/* Transaction row */}
      <div className="mx-2 mt-1 text-[8px] text-gray-500 flex justify-between px-1">
        <span>Search Transaction</span>
        <span>≡</span>
      </div>
      <div className="mx-2 mt-1 flex justify-between items-center text-[8px]">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-gray-200" />
          <div>
            <p className="font-semibold text-gray-700 text-[8px]">Alycia Markel</p>
            <p className="text-gray-400 text-[7px]">25 Mar 2023</p>
          </div>
        </div>
        <span className="text-red-500 font-bold">-$75.01</span>
      </div>
    </div>

    {/* Floating MasterCard */}
    <div className="absolute -right-2 top-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl shadow-xl p-3 w-28" style={{ transform: "rotate(8deg)" }}>
      <div className="flex justify-end mb-4">
        <div className="w-6 h-6 rounded bg-white/20" />
      </div>
      <p className="text-white text-[9px] font-bold">MasterCard</p>
      <p className="text-white/60 text-[8px]">6334 8503****</p>
      <div className="flex justify-end mt-1">
        <div className="w-6 h-3 rounded-full bg-gray-300/50" />
      </div>
    </div>

    {/* Asterisk ornament */}
    <div className="absolute bottom-4 right-4 opacity-30">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 0v28M0 14h28M4 4l20 20M24 4L4 24" stroke="white" strokeWidth="1.5" />
      </svg>
    </div>
  </div>
);

const PersonWithCardsMockup = () => (
  <div className="relative mt-6 flex justify-center items-end h-52">
    {/* Person silhouette */}
    <div className="relative z-10 flex flex-col items-center justify-end h-full">
      <div className="w-32 h-44 bg-gradient-to-b from-amber-200 to-amber-300 rounded-t-full relative overflow-hidden shadow-lg">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-400 rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-amber-100 rounded-t-3xl" />
      </div>
    </div>

    {/* Euro card */}
    <div className="absolute left-0 bottom-8 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20">
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
        <span className="text-yellow-300 text-xs font-bold">€</span>
      </div>
      <div>
        <p className="text-[10px] text-gray-500">Euro</p>
        <p className="text-sm font-black text-gray-900">€400</p>
      </div>
    </div>

    {/* Balance card */}
    <div className="absolute right-0 top-4 bg-gray-900 rounded-2xl shadow-xl px-3 py-2 z-20 w-28" style={{ transform: "rotate(-6deg)" }}>
      <p className="text-[8px] text-gray-400">Balance</p>
      <p className="text-white font-bold text-xs">$3,403.09</p>
      <p className="text-[7px] text-gray-500 mt-0.5">15,000 · Card One</p>
      <div className="flex justify-end mt-1">
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <div className="w-4 h-4 rounded-full bg-yellow-400" />
        </div>
      </div>
    </div>

    {/* Green shape */}
    <div className="absolute bottom-0 right-8 w-10 h-10 bg-green-400 rounded-full opacity-60" />
  </div>
);

const AccountPhoneMockup = () => (
  <div className="relative mt-6 flex justify-center">
    <div className="relative w-44 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100" style={{ height: "210px" }}>
      <div className="bg-gray-50 px-3 pt-3 pb-1 text-[9px] text-gray-400">Account</div>
      {/* US Dollar row */}
      <div className="mx-2 mt-1 bg-white rounded-xl shadow-sm p-2 flex items-center gap-2 border border-gray-100">
        <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-red-50">
          <span className="text-[10px]">🇺🇸</span>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-700">US Dollar</p>
          <p className="text-sm font-black text-gray-900">$900</p>
        </div>
      </div>
      {/* Blue card */}
      <div className="mx-2 mt-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-2 text-white">
        <p className="text-[8px] opacity-70">•••• 5978 5090 6020</p>
        <div className="flex justify-between items-center mt-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-red-400 opacity-90" />
            <div className="w-4 h-4 rounded-full bg-yellow-300" />
          </div>
          <div className="w-6 h-3 bg-white/20 rounded" />
        </div>
      </div>
      {/* Detail info */}
      <div className="mx-2 mt-1 text-[8px] text-gray-500">
        <p className="font-semibold text-gray-600 mb-0.5">DETAIL INFORMATION</p>
        {["Contact Name", "Phone Number", "ID Card", "Email"].map((f) => (
          <div key={f} className="flex justify-between border-b border-gray-50 py-0.5">
            <span className="text-gray-400">{f}</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const features = [
  {
    icon: <Shield size={22} className="text-yellow-800" />,
    title: "Fair & Honest Transactions",
    desc: "Fair and honest transactions are the foundation of trust in any financial or business relationship",
    mockup: <PhoneTransactionMockup />,
  },
  {
    icon: <Shield size={22} className="text-yellow-800" />,
    title: "Robust Data Protection",
    desc: "Robust data protection is essential in the safeguarding sensitive information from unauthorized access",
    mockup: <PersonWithCardsMockup />,
  },
  {
    icon: <Globe size={22} className="text-yellow-800" />,
    title: "Global Money Transfers",
    desc: "Global money transfers enable individuals & businesses to send funds across borders traditional banking",
    mockup: <AccountPhoneMockup />,
  },
];

export default function SoldiFeatures() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-[#0d3d2e] text-white font-sans">
      {/* Partners Bar */}
      <div className="border-b border-white/10 px-8 md:px-16 py-5 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 justify-between">
        <p className="text-[#b5f000] text-xs font-bold leading-tight max-w-[180px] tracking-wide uppercase">
          We are partnered with more than 1000+ companies around the globe
        </p>
        <div className="flex items-center gap-8 md:gap-12">
          {partners.map((p) => (
            <div key={p.name} className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="opacity-70">{p.icon}</span>
              <span className="text-white font-bold text-sm tracking-tight">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="px-8 md:px-16 py-14">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <button className="border border-white/30 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-white hover:border-white/60 transition-colors">
            Our Features
          </button>

          <h2 className="text-3xl md:text-4xl font-black text-center leading-snug tracking-tight max-w-md">
            Get World Class &amp;{" "}
            <span className="relative inline-block">
              Fastest
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
                <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#b5f000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            <br />
            Online Payment Service
          </h2>

          <button className="bg-[#b5f000] hover:bg-[#a3e000] text-gray-900 font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
            Learn More
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative bg-[#0f4a37] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-[#115540]"
              style={{
                boxShadow: hoveredCard === i ? "0 20px 60px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.2)",
                transform: hoveredCard === i ? "translateY(-4px)" : "none",
              }}
            >
              <div className="p-7 pb-0">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center mb-5 shadow-md">
                  {f.icon}
                </div>

                {/* Title */}
                <h3 className="text-white font-bold text-lg leading-snug mb-3">{f.title}</h3>

                {/* Description */}
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>

              {/* Mockup */}
              <div className="px-4 pb-0 overflow-hidden">
                {f.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}