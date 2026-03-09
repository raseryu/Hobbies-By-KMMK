import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disc3 } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
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

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="mt-1" />
          </div>
          <Button type="submit" className="w-full font-heading font-semibold" size="lg">
            Send Reset Link
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
