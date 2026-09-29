import { useState } from "react";
import { ArrowRight, ShieldCheck, Globe, Zap, CheckCircle2, Lock, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import feature1 from "../assets/feature1.png";
import feature2 from "../assets/feature2.png";
import feature3 from "../assets/feature3.png";
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
    { name: "LUCY", color: "bg-red-500", initial: "L" },
    { name: "STACY", color: "bg-amber-500", initial: "S" },
    { name: "LUNA", color: "bg-emerald-500", initial: "L" },
    { name: "JANE", color: "bg-blue-500", initial: "J" },
    { name: "JOHN", color: "bg-purple-500", initial: "J" },
  ];

  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative ambient glow */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-red-500/20 to-amber-500/10 blur-3xl -z-10" />

      {/* Floating Live Rate Pill - Top Left */}
      <div className="absolute -top-4 -left-4 sm:-left-8 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-xl border border-red-100 dark:border-gray-800 flex items-center gap-2 animate-bounce duration-1000">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Rate</p>
          <p className="text-xs font-black text-gray-900 dark:text-white">1 FJD = 0.4430 USD</p>
        </div>
      </div>

      {/* Floating Trust Badge - Bottom Right */}
      <div className="absolute -bottom-4 -right-4 sm:-right-8 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-xl border border-red-100 dark:border-gray-800 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-[#E00000]">
          <ShieldCheck size={16} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Security</p>
          <p className="text-xs font-black text-gray-900 dark:text-white">RBF Authorized</p>
        </div>
      </div>

      {/* Phone Hardware Shell */}
      <div
        className="relative z-10 w-64 sm:w-72 bg-gray-950 rounded-[3rem] shadow-2xl overflow-hidden border-4 border-gray-800/80 p-2"
        style={{ height: "510px" }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-900/80 mr-2" />
          <div className="w-10 h-1 bg-gray-800 rounded-full" />
        </div>

        {/* Screen Content */}
        <div className="bg-gray-50 dark:bg-gray-900 h-full rounded-[2.5rem] pt-7 pb-4 px-3 flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between px-1 pt-1 pb-2">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold">MH Money Express</p>
                <p className="text-xs font-black text-gray-900 dark:text-white">Suva Terminal POS</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-red-100 text-[#E00000] flex items-center justify-center text-[10px] font-black">
                FJ
              </div>
            </div>

            {/* Balance Card in MH Red */}
            <div className="rounded-2xl bg-gradient-to-br from-[#E00000] via-[#C50000] to-[#990000] p-4 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex justify-between items-center text-[10px] font-semibold opacity-90 mb-1">
                <span>ACTIVE VAULT BALANCE</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px]">Verified</span>
              </div>
              <p className="text-2xl font-black tracking-tight">$ 320,299.00</p>
              <p className="text-[10px] opacity-80 mb-3">Branch Vault #01 · FJD Cash</p>
              
              <div className="flex items-center gap-2 pt-1 border-t border-white/20">
                <Link
                  to="/money-transfer"
                  className="flex-1 bg-white text-[#E00000] hover:bg-gray-100 text-[10px] font-black py-1.5 rounded-xl text-center shadow-xs transition"
                >
                  Send
                </Link>
                <Link
                  to="/exchange"
                  className="flex-1 bg-black/30 hover:bg-black/40 text-white text-[10px] font-black py-1.5 rounded-xl text-center border border-white/20 transition"
                >
                  Exchange
                </Link>
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="mt-3.5">
              <p className="text-[10px] font-bold text-gray-400 mb-2 px-1">Frequent Receivers</p>
              <div className="flex justify-between px-1">
                {contacts.map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white text-[10px] font-black shadow-xs`}>
                      {c.initial}
                    </div>
                    <span className="text-[8px] font-bold text-gray-500">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MoneyGram Active Remittance Pill */}
            <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">MoneyGram Inward</span>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">Paid Out</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Ref: MG-84920</span>
                <span className="font-black text-gray-900 dark:text-white">$ 1,250.00 FJD</span>
              </div>
            </div>
          </div>

          {/* Bottom Device Indicator */}
          <div className="flex justify-center pt-2">
            <div className="w-20 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
};

const StatItem = ({ value, label, subtext }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{value}</span>
    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{label}</span>
    {subtext && <span className="text-[11px] text-gray-500">{subtext}</span>}
  </div>
);

const features = [
  {
    icon: <ShieldCheck size={22} className="text-[#E00000]" />,
    title: "Fair & Honest Transactions",
    desc: "Complete fee transparency with zero hidden commissions, verified mid-market rates, and instant digital audit trails.",
    mockup: feature1,
  },
  {
    icon: <Lock size={22} className="text-[#E00000]" />,
    title: "Robust Data Protection",
    desc: "Enterprise-grade encryption and full Reserve Bank of Fiji (RBF) compliance rules safeguard every customer transaction.",
    mockup: feature2,
  },
  {
    icon: <Globe size={22} className="text-[#E00000]" />,
    title: "Global Money Transfers",
    desc: "Seamlessly send and receive remittance funds across 200+ countries and territories through the MoneyGram network.",
    mockup: feature3,
  },
];

export default function SoldiLanding() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen font-sans overflow-hidden bg-[url('../assets/redbg.png')] bg-cover bg-fixed">
      <Navbar />

      {/* Main Hero Section: Back-and-Forth Layout (Headline/CTA on Left, Visual Phone on Right) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Heading, Value Proposition, Action CTAs, and Stats (Swapped from right!) */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div>
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 border border-red-200 bg-white/90 shadow-xs rounded-full px-4 py-1.5 text-xs font-bold text-[#E00000] tracking-wider uppercase mb-4 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                MH Money Express · Authorized MoneyGram Principal Agent
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.12] tracking-tight">
                Fast &amp; Secure{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E00000] via-[#C50000] to-[#990000]">
                  International
                </span>
                <br />
                Money Transfers
                <br />
                <span className="relative inline-block mt-1">
                  &amp; Currency Exchange
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                    <path
                      d="M0 6 Q37.5 0 75 4 Q112.5 8 150 4 Q187.5 0 225 4 Q262.5 8 300 4"
                      stroke="#E00000"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </div>

            <p className="text-base text-gray-600 leading-relaxed max-w-xl">
              Fiji's premier authorized foreign exchange dealer and global remittance hub. Experience guaranteed vault cash availability, transparent mid-market exchange rates, and strict RBF regulatory compliance.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <Link
                to="/money-transfer"
                className="bg-[#E00000] hover:bg-[#C50000] text-white font-extrabold px-7 py-3.5 text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 flex items-center gap-2 group"
              >
                Transfer Money
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/exchange"
                className="bg-white hover:bg-gray-50 text-gray-900 font-extrabold px-6 py-3.5 text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 flex items-center gap-2 group"
              >
                Exchange Currency
                <ArrowUpRight size={16} className="text-[#E00000] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                to="/dealer-exchange"
                className="text-xs font-bold text-gray-700 hover:text-[#E00000] transition-colors py-2 px-3 underline underline-offset-4"
              >
                Dealer Wholesale &gt;
              </Link>
            </div>

            {/* Quick Stats Grid Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200/80 mt-2">
              <StatItem value="10M+" label="Global Users" subtext="Across MoneyGram" />
              <StatItem value="15+" label="Currencies" subtext="Live In Vault" />
              <StatItem value="$8B+" label="Volume Managed" subtext="Secure Transfers" />
              <StatItem value="100%" label="RBF Compliant" subtext="Licensed Dealer" />
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup & Visual (Swapped from center/left!) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <PhoneMockup />
          </div>

        </div>
      </section>

      {/* Currency Exchange Calculator Section */}
      <section className="relative z-20 px-6 md:px-12 pb-16">
        <SoldiExchangeForm />
      </section>

      {/* Features Section: Matching MH Theme with Premium Dark Obsidian Glass */}
      <section className="w-full bg-gradient-to-b from-gray-950 via-gray-900 to-[#1e0404] text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-16 py-20">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-14">
            <span className="bg-red-500/10 border border-red-500/30 rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase text-red-400">
              Our Core Capabilities
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-left md:text-center leading-snug tracking-tight max-w-md text-white">
              World-Class &amp;{" "}
              <span className="text-[#E00000] relative inline-block">
                Fastest
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
                  <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#E00000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <br />
              Remittance &amp; Forex Services
            </h2>

            <Link
              to="/money-transfer"
              className="bg-[#E00000] hover:bg-[#C50000] text-white font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-white/10 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col items-center justify-between shadow-xl"
                style={{
                  transform: hoveredCard === i ? "translateY(-6px)" : "none",
                }}
              >
                <div className="p-8 pb-0 w-full">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/40 flex items-center justify-center mb-5 shadow-md">
                    {f.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-extrabold text-lg leading-snug mb-2">{f.title}</h3>

                  {/* Description */}
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">{f.desc}</p>
                </div>

                {/* Mockup Preview */}
                <div className="w-56 mt-4 opacity-90 hover:opacity-100 transition-opacity">
                  <img src={f.mockup} alt={f.title} className="w-full h-auto object-contain" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Alternating Back-and-Forth Section 1: About MH Money Express (Image Left, Tabs Right) */}
      <section>
        <SoldiAboutSection />
      </section>

      {/* Alternating Section 2: Working Process (How It Works) */}
      <section>
        <WorkingProcess />
      </section>

      {/* Alternating Section 3: Why Choose Us (Content Left, Graphic Right) */}
      <section>
        <WhyChooseUs />
      </section>

      {/* Section 4: Popular Countries Network */}
      <section>
        <PopularCountries />
      </section>

      {/* Section 5: Real-Time Official Daily Rates Table */}
      <section className="relative z-10 w-full mt-4">
        <SoldiRatesSection />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}