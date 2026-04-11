export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Select your currencies",
      description:
        "Choose the currency you want to send and receive instantly.",
    },
    {
      number: "2",
      title: "Check live exchange rate",
      description:
        "View real-time mid-market rates with full transparency.",
    },
    {
      number: "3",
      title: "Confirm & transfer securely",
      description:
        "Complete your transaction safely with low fees and fast delivery.",
    },
  ];

  return (
    <section className="bg-background-light dark:bg-background-dark py-5 px-6 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            How It Works
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Simple steps to send and exchange money globally
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white dark:bg-background-dark border border-gray-100 dark:border-white/10 rounded-2xl p-8 shadow-lg hover:shadow-xl transition"
            >
              {/* Number Badge */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-6">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
