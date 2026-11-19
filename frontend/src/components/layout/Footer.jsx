import { Link } from "react-router-dom";
import mhlogo from "../../assets/MH.png";
import { ShieldCheck, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-[80%] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          
          {/* Col 1: Brand & RBF info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src={mhlogo} alt="MH Money Express" className="h-10 w-auto bg-white/10 p-1.5 rounded-lg" />
              <span className="font-bold text-white text-base tracking-tight">MH MONEY EXPRESS</span>
            </div>
            <p className="text-caption text-gray-400 leading-relaxed font-normal">
              Authorized Foreign Exchange Dealer &amp; Principal Agent of MoneyGram in Fiji. Licensed and regulated by the Reserve Bank of Fiji (RBF).
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-900/60 text-overline font-semibold text-red-200 w-fit">
              <ShieldCheck size={14} className="text-[#E00000]" />
              <span>RBF Licensed &amp; Regulated</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-white text-label font-bold uppercase tracking-wider mb-4">Operations &amp; POS</h4>
            <ul className="space-y-2.5 text-caption font-normal">
              <li>
                <Link to="/money-transfer" className="hover:text-white transition-colors">MoneyGram Money Transfer</Link>
              </li>
              <li>
                <Link to="/exchange" className="hover:text-white transition-colors">Retail Currency Exchange</Link>
              </li>
              <li>
                <Link to="/dealer-exchange" className="hover:text-white transition-colors">Commercial Dealer Exchange</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition-colors">Day-End Teller Reports</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Transparency */}
          <div>
            <h4 className="text-white text-label font-bold uppercase tracking-wider mb-4">Compliance</h4>
            <ul className="space-y-2.5 text-caption text-gray-400 font-normal">
              <li>RBF Foreign Currency Limits</li>
              <li>TIN Clearance Validation</li>
              <li>KYC &amp; Government ID Verification</li>
              <li>Anti-Money Laundering (AML) Compliance</li>
            </ul>
          </div>

          {/* Col 4: Network & Locations */}
          <div>
            <h4 className="text-white text-label font-bold uppercase tracking-wider mb-4">Suva Head Office</h4>
            <ul className="space-y-2.5 text-caption text-gray-400 font-normal">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E00000] shrink-0" />
                <span>MH Building, Rodwell Road, Suva, Fiji</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#E00000] shrink-0" />
                <span>+679 331 5199</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#E00000] shrink-0" />
                <span>info@mhmoneyexpress.com.fj</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-gray-500 font-normal">
          <p>© {new Date().getFullYear()} MH Money Express (MMEL). Principal MoneyGram Agent in Fiji. All rights reserved.</p>
          <p className="text-overline text-gray-600">ERPNext Powered Financial POS System</p>
        </div>
      </div>
    </footer>
  );
}
