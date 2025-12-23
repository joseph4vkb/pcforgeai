import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getHeadsets = baseProcedure
  .input(
    z.object({
      brand: z.array(z.string()).optional(),
      type: z.array(z.string()).optional(), // Wired/Wireless
      connectivity: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      searchQuery: z.string().optional(),
      sortBy: z.enum(["price", "brand", "type"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      page: z.number().default(1),
    })
  )
  .query(async ({ input }) => {
    const itemsPerPage = 12;

    // Fetch all PC builds that have headsets
    const builds = await db.pcBuild.findMany({
      // where clause removed to avoid null type error with Json field
      // filtering handled in JS loop below
      select: {
        headsets: true,
      },
    });

    // Extract all headsets and deduplicate by name
    const headsetMap = new Map<string, {
      name: string;
      brand: string;
      type: string;
      connectivity: string;
      features: string;
      price: number;
      url?: string;
      specs: Record<string, any>;
    }>();

    for (const build of builds) {
      if (!build.headsets || !Array.isArray(build.headsets)) continue;

      const headsets = build.headsets as Array<{
        name: string;
        brand: string;
        type: string;
        connectivity: string;
        features: string;
        price: number;
        url?: string;
        specs?: Record<string, any>;
      }>;

      for (const headset of headsets) {
        // Use name as unique key for deduplication
        if (!headsetMap.has(headset.name)) {
          headsetMap.set(headset.name, {
            ...headset,
            specs: headset.specs || {},
          });
        }
      }
    }

    // Convert map to array
    let allHeadsets = Array.from(headsetMap.values());

    // Extract unique filter options from all headsets (before filtering)
    const availableBrands = Array.from(
      new Set(allHeadsets.map((headset) => headset.brand))
    ).sort();

    const availableTypes = Array.from(
      new Set(allHeadsets.map((headset) => headset.type))
    ).sort();

    const availableConnectivity = Array.from(
      new Set(allHeadsets.map((headset) => headset.connectivity))
    ).sort();

    // Apply filters
    // Brand filter
    if (input.brand && input.brand.length > 0) {
      allHeadsets = allHeadsets.filter((headset) =>
        input.brand!.some((selectedBrand) =>
          headset.brand.toLowerCase().includes(selectedBrand.toLowerCase())
        )
      );
    }

    // Type filter
    if (input.type && input.type.length > 0) {
      allHeadsets = allHeadsets.filter((headset) =>
        input.type!.some((selectedType) =>
          headset.type.toLowerCase().includes(selectedType.toLowerCase())
        )
      );
    }

    // Connectivity filter
    if (input.connectivity && input.connectivity.length > 0) {
      allHeadsets = allHeadsets.filter((headset) =>
        input.connectivity!.some((selectedConnectivity) =>
          headset.connectivity.toLowerCase().includes(selectedConnectivity.toLowerCase())
        )
      );
    }

    // Price range filter
    if (input.minPrice !== undefined) {
      allHeadsets = allHeadsets.filter(
        (headset) => headset.price >= input.minPrice!
      );
    }
    if (input.maxPrice !== undefined) {
      allHeadsets = allHeadsets.filter(
        (headset) => headset.price <= input.maxPrice!
      );
    }

    // Search query filter
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      allHeadsets = allHeadsets.filter(
        (headset) =>
          headset.name.toLowerCase().includes(searchLower) ||
          headset.brand.toLowerCase().includes(searchLower) ||
          headset.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = input.sortBy || "price";
    const sortOrder = input.sortOrder || "asc";

    allHeadsets.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;

        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;

        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Get total count after filtering
    const totalCount = allHeadsets.length;

    // Apply pagination
    const skip = (input.page - 1) * itemsPerPage;
    const paginatedHeadsets = allHeadsets.slice(skip, skip + itemsPerPage);

    // Check if there are more headsets
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      headsets: paginatedHeadsets,
      hasMore,
      totalResults: totalCount,
      filterOptions: {
        brands: availableBrands,
        types: availableTypes,
        connectivityOptions: availableConnectivity,
      },
    };
  });
