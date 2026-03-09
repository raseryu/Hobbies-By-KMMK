import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disc3, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

async function hashPassword(password: string): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const hashed = await hashPassword(trimmedPassword);

      const { data, error: queryError } = await supabase
        .from("users")
        .select("id, role")
        .eq("email", trimmedEmail)
        .eq("password", hashed)
        .maybeSingle();

      if (queryError) {
        console.error(queryError);
        setError("Unable to sign in right now. Please try again.");
        return;
      }

      if (!data) {
        setError("Invalid email or password.");
        return;
      }

      const role = data.role as string | null;
      const allowedRoles = ["head_admin", "manager", "moderator"];

      if (!role || !allowedRoles.includes(role)) {
        setError("You do not have admin access with this account.");
        return;
      }

      // Redirect to the separate static admin dashboard.
      window.location.href = `http://127.0.0.1:5500/kmmk/admin-static/index.html`;
    } catch (err) {
      console.error(err);
      setError("Unexpected error during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Disc3 className="h-7 w-7 text-primary animate-spin-slow" />
            <span className="font-heading text-xl font-bold text-foreground">
              KMMK <span className="text-primary">Store</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl font-bold text-foreground">Admin Portal</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to manage products, orders, and customers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@groove.com"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full font-heading font-semibold"
            size="lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">
            ← Back to customer login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
