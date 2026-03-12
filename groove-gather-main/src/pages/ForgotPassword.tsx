import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disc3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter the email associated with your account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        console.error(error);
        toast({
          title: "Unable to send reset link",
          description: "Please check your email address and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reset link sent",
        description:
          "If an account exists for that email, you'll receive a password reset link shortly.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Something went wrong",
        description: "We couldn't process your request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Disc3 className="h-7 w-7 text-primary animate-spin-slow" />
            <span className="font-heading text-xl font-bold text-foreground">
              KMMK <span className="text-primary">Store</span>
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Reset password</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full font-heading font-semibold"
            size="lg"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
