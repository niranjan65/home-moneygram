import { useState } from "react";
import { Play, ArrowRight, Shield, Globe } from "lucide-react";
import SoldiFeatures from "./SoldiFeature";
import feature1 from "../assets/feature1.png"
import feature2 from "../assets/feature2.png"
import feature3 from "../assets/feature3.png"
import SoldiAboutSection from "./SoldiAboutSection";
import WorkingProcess from "./WorkingProcess";
import WhyChooseUs from "./why-choose-us";
import PopularCountries from "./PopularCountries";
import Footer from "./layout/Footer";
import Navbar from "./layout/Navbar";
import SoldiExchangeForm from "./SoldiExchangeForm";
import SoldiRatesSection from "./SoldiRatesSection";

const PhoneMockup = () => {
  const contacts = [
    { name: "LUCY", color: "bg-yellow-400", initial: "L" },
    { name: "STACY", color: "bg-green-400", initial: "S" },
    { name: "LUNA", color: "bg-pink-400", initial: "L" },
    { name: "JANE", color: "bg-blue-400", initial: "J" },
    { name: "JHON", color: "bg-purple-400", initial: "J" },
  ];

  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative circle background */}
      <div className="absolute w-80 h-80 rounded-full border border-gray-100 opacity-60" />
      <div className="absolute w-96 h-96 rounded-full border border-gray-100 opacity-40" />

      {/* Phone */}
      <div className="relative z-10 w-60 bg-black rounded-[3rem] shadow-2xl overflow-hidden border-4 border-gray-800"
        style={{ height: "480px" }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-2xl z-20 mt-2" />

        {/* Screen */}
        <div className="bg-gray-50 h-full pt-8 pb-12 px-0 flex flex-col">
          {/* Header */}
          <div className="px-4 pt-2 pb-3">
            <p className="text-xs text-gray-400">Good Morning,</p>
            <p className="text-sm font-bold text-gray-900">Halca!</p>
          </div>

          {/* Balance Card */}
          <div className="mx-3 rounded-2xl bg-[#B70000] p-4 text-white shadow-lg">
            <p className="text-xs font-semibold opacity-80 mb-1">HALCA ALANE</p>
            <p className="text-2xl font-bold">$ 320,299</p>
            <p className="text-xs opacity-70 mb-3">Deposit 1234567890</p>
            <div className="flex gap-2 text-xs">
              <span className="opacity-80">Debit card &gt;</span>
            </div>
            <div className="flex gap-2 text-xs mt-1">
              <span className="opacity-80">E-wallet Top-up &gt;</span>
              <button className="ml-auto bg-white text-[#B70000] text-xs font-bold px-3 py-1 rounded-full">
                Transfer
              </button>
            </div>
          </div>

          {/* Contacts */}
          <div className="flex justify-between px-4 mt-4">
            {contacts.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-bold shadow`}>
                  {c.initial}
                </div>
                <span className="text-[9px] text-gray-500">{c.name}</span>
              </div>
            ))}
          </div>

          {/* Debit Card */}
          <div className="mx-3 mt-4 rounded-xl bg-gray-900 p-3 text-white shadow-lg">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                <span className="text-[6px] font-bold">M</span>
              </div>
              <span className="text-xs">Moneygram</span>
            </div>
            <div className="flex justify-between text-[10px] opacity-60 mb-1">
              <span>NAME</span>
              <span>NUM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">Halca Alane</span>
              <span className="text-xs tracking-widest">•••• •••• 3090</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] opacity-60">EXP 09/24</span>
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded-full bg-red-500 opacity-80" />
                <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-80 -ml-2" />
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm opacity-50" />
              </div>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-2">
            {["Home", "History", "Scan", "Service", "Account"].map((item) => (
              <button key={item} className="flex flex-col items-center gap-0.5">
                <div className="w-4 h-4 bg-gray-300 rounded" />
                <span className="text-[8px] text-gray-400">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ value, label }) => (
  <div className="flex flex-col gap-1">
    <span className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{value}</span>
    <span className="text-sm text-gray-400 font-medium">{label}</span>
    <div className="w-full border-b border-dashed border-gray-200 mt-2" />
  </div>
);

const features = [
  {
    icon: <Shield size={22} className="text-yellow-800" />,
    title: "Fair & Honest Transactions",
    desc: "Fair and honest transactions are the foundation of trust in any financial or business relationship",
    mockup: feature1,
  },
  {
    icon: <Shield size={22} className="text-yellow-800" />,
    title: "Robust Data Protection",
    desc: "Robust data protection is essential in the safeguarding sensitive information from unauthorized access",
    mockup: feature2,
  },
  {
    icon: <Globe size={22} className="text-yellow-800" />,
    title: "Global Money Transfers",
    desc: "Global money transfers enable individuals & businesses to send funds across borders traditional banking",
    mockup: feature3,
  },
];

export default function SoldiLanding() {
  const [hovered, setHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen font-sans overflow-hidden bg-[url('../assets/redbg.png')]">
      <Navbar />
      {/* Main Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 ">
        <div className="flex items-center justify-between gap-4  relative ">

          {/* Left: Stats */}
          <div className="flex flex-col gap-8">
            <StatItem value="10M+" label="Happy Global Users" />
            <StatItem value="49%" label="Higher Transactions" />
            <StatItem value="8B+" label="Money Managed" />
          </div>

          {/* Center: Phone */}
          <div className="flex justify-center absolute left-72">
            <PhoneMockup />
          </div>

          {/* Right: CTA Content */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="inline-block border border-gray-300 rounded-full px-4 py-1 text-xs font-semibold text-gray-600 tracking-widest uppercase mb-4">
                Easy Payment
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Fast &amp; Secure
                <br />
                International Money
                <br />
                <span className="relative inline-block">
                  Transfer Are Here
                  {/* Underline squiggle */}
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                    <path d="M0 6 Q37.5 0 75 4 Q112.5 8 150 4 Q187.5 0 225 4 Q262.5 8 300 4"
                      stroke="#84cc16" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
              With advanced encryption technologies global networks money transfer providers
              ensure that transactions are processed efficiently while safeguarding
            </p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="bg-[#E00000] hover:bg-[#e00000] text-white font-bold px-6 py-3 text-[10px] rounded-lg transition-all duration-200 shadow-[3px_3px_0px_0px_rgb(16,64,66)] flex items-center gap-2 group"
              >
                Transfer Money
                <ArrowRight size={14} className={`transition-transform duration-200 ${hovered ? "translate-x-1" : ""}`} />
              </button>

              <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors group">
                <div className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-400 transition-colors">
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                </div>
                See How Moneygram Works
              </button>
            </div>
          </div>

        </div>
      </section>

      <section className="relative z-20 px-6 md:px-12 pb-16">
        <SoldiExchangeForm />
      </section>

      <section className=" w-full bg-[#421010]">
        {/* Features Section */}
      <div className="px-8 md:px-16 py-14">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <button className="bg-white border border-[#E00000]/30 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-[#E00000] hover:border-white/60 transition-colors">
            Our Features
          </button>

          <h2 className="text-2xl md:text-3xl font-black text-center leading-snug tracking-tight max-w-md text-white">
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

          <button className="bg-white hover:bg-[#a3e000] text-[#E00000] font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
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
              className="relative bg-[#602020] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-between"
              style={{
                boxShadow: hoveredCard === i ? "0 20px 60px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.2)",
                transform: hoveredCard === i ? "translateY(-4px)" : "none",
              }}
            >
              <div className="p-7 pb-0">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center mb-5 shadow-md">
                  {f.icon}
                </div>

                {/* Title */}
                <h3 className="text-white font-bold text-lg leading-snug mb-3">{f.title}</h3>

                {/* Description */}
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>

              {/* Mockup */}
              <div className="w-56 ">
                <img src={f.mockup} alt="" />
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>

      <section>
        <SoldiAboutSection />
      </section>

      <section>
        <WorkingProcess />
      </section>

      <section>
        <WhyChooseUs />
      </section>

      <section>
        <PopularCountries />
      </section>

      <section className="relative z-10 w-full mt-10">
        <SoldiRatesSection />
      </section>

      <Footer />
      
    </div>
  );
}