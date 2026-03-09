import { Disc3 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">
            KMMK Store
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2025 KMMK Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
