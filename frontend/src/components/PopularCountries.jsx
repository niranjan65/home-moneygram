const currencies = [
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#B22234"/>
        <rect y="10" width="60" height="8" fill="white"/>
        <rect y="26" width="60" height="8" fill="white"/>
        <rect y="42" width="60" height="8" fill="white"/>
        <rect width="30" height="32" fill="#3C3B6E"/>
        {[0,1,2,3,4].map(row => [0,1,2,3,4,5].slice(0, row%2===0?6:5).map((col, i) => (
          <text key={`${row}-${i}`} x={row%2===0 ? 2+col*5 : 4.5+i*5} y={6+row*6} fontSize="4" fill="white">★</text>
        )))}
      </svg>
    ),
    name: "British Pound",
    desc: "The British Pound (GBP) also known the sterling is the official currency",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#000"/>
        <circle cx="30" cy="30" r="30" clipPath="url(#c1)" fill="#000"/>
        <rect y="0" width="60" height="20" fill="#D21034"/>
        <rect y="20" width="60" height="20" fill="#000"/>
        <rect y="40" width="60" height="20" fill="#007229"/>
        <circle cx="24" cy="30" r="8" fill="#000"/>
        <circle cx="27" cy="30" r="8" fill="#007229"/>
      </svg>
    ),
    name: "Sudan Euro",
    desc: "The Euro (EUR) is a widely accepted and stable currency used across much",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#FFCE00"/>
        <rect y="0" width="60" height="20" fill="#000"/>
        <rect y="40" width="60" height="20" fill="#DD0000"/>
      </svg>
    ),
    name: "German Deutsche",
    desc: "The German Deutsche Mark (DM) was the official currency of Germany",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#006600"/>
        <circle cx="30" cy="30" r="14" fill="#FF0000" stroke="white" strokeWidth="2"/>
        <circle cx="30" cy="30" r="5" fill="white"/>
        <text x="30" y="34" textAnchor="middle" fontSize="8" fill="#006600">✦</text>
      </svg>
    ),
    name: "Portuguese Euro",
    desc: "The Euro (EUR) is the official currency of Portugal and has been use since 2002",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#EF2B2D"/>
        <rect x="0" y="22" width="60" height="16" fill="white"/>
        <rect x="22" y="0" width="16" height="60" fill="white"/>
        <rect x="0" y="24" width="60" height="12" fill="#002868"/>
        <rect x="24" y="0" width="12" height="60" fill="#002868"/>
      </svg>
    ),
    name: "Norwegian krone",
    desc: "The Norwegian Krone (NOK) is the official currency of Norway and is known",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#E30A17"/>
        <circle cx="28" cy="30" r="11" fill="white"/>
        <circle cx="32" cy="30" r="11" fill="#E30A17"/>
        <polygon points="38,24 39.5,28.5 44,28.5 40.5,31.5 42,36 38,33 34,36 35.5,31.5 32,28.5 36.5,28.5" fill="white"/>
      </svg>
    ),
    name: "Turkish Lira",
    desc: "The Turkish Lira is the official currency of Turkey and is widely used across",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#FF0000"/>
        <rect x="24" y="0" width="12" height="60" fill="white"/>
        <rect x="0" y="24" width="60" height="12" fill="white"/>
        <circle cx="30" cy="30" r="10" fill="#FF0000"/>
        <polygon points="30,22 32,28 38,28 33,32 35,38 30,34 25,38 27,32 22,28 28,28" fill="#FF0000" stroke="white" strokeWidth="0.5"/>
        <text x="30" y="34" textAnchor="middle" fontSize="10" fill="white">🍁</text>
      </svg>
    ),
    name: "Canadian Dollar",
    desc: "The Canadian Dollar (CAD) is the official currency of Canada and traded",
  },
  {
    flag: (
      <svg viewBox="0 0 60 60" className="w-full h-full">
        <circle cx="30" cy="30" r="30" fill="#00008B"/>
        <rect x="0" y="0" width="30" height="30" fill="#012169"/>
        <line x1="0" y1="0" x2="30" y2="30" stroke="white" strokeWidth="5"/>
        <line x1="30" y1="0" x2="0" y2="30" stroke="white" strokeWidth="5"/>
        <line x1="0" y1="0" x2="30" y2="30" stroke="#C8102E" strokeWidth="3"/>
        <line x1="30" y1="0" x2="0" y2="30" stroke="#C8102E" strokeWidth="3"/>
        <rect x="12" y="0" width="6" height="30" fill="white"/>
        <rect x="0" y="12" width="30" height="6" fill="white"/>
        <rect x="13" y="0" width="4" height="30" fill="#C8102E"/>
        <rect x="0" y="13" width="30" height="4" fill="#C8102E"/>
      </svg>
    ),
    name: "Australian Dollar",
    desc: "The Australian Dollar (AUD) is the official currency of Australia and recognized",
  },
];

export default function PopularCountries() {
  return (
    <div className="bg-white min-h-screen font-sans px-8 md:px-16 py-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-14 gap-4">
        <button className="border border-gray-300 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-gray-600">
          We Are Covering
        </button>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-snug tracking-tight">
          Popular Countries Our{" "}
          <span className="relative inline-block">
            Customers
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
              <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </span>
          <br />
          Transfer Money
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currencies.map((c, i) => (
          <div
            key={i}
            className="bg-[#fff0f0] rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
          >
            {/* Flag + Name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                {c.flag}
              </div>
              <h3 className="text-base font-black text-gray-900 leading-snug">{c.name}</h3>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed flex-1">{c.desc}</p>

            {/* Send Money link */}
            <button className="text-sm font-bold text-gray-900 underline underline-offset-2 w-fit hover:text-gray-600 transition-colors">
              Send Money
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}