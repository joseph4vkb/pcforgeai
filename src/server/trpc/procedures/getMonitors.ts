import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getMonitors = baseProcedure
  .input(
    z.object({
      brand: z.array(z.string()).optional(),
      resolution: z.array(z.string()).optional(),
      minSize: z.number().optional(), // in inches
      minRefreshRate: z.number().optional(), // in Hz
      panelType: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      searchQuery: z.string().optional(),
      sortBy: z.enum(["price", "brand", "size", "refreshRate"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      page: z.number().default(1),
    })
  )
  .query(async ({ input }) => {
    const itemsPerPage = 12;

    // Fetch all PC builds that have monitors
    const builds = await db.pcBuild.findMany({
      // where clause removed to avoid null type error with Json field
      // filtering handled in JS loop below
      select: {
        monitors: true,
      },
    });

    // Extract all monitors and deduplicate by name
    const monitorMap = new Map<string, {
      name: string;
      brand: string;
      resolution: string;
      size: string;
      refreshRate: string;
      panelType: string;
      price: number;
      url?: string;
      specs: Record<string, any>;
    }>();

    for (const build of builds) {
      if (!build.monitors || !Array.isArray(build.monitors)) continue;

      const monitors = build.monitors as Array<{
        name: string;
        brand: string;
        resolution: string;
        size: string;
        refreshRate: string;
        panelType: string;
        price: number;
        url?: string;
        specs?: Record<string, any>;
      }>;

      for (const monitor of monitors) {
        // Use name as unique key for deduplication
        if (!monitorMap.has(monitor.name)) {
          monitorMap.set(monitor.name, {
            ...monitor,
            specs: monitor.specs || {},
          });
        }
      }
    }

    // Convert map to array
    let allMonitors = Array.from(monitorMap.values());

    // Extract unique filter options from all monitors (before filtering)
    const availableBrands = Array.from(
      new Set(allMonitors.map((monitor) => monitor.brand))
    ).sort();

    const availableResolutions = Array.from(
      new Set(allMonitors.map((monitor) => monitor.resolution))
    ).sort();

    const availablePanelTypes = Array.from(
      new Set(allMonitors.map((monitor) => monitor.panelType))
    ).sort();

    // Extract unique size options
    const sizeOptions = Array.from(
      new Set(
        allMonitors
          .map((monitor) => {
            const sizeMatch = monitor.size.match(/(\d+)/);
            return (sizeMatch && sizeMatch[1]) ? parseInt(sizeMatch[1]) : null;
          })
          .filter((size): size is number => size !== null)
      )
    ).sort((a, b) => a - b);

    // Extract unique refresh rate options
    const refreshRateOptions = Array.from(
      new Set(
        allMonitors
          .map((monitor) => {
            const refreshMatch = monitor.refreshRate.match(/(\d+)/);
            return (refreshMatch && refreshMatch[1]) ? parseInt(refreshMatch[1]) : null;
          })
          .filter((rate): rate is number => rate !== null)
      )
    ).sort((a, b) => a - b);

    // Apply filters
    // Brand filter
    if (input.brand && input.brand.length > 0) {
      allMonitors = allMonitors.filter((monitor) =>
        input.brand!.some((selectedBrand) =>
          monitor.brand.toLowerCase().includes(selectedBrand.toLowerCase())
        )
      );
    }

    // Resolution filter
    if (input.resolution && input.resolution.length > 0) {
      allMonitors = allMonitors.filter((monitor) =>
        input.resolution!.some((selectedResolution) =>
          monitor.resolution.toLowerCase().includes(selectedResolution.toLowerCase())
        )
      );
    }

    // Panel type filter
    if (input.panelType && input.panelType.length > 0) {
      allMonitors = allMonitors.filter((monitor) =>
        input.panelType!.some((selectedPanel) =>
          monitor.panelType.toLowerCase().includes(selectedPanel.toLowerCase())
        )
      );
    }

    // Size filter
    if (input.minSize !== undefined) {
      allMonitors = allMonitors.filter((monitor) => {
        const sizeMatch = monitor.size.match(/(\d+)/);
        if (sizeMatch && sizeMatch[1]) {
          const sizeValue = parseInt(sizeMatch[1]);
          return sizeValue >= input.minSize!;
        }
        return false;
      });
    }

    // Refresh rate filter
    if (input.minRefreshRate !== undefined) {
      allMonitors = allMonitors.filter((monitor) => {
        const refreshMatch = monitor.refreshRate.match(/(\d+)/);
        if (refreshMatch && refreshMatch[1]) {
          const refreshValue = parseInt(refreshMatch[1]);
          return refreshValue >= input.minRefreshRate!;
        }
        return false;
      });
    }

    // Price range filter
    if (input.minPrice !== undefined) {
      allMonitors = allMonitors.filter(
        (monitor) => monitor.price >= input.minPrice!
      );
    }
    if (input.maxPrice !== undefined) {
      allMonitors = allMonitors.filter(
        (monitor) => monitor.price <= input.maxPrice!
      );
    }

    // Search query filter
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      allMonitors = allMonitors.filter(
        (monitor) =>
          monitor.name.toLowerCase().includes(searchLower) ||
          monitor.brand.toLowerCase().includes(searchLower) ||
          monitor.resolution.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = input.sortBy || "price";
    const sortOrder = input.sortOrder || "asc";

    allMonitors.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;

        case "brand":
          comparison = a.brand.localeCompare(b.brand);
          break;

        case "size": {
          const aSizeMatch = a.size.match(/(\d+)/);
          const bSizeMatch = b.size.match(/(\d+)/);
          const aSizeValue = (aSizeMatch && aSizeMatch[1]) ? parseInt(aSizeMatch[1]) : 0;
          const bSizeValue = (bSizeMatch && bSizeMatch[1]) ? parseInt(bSizeMatch[1]) : 0;
          comparison = aSizeValue - bSizeValue;
          break;
        }

        case "refreshRate": {
          const aRefreshMatch = a.refreshRate.match(/(\d+)/);
          const bRefreshMatch = b.refreshRate.match(/(\d+)/);
          const aRefreshValue = (aRefreshMatch && aRefreshMatch[1]) ? parseInt(aRefreshMatch[1]) : 0;
          const bRefreshValue = (bRefreshMatch && bRefreshMatch[1]) ? parseInt(bRefreshMatch[1]) : 0;
          comparison = aRefreshValue - bRefreshValue;
          break;
        }
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Get total count after filtering
    const totalCount = allMonitors.length;

    // Apply pagination
    const skip = (input.page - 1) * itemsPerPage;
    const paginatedMonitors = allMonitors.slice(skip, skip + itemsPerPage);

    // Check if there are more monitors
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      monitors: paginatedMonitors,
      hasMore,
      totalResults: totalCount,
      filterOptions: {
        brands: availableBrands,
        resolutions: availableResolutions,
        panelTypes: availablePanelTypes,
        sizeOptions,
        refreshRateOptions,
      },
    };
  });
