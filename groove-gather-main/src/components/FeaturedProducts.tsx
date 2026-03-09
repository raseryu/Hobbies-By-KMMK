import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

type DbProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  category: string | null;
};

// Map DB category to our fixed shop categories (case-insensitive)
function matchesCategory(productCategory: string | null, selected: string): boolean {
  if (selected === "All") return true;
  const c = (productCategory || "").trim().toLowerCase();
  if (!c) return false;
  const s = selected.toLowerCase();
  if (s === "vinyl") return c.includes("vinyl");
  if (s === "cd's") return c.includes("cd") || c === "cds";
  if (s === "cassettes") return c.includes("cassette");
  if (s === "guitar & effects") return c.includes("guitar") || c.includes("effects");
  if (s === "lego & figures") return c.includes("lego") || c.includes("figure");
  return c === s || c.includes(s);
}

type StockFilter = "All" | "With stock" | "No stock";

interface FeaturedProductsProps {
  selectedCategory?: string;
}

const FeaturedProducts = ({ selectedCategory = "All" }: FeaturedProductsProps) => {
  const { addToCart } = useCart();
  const [stockFilter, setStockFilter] = useState<StockFilter>("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [items, setItems] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let res = await supabase
        .from("products")
        .select("id, name, price, stock, image, category")
        .order("created_at", { ascending: false });

      if (res.error) {
        res = await supabase
          .from("products")
          .select("id, name, price, stock, image")
          .order("created_at", { ascending: false });
      }

      if (res.error) {
        console.error(res.error);
        toast({
          title: "Failed to load products",
          description: "Please refresh the page or try again later.",
          variant: "destructive",
        });
      } else if (res.data) {
        setItems(
          res.data.map((p) => ({
            id: p.id,
            name: p.name ?? "",
            price: Number(p.price ?? 0),
            stock: Number(p.stock ?? 0),
            image: p.image ?? null,
            category: (p as { category?: string }).category ?? null,
          }))
        );
      }
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];

    if (selectedCategory !== "All") {
      list = list.filter((p) => matchesCategory(p.category, selectedCategory));
    }

    if (stockFilter === "With stock") {
      list = list.filter((p) => p.stock > 0);
    } else if (stockFilter === "No stock") {
      list = list.filter((p) => p.stock <= 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [selectedCategory, stockFilter, search, sortBy, items]);

  const handleAdd = (product: DbProduct) => {
    if (product.stock <= 0) return;

    addToCart({
      id: product.id,
      title: product.name,
      subtitle: "",
      price: product.price,
      stock: product.stock,
      priceDisplay: `₱${product.price.toLocaleString()}`,
      tag: product.stock > 0 ? "In stock" : "Out of stock",
      category: "Store",
      imageUrl: product.image || undefined,
      availability: product.stock > 0 ? `${product.stock} in stock` : "Out of stock",
      description: "",
    });
    toast({ title: "Added to cart", description: product.name });
  };

  return (
    <section id="shop" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          Shop <span className="text-primary">Products</span>
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Browse products currently available in store. Stock and pricing come directly from the live catalog.
        </p>

        {/* Search + sort */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, artist, or category"
            className="w-full md:max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Shop products: stock filter - All, With stock, No stock */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {(["All", "With stock", "No stock"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setStockFilter(opt)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                stockFilter === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="bg-card border-border hover:border-primary/40 transition-all group"
            >
              <CardContent className="p-5">
                <Link
                  to={`/product/${product.id}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  <div className="aspect-square bg-secondary rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border-4 border-primary/30 bg-background flex items-center justify-center group-hover:animate-spin-slow">
                        <div className="w-8 h-8 rounded-full bg-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-foreground truncate hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-primary/50 text-primary text-xs"
                    >
                      {product.stock > 0 ? "In stock" : "Out of stock"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-primary font-heading font-bold text-lg">
                      ₱{product.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAdd(product);
                    }}
                    className="gap-1.5 font-heading text-xs"
                    disabled={product.stock <= 0}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {product.stock > 0 ? "Add to Cart" : "Out of stock"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No products in this category yet. Check back soon!
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
