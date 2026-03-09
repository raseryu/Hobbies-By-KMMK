import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Order Submitted!
            </h1>
            <p className="text-muted-foreground mb-6">
              We'll reach out to you via Facebook or the contact details you
              provided to confirm your order and arrange payment/delivery.
            </p>
            <Button onClick={() => navigate("/")} className="font-heading font-semibold">
              Back to Store
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Your cart is empty
            </h1>
            <p className="text-muted-foreground mb-6">
              Browse our collection and add items to your cart.
            </p>
            <Button onClick={() => navigate("/")} className="font-heading font-semibold">
              Browse Collection
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    if (!auth.user) {
      window.alert("Please sign in to place an order.");
      navigate("/login");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to place this order?");
    if (!confirmed) return;

    setSubmitting(true);

    try {
      const userId = auth.user.id;

      // 2. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          total: totalPrice,
          status: "pending",
        })
        .select("id")
        .single();

      if (orderError || !order?.id) {
        console.error(orderError);
        window.alert("Failed to create order. Please try again.");
        setSubmitting(false);
        return;
      }

      const orderId = order.id as string;

      // 3. Insert order_items
      const orderItemsPayload = items.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (orderItemsError) {
        console.error(orderItemsError);
        window.alert("Failed to save order items. Please contact support.");
        setSubmitting(false);
        return;
      }

      // 4. Deduct stock for each product
      for (const item of items) {
        if (typeof item.stock !== "number") continue;
        const newStock = Math.max(0, item.stock - item.quantity);
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id);

        if (stockError) {
          console.error(stockError);
        }
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong while processing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to store</span>
          </button>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">
            Checkout
          </h1>

          <div className="grid md:grid-cols-5 gap-8">
            {/* Order summary */}
            <div className="md:col-span-2 order-2 md:order-1">
              <div className="bg-card border border-border rounded-lg p-5 sticky top-24">
                <h2 className="font-heading font-semibold text-foreground mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="text-foreground shrink-0">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-4 flex justify-between">
                  <span className="font-heading font-semibold text-foreground">Total</span>
                  <span className="font-heading font-bold text-primary text-lg">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <form onSubmit={handleSubmit} className="md:col-span-3 order-1 md:order-2 space-y-5">
              <h2 className="font-heading font-semibold text-foreground">
                Your Details
              </h2>
              <p className="text-xs text-muted-foreground -mt-3">
                We'll contact you to confirm your order and arrange payment &amp; delivery.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required placeholder="Juan Dela Cruz" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="juan@email.com"
                    className="mt-1"
                    value={auth.user?.email ?? ""}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone / Viber</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    placeholder="09XX XXX XXXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fb">Facebook Profile Link (optional)</Label>
                  <Input
                    id="fb"
                    name="fb"
                    placeholder="https://facebook.com/yourprofile"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Preferred meetup location, delivery, etc."
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full font-heading font-semibold"
                disabled={submitting}
              >
                {submitting ? "Placing Order..." : "Submit Order"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
