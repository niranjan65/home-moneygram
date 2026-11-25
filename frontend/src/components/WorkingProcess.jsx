import { ArrowUpRight } from "lucide-react";

const steps = [
  {
    step: "STEP 01",
    title: "Create An Account",
    desc: "Creating an account is quick easy and free simply provide your basic information choose a secure password",
    icon: (
      <svg width="52" height="44" viewBox="0 0 52 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-gray-100">
        <rect x="1" y="5" width="38" height="26" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="5" y="9" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="5" y1="21" x2="20" y2="21" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="25" x2="15" y2="25" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="22" y="18" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="#E00000" fillOpacity="0.15"/>
        <circle cx="32" cy="26" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="38" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="38" y1="26" x2="46" y2="26" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="38" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    step: "STEP 02",
    title: "Attach Bank Account",
    desc: "To complete your setup please attach your bank account securely. Linking your account allows for smooth",
    icon: (
      <svg width="52" height="44" viewBox="0 0 52 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-gray-100">
        <polygon points="26,2 50,16 2,16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <rect x="6" y="16" width="6" height="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="16" y="16" width="6" height="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="26" y="16" width="6" height="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="36" y="16" width="6" height="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="2" y1="34" x2="50" y2="34" stroke="currentColor" strokeWidth="2"/>
        <line x1="2" y1="38" x2="50" y2="38" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"/>
      </svg>
    ),
  },
  {
    step: "STEP 03",
    title: "Send Money",
    desc: "Sending money is fast secure and convenient. Simply choose the recipient enter the amount and confirm",
    icon: (
      <svg width="52" height="44" viewBox="0 0 52 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-gray-100">
        <rect x="8" y="6" width="36" height="26" rx="4" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 2"/>
        <rect x="14" y="12" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="26" y1="17" x2="34" y2="17" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="26" y1="21" x2="32" y2="21" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="26" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M36 30 L44 36 L36 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="28" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function WorkingProcess() {
  return (
    <div className="bg-surface text-ink min-h-screen font-sans px-8 md:px-16 py-16 transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-14">
        <button className="border border-line rounded-full px-5 py-2 text-overline font-semibold tracking-wider uppercase text-muted whitespace-nowrap hover:border-brand-600 transition-colors flex-shrink-0">
          Working Process
        </button>

        <h2 className="text-h1 font-bold text-ink leading-snug tracking-tight">
          How It Works Easy{" "}
          <span className="relative inline-block">
            Steps
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 80 6" fill="none">
              <path d="M0 5 Q20 1 40 3 Q60 5 80 2" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          <br />
          To Get Started
        </h2>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div
            key={i}
            className="bg-[#FCE8E8] dark:bg-[#181B24] border border-transparent dark:border-line rounded-3xl p-7 flex flex-col gap-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group text-ink"
          >
            {/* Icon + Step Badge Row */}
            <div className="flex items-start justify-between">
              <div className="opacity-90 group-hover:scale-105 transition-transform duration-200">
                {s.icon}
              </div>
              <span className="bg-brand-600 text-white text-caption font-semibold px-3 py-1.5 rounded-lg tracking-wider">
                {s.step}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-h2 font-bold text-ink leading-snug">{s.title}</h3>

            {/* Description */}
            <p className="text-muted dark:text-[#D1D5DB] text-body font-normal leading-relaxed flex-1">{s.desc}</p>

            {/* CTA */}
            <button className="flex items-center gap-1.5 text-label font-semibold text-ink hover:text-brand-600 transition-colors w-fit group/btn cursor-pointer">
              <span className="border-b border-current transition-colors pb-0.5">
                Get Started
              </span>
              <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}