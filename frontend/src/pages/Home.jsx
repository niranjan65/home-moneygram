import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import RatesSection from "../components/home/RatesSection";
import HowItWorks from "../components/home/HowItWorks";
import WhyChoose from "../components/home/WhyChoose";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <RatesSection />
      <HowItWorks />
      <WhyChoose />
      <Footer />
    </>
  );
}
