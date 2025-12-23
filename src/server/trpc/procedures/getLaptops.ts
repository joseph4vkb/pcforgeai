import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getLaptops = baseProcedure
  .input(
    z.object({
      brand: z.array(z.string()).optional(),
      processor: z.array(z.string()).optional(),
      minRam: z.number().optional(), // in GB
      minStorage: z.number().optional(), // in GB
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      searchQuery: z.string().optional(),
      sortBy: z.enum(["price", "brand", "ram", "storage"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      page: z.number().default(1),
    })
  )
  .query(async ({ input }) => {
    const itemsPerPage = 12;

    // Fetch all PC builds that have laptops
    const builds = await db.pcBuild.findMany({
      // where clause removed to avoid null type error with Json field
      // filtering handled in JS loop below
      select: {
        laptops: true,
      },
    });

    // Extract all laptops and deduplicate by name
    const laptopMap = new Map<string, {
      name: string;
      brand: string;
      processor: string;
      ram: string;
      storage: string;
      gpu: string;
      price: number;
      url?: string;
      specs: Record<string, any>;
    }>();

    for (const build of builds) {
      if (!build.laptops || !Array.isArray(build.laptops)) continue;

      const laptops = build.laptops as Array<{
        name: string;
        brand: string;
        processor: string;
        ram: string;
        storage: string;
        gpu: string;
        price: number;
        url?: string;
        specs?: Record<string, any>;
      }>;

      for (const laptop of laptops) {
        // Use name as unique key for deduplication
        if (!laptopMap.has(laptop.name)) {
          laptopMap.set(laptop.name, {
            ...laptop,
            specs: laptop.specs || {},
          });
        }
      }
    }

    // Convert map to array
    let allLaptops = Array.from(laptopMap.values());

    // Extract unique filter options from all laptops (before filtering)
    const availableBrands = Array.from(
      new Set(allLaptops.map((laptop) => laptop.brand))
    ).sort();

    const availableProcessors = Array.from(
      new Set(allLaptops.map((laptop) => laptop.processor))
    ).sort();

    // Extract unique RAM options
    const ramOptions = Array.from(
      new Set(
        allLaptops
          .map((laptop) => {
            const ramMatch = laptop.ram.match(/(\d+)/);
            return (ramMatch && ramMatch[1]) ? parseInt(ramMatch[1]) : null;
          })
          .filter((ram): ram is number => ram !== null)
      )
    ).sort((a, b) => a - b);

    // Extract unique storage options
    const storageOptions = Array.from(
      new Set(
        allLaptops
          .map((laptop) => {
            const storageMatch = laptop.storage.match(/(\d+)\s*(GB|TB)/i);
            if (storageMatch && storageMatch[1]) {
              let storageValue = parseInt(storageMatch[1]);
              // Convert TB to GB for consistent comparison
              if (storageMatch[2] && storageMatch[2].toUpperCase() === "TB") {
                storageValue *= 1024;
              }
              return storageValue;
            }
            return null;
          })
          .filter((storage): storage is number => storage !== null)
      )
    ).sort((a, b) => a - b);

    // Apply filters
    // Brand filter - match any of the selected brands
    if (input.brand && input.brand.length > 0) {
      allLaptops = allLaptops.filter((laptop) =>
        input.brand!.some((selectedBrand) =>
          laptop.brand.toLowerCase().includes(selectedBrand.toLowerCase())
        )
      );
    }

    // Processor filter - match any of the selected processors
    if (input.processor && input.processor.length > 0) {
      allLaptops = allLaptops.filter((laptop) =>
        input.processor!.some((selectedProcessor) =>
          laptop.processor.toLowerCase().includes(selectedProcessor.toLowerCase())
        )
      );
    }

    // RAM filter (extract numeric value from string like "16GB" or "16 GB")
    if (input.minRam !== undefined) {
      allLaptops = allLaptops.filter((laptop) => {
        const ramMatch = laptop.ram.match(/(\d+)/);
        if (ramMatch && ramMatch[1]) {
          const ramValue = parseInt(ramMatch[1]);
          return ramValue >= input.minRam!;
        }
        return false;
      });
    }

    // Storage filter (extract numeric value from string like "512GB" or "1TB")
    if (input.minStorage !== undefined) {
      allLaptops = allLaptops.filter((laptop) => {
        const storageMatch = laptop.storage.match(/(\d+)\s*(GB|TB)/i);
        if (storageMatch && storageMatch[1]) {
          let storageValue = parseInt(storageMatch[1]);
          // Convert TB to GB
          if (storageMatch[2] && storageMatch[2].toUpperCase() === "TB") {
            storageValue *= 1024;
          }
          return storageValue >= input.minStorage!;
        }
        return false;
      });
    }

    // Price range filter
    if (input.minPrice !== undefined) {
      allLaptops = allLaptops.filter(
        (laptop) => laptop.price >= input.minPrice!
      );
    }
    if (input.maxPrice !== undefined) {
      allLaptops = allLaptops.filter(
        (laptop) => laptop.price <= input.maxPrice!
      );
    }

    // Search query filter
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      allLaptops = allLaptops.filter(
        (laptop) =>
          laptop.name.toLowerCase().includes(searchLower) ||
          laptop.brand.toLowerCase().includes(searchLower) ||
          laptop.processor.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = input.sortBy || "price";
    const sortOrder = input.sortOrder || "asc";

    allLaptops.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;

        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;

        case "ram": {
          const aRamMatch = a.ram.match(/(\d+)/);
          const bRamMatch = b.ram.match(/(\d+)/);
          const aRamValue = (aRamMatch && aRamMatch[1]) ? parseInt(aRamMatch[1]) : 0;
          const bRamValue = (bRamMatch && bRamMatch[1]) ? parseInt(bRamMatch[1]) : 0;
          comparison = aRamValue - bRamValue;
          break;
        }

        case "storage": {
          const aStorageMatch = a.storage.match(/(\d+)\s*(GB|TB)/i);
          const bStorageMatch = b.storage.match(/(\d+)\s*(GB|TB)/i);

          let aStorageValue = 0;
          if (aStorageMatch && aStorageMatch[1]) {
            aStorageValue = parseInt(aStorageMatch[1]);
            if (aStorageMatch[2] && aStorageMatch[2].toUpperCase() === "TB") {
              aStorageValue *= 1024;
            }
          }

          let bStorageValue = 0;
          if (bStorageMatch && bStorageMatch[1]) {
            bStorageValue = parseInt(bStorageMatch[1]);
            if (bStorageMatch[2] && bStorageMatch[2].toUpperCase() === "TB") {
              bStorageValue *= 1024;
            }
          }

          comparison = aStorageValue - bStorageValue;
          break;
        }
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Get total count after filtering
    const totalCount = allLaptops.length;

    // Apply pagination
    const skip = (input.page - 1) * itemsPerPage;
    const paginatedLaptops = allLaptops.slice(skip, skip + itemsPerPage);

    // Check if there are more laptops
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      laptops: paginatedLaptops,
      hasMore,
      totalResults: totalCount,
      filterOptions: {
        brands: availableBrands,
        processors: availableProcessors,
        ramOptions,
        storageOptions,
      },
    };
  });
