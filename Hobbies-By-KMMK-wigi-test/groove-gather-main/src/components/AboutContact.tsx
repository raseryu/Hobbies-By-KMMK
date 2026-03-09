import { Facebook, MapPin, ShoppingBag, Store } from "lucide-react";

const links = [
  {
    icon: Facebook,
    label: "Facebook Page",
    href: "https://www.facebook.com/share/174A2mKesg/",
  },
  {
    icon: ShoppingBag,
    label: "Carousell",
    href: "https://www.carousell.ph/u/moybean/",
  },
  {
    icon: Store,
    label: "Shopee",
    href: "https://shopee.ph/logicglass",
  },
  {
    icon: MapPin,
    label: "KMMK Store, Summerfield East, Taytay",
    href: "https://maps.google.com/?q=KMMK+Store+Summerfield+East+Subdivision+Taytay+Philippines+1920",
  },
];

const AboutContact = () => {
  return (
    <section id="about" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          About <span className="text-primary">Us</span>
        </h2>
        <p className="text-center text-muted-foreground mb-6 max-w-xl mx-auto">
          We&apos;re a buy-and-sell music and collectibles store based in Taytay, Philippines.
          We specialize in vinyl records, CDs, cassette tapes, guitar &amp; effects equipment, LEGO sets, and action figures.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-muted-foreground mb-10">
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Contact</p>
            <p>
              Email:{" "}
              <span className="text-foreground font-medium">hobbies.by.kmmk@gmail.com</span>
            </p>
            <p>Facebook Messenger via our official page</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Location</p>
            <p>Hobbies by KMMK – Summerfield East Subdivision</p>
            <p>Taytay, Rizal, Philippines</p>
          </div>
        </div>

        <div id="contact" className="grid sm:grid-cols-2 gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-lg bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <link.icon className="h-6 w-6 text-primary shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-foreground">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutContact;
