import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import AboutContact from "@/components/AboutContact";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const hash = location.hash?.replace("#", "") || window.location.hash?.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CategoriesSection
        selectedCategory={selectedCategory}
        onCategoryClick={(cat) => setSelectedCategory(cat)}
      />
      <FeaturedProducts selectedCategory={selectedCategory} />
      <AboutContact />
      <Footer />
    </div>
  );
};

export default Index;
