import { ShoppingCart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

type ProductCardProps = {
  asin: string;
  name: string;
  price: number;
  url: string;
  category: string;
  specs: Record<string, any>;
};

export function ProductCard({ 
  asin, 
  name, 
  price, 
  url, 
  category, 
  specs
}: ProductCardProps) {
  const trpc = useTRPC();
  
  const recordClickMutation = useMutation(
    trpc.recordClick.mutationOptions()
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Record the click
    try {
      await recordClickMutation.mutateAsync({
        targetType: "Part",
        targetId: asin,
        targetName: name,
        metadata: {
          category,
          price,
          specs,
        },
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
    
    // Open the link
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative flex flex-col rounded-xl border border-white/10 bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition hover:border-blue-400/50 hover:bg-blue-900/50 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Category Badge and Price */}
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase text-blue-400 border border-blue-500/30">
          {category}
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl sm:text-2xl font-bold text-white">
            {formatPrice(price)}
          </div>
        </div>
      </div>

      {/* Product Name */}
      <h3 className="mb-3 sm:mb-4 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] text-base sm:text-lg font-bold text-white">
        {name}
      </h3>

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
          {Object.entries(specs).map(([key, value]) => (
            <span
              key={key}
              className="rounded-lg bg-blue-800/40 px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-gray-200 border border-blue-700/30"
            >
              <span className="font-semibold">{key}:</span> {String(value)}
            </span>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={handleClick}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/30 group-hover:scale-[1.02] active:scale-[0.98]"
      >
        <ShoppingCart className="h-4 w-4" />
        Buy on Amazon
      </button>
    </div>
  );
}
