import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getMiniPcs = baseProcedure
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

    // Fetch all PC builds that have mini PCs
    const builds = await db.pcBuild.findMany({
      // where clause removed to avoid null type error with Json field
      // filtering handled in JS loop below
      select: {
        miniPcs: true,
      },
    });

    // Extract all mini PCs and deduplicate by name
    const miniPcMap = new Map<string, {
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
      if (!build.miniPcs || !Array.isArray(build.miniPcs)) continue;

      const miniPcs = build.miniPcs as Array<{
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

      for (const miniPc of miniPcs) {
        // Use name as unique key for deduplication
        if (!miniPcMap.has(miniPc.name)) {
          miniPcMap.set(miniPc.name, {
            ...miniPc,
            specs: miniPc.specs || {},
          });
        }
      }
    }

    // Convert map to array
    let allMiniPcs = Array.from(miniPcMap.values());

    // Extract unique filter options from all mini PCs (before filtering)
    const availableBrands = Array.from(
      new Set(allMiniPcs.map((miniPc) => miniPc.brand))
    ).sort();

    const availableProcessors = Array.from(
      new Set(allMiniPcs.map((miniPc) => miniPc.processor))
    ).sort();

    // Extract unique RAM options
    const ramOptions = Array.from(
      new Set(
        allMiniPcs
          .map((miniPc) => {
            const ramMatch = miniPc.ram.match(/(\d+)/);
            return (ramMatch && ramMatch[1]) ? parseInt(ramMatch[1]) : null;
          })
          .filter((ram): ram is number => ram !== null)
      )
    ).sort((a, b) => a - b);

    // Extract unique storage options
    const storageOptions = Array.from(
      new Set(
        allMiniPcs
          .map((miniPc) => {
            const storageMatch = miniPc.storage.match(/(\d+)\s*(GB|TB)/i);
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
    // Brand filter
    if (input.brand && input.brand.length > 0) {
      allMiniPcs = allMiniPcs.filter((miniPc) =>
        input.brand!.some((selectedBrand) =>
          miniPc.brand.toLowerCase().includes(selectedBrand.toLowerCase())
        )
      );
    }

    // Processor filter
    if (input.processor && input.processor.length > 0) {
      allMiniPcs = allMiniPcs.filter((miniPc) =>
        input.processor!.some((selectedProcessor) =>
          miniPc.processor.toLowerCase().includes(selectedProcessor.toLowerCase())
        )
      );
    }

    // RAM filter
    if (input.minRam !== undefined) {
      allMiniPcs = allMiniPcs.filter((miniPc) => {
        const ramMatch = miniPc.ram.match(/(\d+)/);
        if (ramMatch && ramMatch[1]) {
          const ramValue = parseInt(ramMatch[1]);
          return ramValue >= input.minRam!;
        }
        return false;
      });
    }

    // Storage filter
    if (input.minStorage !== undefined) {
      allMiniPcs = allMiniPcs.filter((miniPc) => {
        const storageMatch = miniPc.storage.match(/(\d+)\s*(GB|TB)/i);
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
      allMiniPcs = allMiniPcs.filter(
        (miniPc) => miniPc.price >= input.minPrice!
      );
    }
    if (input.maxPrice !== undefined) {
      allMiniPcs = allMiniPcs.filter(
        (miniPc) => miniPc.price <= input.maxPrice!
      );
    }

    // Search query filter
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      allMiniPcs = allMiniPcs.filter(
        (miniPc) =>
          miniPc.name.toLowerCase().includes(searchLower) ||
          miniPc.brand.toLowerCase().includes(searchLower) ||
          miniPc.processor.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = input.sortBy || "price";
    const sortOrder = input.sortOrder || "asc";

    allMiniPcs.sort((a, b) => {
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
    const totalCount = allMiniPcs.length;

    // Apply pagination
    const skip = (input.page - 1) * itemsPerPage;
    const paginatedMiniPcs = allMiniPcs.slice(skip, skip + itemsPerPage);

    // Check if there are more mini PCs
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      miniPcs: paginatedMiniPcs,
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
