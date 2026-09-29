import { ArrowRight, ShieldCheck, Banknote, Headphones, CheckCircle2 } from "lucide-react";
import whychooseus from '../assets/whychooseus.png';
import { Link } from "react-router-dom";

export default function WhyChooseUs() {
  const items = [
    {
      icon: <Banknote size={24} className="text-[#E00000]" />,
      label: "Bank-Beating FX Rates",
      context: "Enjoy wholesale competitive exchange rates that give you more Fijian Dollars for your overseas transfers and travel currencies."
    },
    {
      icon: <ShieldCheck size={24} className="text-[#E00000]" />,
      label: "Full RBF Regulatory Protection",
      context: "Operate with absolute peace of mind under strict Reserve Bank of Fiji compliance rules and automated threshold tracking."
    },
    {
      icon: <CheckCircle2 size={24} className="text-[#E00000]" />,
      label: "Real-Time Vault Cash Availability",
      context: "Guaranteed note and coin denominations in stock across all teller drawers, preventing payout delays or stockouts."
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-950 font-sans px-6 md:px-16 py-20 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Value Proposition & Feature List */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <span className="self-start bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-full px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#E00000]">
            Why Choose MH Money Express
          </span>

          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Secure, Fast &amp; Reliable{" "}
            <span className="text-[#E00000] relative inline-block">
              Foreign Exchange
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
                <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#E00000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
            <br />
            For Remitters &amp; Travelers
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            MH Money Express provides end-to-end transparency for retail currency exchange and MoneyGram remittances with official ERPNext integration and verified accounting records.
          </p>

          <div className="flex flex-col gap-4 mt-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80">
                <div className="h-12 w-12 bg-red-100 dark:bg-red-950/80 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 leading-relaxed">{item.context}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-4">
            <Link
              to="/money-transfer"
              className="bg-[#E00000] hover:bg-[#C50000] text-white font-bold px-7 py-3.5 text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 group"
            >
              Get Started Now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <Headphones size={16} className="text-[#E00000]" />
              <span>Customer Helpdesk Available</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-amber-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500" />
            <img 
              src={whychooseus} 
              className="relative w-full max-w-lg rounded-3xl shadow-2xl object-cover border-4 border-white dark:border-gray-800" 
              alt="Why Choose MH Money Express" 
            />
          </div>
        </div>

      </div>
    </div>
  );
}