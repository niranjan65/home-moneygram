import {
  FaGlobe,
  FaLock,
  FaBolt,
  FaChartLine,
} from "react-icons/fa";

export default function WhyChoose() {
  const features = [
    {
      icon: <FaGlobe />,
      title: "Global Coverage",
      desc: "Send and receive money across 170+ countries with real-time currency conversion.",
    },
    {
      icon: <FaLock />,
      title: "Secure & Encrypted",
      desc: "Bank-grade security, encrypted transactions, and regulatory compliance worldwide.",
    },
    {
      icon: <FaBolt />,
      title: "Fast Transfers",
      desc: "Instant or same-day transfers with transparent fees and no hidden charges.",
    },
    {
      icon: <FaChartLine />,
      title: "Live Exchange Rates",
      desc: "Mid-market rates with real-time tracking and smart rate alerts.",
    },
  ];

  return (
    <section className="bg-white dark:bg-background-dark py-16 px-6 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Why Choose MoneyGram?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Trusted worldwide for fast, secure and transparent transfers
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {features.map((item, index) => (
            <div
              key={index}
              className="bg-background-light dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition group"
            >
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
