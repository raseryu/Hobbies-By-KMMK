import { Disc, Disc3, Guitar, Gamepad2, Music, LayoutGrid } from "lucide-react";

// Fixed shop categories - values must match product.category in DB (case-insensitive match)
export const CATEGORY_VALUES = [
  "Vinyl",
  "CD's",
  "Cassettes",
  "Guitar & Effects",
  "Lego & Figures",
] as const;

const categories = [
  { icon: LayoutGrid, value: "All", label: "All", desc: "Browse everything" },
  { icon: Disc3, value: "Vinyl", label: "Vinyl", desc: "Our biggest collection" },
  { icon: Disc, value: "CD's", label: "CD's", desc: "Classic & modern" },
  { icon: Music, value: "Cassettes", label: "Cassettes", desc: "Retro vibes" },
  { icon: Guitar, value: "Guitar & Effects", label: "Guitar & Effects", desc: "Gear up" },
  { icon: Gamepad2, value: "Lego & Figures", label: "Lego & Figures", desc: "Toys & collectibles" },
];

interface CategoriesSectionProps {
  selectedCategory?: string;
  onCategoryClick?: (category: string) => void;
}

const CategoriesSection = ({ selectedCategory = "All", onCategoryClick }: CategoriesSectionProps) => {
  const handleClick = (value: string) => {
    onCategoryClick?.(value);
    const shopSection = document.getElementById("shop");
    if (shopSection) shopSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="categories" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          Shop by <span className="text-primary">Category</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Click a category to browse
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleClick(cat.value)}
              className={`group flex flex-col items-center gap-3 p-6 rounded-lg border transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <cat.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-heading font-semibold text-sm text-foreground">
                {cat.label}
              </span>
              <span className="text-xs text-muted-foreground">{cat.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
