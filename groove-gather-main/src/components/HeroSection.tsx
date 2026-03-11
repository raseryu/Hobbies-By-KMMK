import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import logo from "@/assets/logo-hobbies.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      <div className="absolute inset-0 bg-background/70" />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-4">
          <span className="inline-flex items-center justify-center mb-3">
            <img
              src={logo}
              alt="Hobbies by KMMK logo"
              className="h-20 w-20 rounded-full border border-primary/60 bg-background object-contain shadow-lg"
            />
          </span>
          <br />
          <span className="text-foreground">HOBBIES</span>{" "}
          <span className="text-gradient">by KMMK</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2 font-body">
          From music to toys, and everything in between.
        </p>
        <p className="text-sm text-primary font-medium tracking-widest uppercase mb-8">
          Start your collector&apos;s journey with us!
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold">
            <a href="#categories">Browse Collection</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 font-heading">
            <a href="#contact">Contact Us</a>
          </Button>
        </div>
      </div>

      <a
        href="#categories"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-primary animate-bounce"
      >
        <ArrowDown className="h-6 w-6" />
      </a>
    </section>
  );
};

export default HeroSection;
