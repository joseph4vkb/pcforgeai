import { z } from "zod";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getAmazonProducts = baseProcedure
  .input(
    z.object({
      category: z.enum([
        "CPU",
        "GPU",
        "Motherboard",
        "RAM",
        "Storage",
        "PSU",
        "Case",
        "Cooler",
        "All",
      ]).default("All"),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      searchQuery: z.string().optional(),
      page: z.number().default(1),
    })
  )
  .query(async ({ input }) => {
    const itemsPerPage = 10;

    // Fetch products from ProductCatalog
    const catalogProducts = await db.productCatalog.findMany({
      orderBy: {
        price: "asc",
      },
    });

    // Fetch all PC builds and extract their parts
    const builds = await db.pcBuild.findMany({
      select: {
        parts: true,
      },
    });

    // Extract all parts from builds and convert to product format
    const buildProducts: Array<{
      asin: string;
      name: string;
      price: number;
      category: string;
      imageUrl: string;
      url: string;
      specs: Record<string, any>;
    }> = [];

    // Get admin config for affiliate ID
    const config = await db.adminConfig.findFirst();
    const affiliateId = config?.amazonAffiliateId || "";

    for (const build of builds) {
      const parts = build.parts as Array<{
        category: string;
        name: string;
        asin: string;
        price: number;
      }>;

      for (const part of parts) {
        // Create product entry from build part
        const searchQuery = encodeURIComponent(part.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${affiliateId}`;
        const imageUrl = `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(part.category)}`;

        buildProducts.push({
          asin: part.asin,
          name: part.name,
          price: part.price,
          category: part.category,
          imageUrl,
          url,
          specs: (part as any).specs || {},
        });
      }
    }

    // Merge products from both sources, using ASIN as unique key
    const productMap = new Map<string, {
      asin: string;
      name: string;
      price: number;
      category: string;
      imageUrl: string;
      url: string;
      specs: Record<string, any>;
    }>();

    // Add catalog products first
    for (const product of catalogProducts) {
      productMap.set(product.asin, {
        asin: product.asin,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || "",
        url: product.url,
        specs: (product.specs as Record<string, any>) || {},
      });
    }

    // Add build products (will not override if ASIN already exists)
    for (const product of buildProducts) {
      if (!productMap.has(product.asin)) {
        productMap.set(product.asin, product);
      }
    }

    // Convert map to array
    let allProducts = Array.from(productMap.values());

    // CRITICAL FILTER: Remove products with zero price
    allProducts = allProducts.filter((product) => product.price > 0);

    // Apply filters
    // Category filter
    if (input.category !== "All") {
      allProducts = allProducts.filter((product) => {
        // Handle Storage category mapping - match both "Storage", "SSD", and "HDD"
        if (input.category === "Storage") {
          return (
            product.category === "Storage" ||
            product.category === "SSD" ||
            product.category === "HDD"
          );
        }
        return product.category === input.category;
      });
    }

    // Price range filter
    if (input.minPrice !== undefined) {
      allProducts = allProducts.filter(
        (product) => product.price >= input.minPrice!
      );
    }
    if (input.maxPrice !== undefined) {
      allProducts = allProducts.filter(
        (product) => product.price <= input.maxPrice!
      );
    }

    // Search query filter
    if (input.searchQuery) {
      const searchLower = input.searchQuery.toLowerCase();
      allProducts = allProducts.filter((product) =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by price
    allProducts.sort((a, b) => a.price - b.price);

    // Get total count after filtering
    const totalCount = allProducts.length;

    // Apply pagination
    const skip = (input.page - 1) * itemsPerPage;
    const paginatedProducts = allProducts.slice(skip, skip + itemsPerPage);

    // Check if there are more products
    const hasMore = totalCount > input.page * itemsPerPage;

    return {
      products: paginatedProducts,
      hasMore,
      totalResults: totalCount,
    };
  });
