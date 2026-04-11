import { ArrowRight, BanknoteArrowUp, Headphones } from "lucide-react";
import whychooseus from '../assets/whychooseus.png'

export default function WhyChooseUs() {
    const Items = [
        {icon: "", label: "Regular Payments", context: "Set up regular payments to save time and ensure your bills or subscriptions are always paid on time utilities loan"},
        {icon: "", label: "Bank beating rates", context: "Enjoy bank beating rates that help you get more for your money sending funds abroad converting currencies or investing"},
    ]
  return (
    <div className="bg-[url('../assets/redbg.png')] min-h-screen font-sans px-8 md:px-16 flex items-center justify-between ">
      {/* Header */}
      <div className="flex flex-col gap-8 mb-14 w-xl">
        <button className="self-start bg-white border border-[#E00000] rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-[#E00000] whitespace-nowrap hover:border-gray-500 transition-colors flex-shrink-0">
          Why Choose Us
        </button>

        <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-snug tracking-tight">
          Secure Easy & Safe{" "}
          <span className="relative inline-block">
            Hassle
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 80 6" fill="none">
              <path d="M0 5 Q20 1 40 3 Q60 5 80 2" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          <br />
          Free Money Transfer Solution
        </h2>

        <p className=" text-sm text-[#555555]">The money transfer has been successfully completed and the amount has been sent to the designated account please note that processing times</p>

        {
            Items?.map((item, idx) => {
                return <div className=" flex items-start gap-6">
                    <div className="h-12 w-12 bg-amber-300 rounded-full p-2 flex items-center justify-center">
                        <BanknoteArrowUp />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl">{item.label}</h2>
                        <p className="text-[#555555] text-xs">{item.context}</p>
                    </div>
                </div>
            })
        }

        <div className="flex items-center gap-8">
            <button
                className="bg-[#E00000] text-white font-bold px-6 py-3 text-sm rounded-lg transition-all duration-200 shadow-[3px_3px_0px_0px_rgb(16,64,66)] flex items-center gap-2 group"
              >
                Get Started
                
              </button>

              <div className="flex">
                <Headphones />
                <span>+44 7820 124453</span>
              </div>
        </div>
      </div>

      <div>
        <img src={whychooseus} className="w-160 rounded-[20px]" alt="" />
      </div>
    </div>
  );
}