import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CartDrawer = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative text-foreground hover:text-primary transition-colors">
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading text-foreground">Your Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mt-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-heading font-semibold text-foreground truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{item.priceDisplay}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-6 w-6 rounded bg-secondary flex items-center justify-center text-foreground hover:text-primary transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium text-foreground w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6 rounded bg-secondary flex items-center justify-center text-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-heading font-bold text-primary">
                  ₱{totalPrice.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full font-heading font-semibold"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  navigate("/checkout");
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
