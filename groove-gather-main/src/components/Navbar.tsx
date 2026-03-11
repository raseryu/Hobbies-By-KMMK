import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CartDrawer from "@/components/CartDrawer";
import logo from "@/assets/logo-hobbies.png";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", to: "/", hash: null },
  { label: "Shop", to: "/", hash: "shop" },
  { label: "About", to: "/", hash: "about" },
  { label: "Contact", to: "/", hash: "contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (to: string, hash: string | null) => {
    setOpen(false);
    if (hash) {
      // Always go to home with hash so scroll works from any page
      if (location.pathname !== "/") {
        navigate(`/#${hash}`);
      } else {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else navigate(`/#${hash}`);
      }
    } else {
      navigate(to);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Hobbies by KMMK logo"
            className="h-9 w-9 rounded-full border border-primary/50 bg-background object-contain"
          />
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            HOBBIES <span className="text-primary">by KMMK</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.hash ? (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.to, link.hash)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          {user ? (
            <Link
              to="/account"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              title="Account"
            >
              <User className="h-5 w-5" />
              <span className="text-xs max-w-[140px] truncate">{user.email}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Sign In"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <CartDrawer />
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            to={user ? "/account" : "/login"}
            className="text-foreground hover:text-primary transition-colors"
          >
            <User className="h-5 w-5" />
          </Link>
          <CartDrawer />
          <button
            onClick={() => setOpen(!open)}
            className="text-foreground"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {navLinks.map((link) =>
            link.hash ? (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link.to, link.hash)}
                className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
