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

      <section className="bg-background-light dark:bg-background-dark py-5 px-6 min-h-screen">
        
        {/* Header */}
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            Contact Us
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about currency exchange or international transfers?
            We're here to help.
          </p>
        </div>

        {/* Main Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

          {/* Contact Form */}
          <div className="bg-white dark:bg-[#1a2c20] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">

            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="5"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary transition custom-scrollbar"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full bg-primary text-black font-semibold py-3 rounded-lg hover:opacity-90 transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-8">

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                info@mhmoneyexpress.com
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Phone
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                +679 229 5700 / +679  229 5701 / +679 229 5702/ +679 229 5703
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Office Address
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                MH MONEY EXPRESS PTE LIMITED
             <br />
                18 Ellery Street, Suva.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
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

