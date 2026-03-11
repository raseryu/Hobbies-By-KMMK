import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  description: string | null;
  category: string | null;
  sku: string | null;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      let res = await supabase
        .from("products")
        .select("id, name, price, stock, image, description, category, sku")
        .eq("id", id)
        .maybeSingle();

    if (res.error) {
      res = await supabase
        .from("products")
        .select("id, name, price, stock, image")
        .eq("id", id)
        .maybeSingle();
    }

      if (res.error) {
        console.error(res.error);
        setProduct(null);
      } else if (res.data) {
        const d = res.data as Record<string, unknown>;
        setProduct({
          id: String(d.id),
          name: String(d.name ?? ""),
          price: Number(d.price ?? 0),
          stock: Number(d.stock ?? 0),
          image: d.image != null ? String(d.image) : null,
          description: d.description != null ? String(d.description) : null,
          category: d.category != null ? String(d.category) : null,
          sku: d.sku != null ? String(d.sku) : null,
        });
      } else {
        setProduct(null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addToCart({
      id: product.id,
      title: product.name,
      subtitle: product.category ?? "",
      price: product.price,
      stock: product.stock,
      priceDisplay: `₱${product.price.toLocaleString()}`,
      tag: product.stock > 0 ? "In stock" : "Out of stock",
      category: product.category ?? "Store",
      imageUrl: product.image ?? undefined,
      availability: product.stock > 0 ? `${product.stock} in stock` : "Out of stock",
      description: product.description ?? "",
    });
    toast({ title: "Added to cart", description: product.name });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Product not found.</p>
          <Button asChild variant="outline">
            <Link to="/#shop">Back to shop</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-primary/30 bg-background flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/60" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-sm text-muted-foreground mb-1">SKU: {product.sku}</p>
              )}
              {product.category && (
                <p className="text-sm text-muted-foreground mb-2">Category: {product.category}</p>
              )}

              <p className="text-primary font-heading font-bold text-2xl mb-4">
                ₱{product.price.toLocaleString()}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-sm font-medium ${
                    product.stock > 0 ? "text-foreground" : "text-destructive"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              {product.description && (
                <p className="text-muted-foreground text-sm mb-6 whitespace-pre-wrap">
                  {product.description}
                </p>
              )}

              <Button
                size="lg"
                className="w-full gap-2 font-heading font-semibold"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock > 0 ? "Add to Cart" : "Out of stock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
