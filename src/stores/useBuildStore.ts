import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Part {
  category: string;
  name: string;
  asin: string;
  price: number;
  specs: Record<string, any>;
}

interface Laptop {
  name: string;
  brand: string;
  processor: string;
  ram: string;
  storage: string;
  gpu: string;
  price: number;
  specs: Record<string, any>;
  url?: string;
}

export type { Laptop };

interface ComparisonBuild {
  id: number;
  category: string;
  budget: number;
  parts: Part[];
  totalCost: number;
  compatibility: number;
  compatibilityNotes?: string;
}

interface BuildState {
  category: string;
  budget: number;
  parts: Part[];
  laptops: Laptop[];
  totalCost: number;
  compatibility: number;
  compatibilityNotes: string;
  comparisonBuilds: ComparisonBuild[];
  comparisonLaptops: Laptop[];
  setCategory: (category: string) => void;
  setBudget: (budget: number) => void;
  setParts: (parts: Part[]) => void;
  updatePart: (index: number, part: Part) => void;
  setBuild: (build: {
    category: string;
    budget: number;
    parts: Part[];
    laptops?: Laptop[];
    totalCost: number;
    compatibility: number;
    compatibilityNotes?: string;
  }) => void;
  clearBuild: () => void;
  addToComparison: (build: ComparisonBuild) => void;
  removeFromComparison: (buildId: number) => void;
  clearComparison: () => void;
  isBuildInComparison: (buildId: number) => boolean;
  addLaptopToComparison: (laptop: Laptop) => void;
  removeLaptopFromComparison: (laptopUrl: string) => void;
  clearLaptopComparison: () => void;
  isLaptopInComparison: (laptopUrl: string) => boolean;
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      category: "",
      budget: 50000,
      parts: [],
      laptops: [],
      totalCost: 0,
      compatibility: 0,
      compatibilityNotes: "",
      comparisonBuilds: [],
      comparisonLaptops: [],
      setCategory: (category) => set({ category }),
      setBudget: (budget) => set({ budget }),
      setParts: (parts) =>
        set({
          parts,
          totalCost: parts.reduce((sum, part) => sum + part.price, 0),
        }),
      updatePart: (index, part) =>
        set((state) => {
          const newParts = [...state.parts];
          newParts[index] = part;
          return {
            parts: newParts,
            totalCost: newParts.reduce((sum, p) => sum + p.price, 0),
          };
        }),
      setBuild: (build) => {
        // Recalculate totalCost from parts to ensure accuracy
        const calculatedTotalCost = build.parts.reduce((sum, part) => sum + part.price, 0);
        set({
          ...build,
          laptops: build.laptops || [],
          totalCost: calculatedTotalCost,
          compatibilityNotes: build.compatibilityNotes || "",
        });
      },
      clearBuild: () =>
        set({
          category: "",
          budget: 50000,
          parts: [],
          laptops: [],
          totalCost: 0,
          compatibility: 0,
          compatibilityNotes: "",
        }),
      addToComparison: (build) =>
        set((state) => {
          // Check if build already exists in comparison
          const exists = state.comparisonBuilds.some((b) => b.id === build.id);
          if (exists) {
            return state;
          }
          // Limit to 4 builds for comparison
          const newBuilds = [...state.comparisonBuilds, build];
          if (newBuilds.length > 4) {
            newBuilds.shift(); // Remove the oldest build
          }
          return { comparisonBuilds: newBuilds };
        }),
      removeFromComparison: (buildId) =>
        set((state) => ({
          comparisonBuilds: state.comparisonBuilds.filter(
            (b) => b.id !== buildId
          ),
        })),
      clearComparison: () => set({ comparisonBuilds: [] }),
      isBuildInComparison: (buildId) => {
        const state = get();
        return state.comparisonBuilds.some((b) => b.id === buildId);
      },
      addLaptopToComparison: (laptop) =>
        set((state) => {
          // Check if laptop already exists in comparison (by URL)
          const exists = state.comparisonLaptops.some((l) => l.url === laptop.url);
          if (exists) {
            return state;
          }
          // Limit to 4 laptops for comparison
          const newLaptops = [...state.comparisonLaptops, laptop];
          if (newLaptops.length > 4) {
            newLaptops.shift(); // Remove the oldest laptop
          }
          return { comparisonLaptops: newLaptops };
        }),
      removeLaptopFromComparison: (laptopUrl) =>
        set((state) => ({
          comparisonLaptops: state.comparisonLaptops.filter(
            (l) => l.url !== laptopUrl
          ),
        })),
      clearLaptopComparison: () => set({ comparisonLaptops: [] }),
      isLaptopInComparison: (laptopUrl) => {
        const state = get();
        return state.comparisonLaptops.some((l) => l.url === laptopUrl);
      },
    }),
    {
      name: "pc-builder-storage",
      partialize: (state) => ({
        comparisonBuilds: state.comparisonBuilds,
        comparisonLaptops: state.comparisonLaptops,
      }),
    }
  )
);
