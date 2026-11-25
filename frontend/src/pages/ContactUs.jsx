import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
  };

  return (
    <>
      <Navbar />

      <section className="bg-page text-ink py-10 px-6 min-h-screen transition-colors">
        
        {/* Header */}
        <div className="max-w-[80%] mx-auto text-center mb-14">
          <h1 className="text-display font-bold text-ink mb-6">
            Contact Us
          </h1>

          <p className="text-body font-normal text-muted max-w-2xl mx-auto leading-relaxed">
            Have questions about currency exchange or international transfers?
            We're here to help.
          </p>
        </div>

        {/* Main Grid */}
        <div className="max-w-[80%] mx-auto grid md:grid-cols-2 gap-12">

          {/* Contact Form */}
          <div className="bg-surface p-8 rounded-2xl shadow-xl border border-line text-ink">

            <h2 className="text-h2 font-bold mb-6 text-ink">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="block text-label font-semibold mb-2 text-ink">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-body font-normal focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-label font-semibold mb-2 text-ink">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-body font-normal focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-label font-semibold mb-2 text-ink">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-body font-normal focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-label font-semibold mb-2 text-ink">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="5"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface text-ink text-body font-normal focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition custom-scrollbar"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white text-btn-lg font-semibold py-3 rounded-lg transition shadow-md cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-8">

            <div>
              <h3 className="text-h3 font-bold text-ink mb-2">
                Email Support
              </h3>
              <p className="text-body font-normal text-muted">
                info@mhmoneyexpress.com
              </p>
            </div>

            <div>
              <h3 className="text-h3 font-bold text-ink mb-2">
                Phone
              </h3>
              <p className="text-body font-normal text-muted">
                +679 229 5700 / +679  229 5701 / +679 229 5702/ +679 229 5703
              </p>
            </div>

            <div>
              <h3 className="text-h3 font-bold text-ink mb-2">
                Office Address
              </h3>
              <p className="text-body font-normal text-muted">
                MH MONEY EXPRESS PTE LIMITED
             <br />
                18 Ellery Street, Suva.
              </p>
            </div>

            <div className="pt-6 border-t border-line">
              <p className="text-muted text-sm">
                We typically respond within 24 hours.
              </p>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}

