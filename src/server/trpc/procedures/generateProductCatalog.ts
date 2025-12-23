import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

const productSchema = z.object({
  category: z.enum(["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "Cooler"]),
  name: z.string(),
  asin: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const productsArraySchema = z.object({
  products: z.array(productSchema)
});

export const generateProductCatalog = baseProcedure
  .input(z.object({
    authToken: z.string(),
    count: z.number().int().min(1).max(500).default(100),
  }))
  .mutation(async ({ input }) => {
    console.log("generateProductCatalog called with input:", JSON.stringify(input, null, 2));
    // Authenticate admin
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);

      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    // Fetch admin config to get OpenRouter API key and model
    const config = await db.adminConfig.findFirst();

    if (!config) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Admin config not found",
      });
    }

    const openrouter = createOpenRouter({
      apiKey: config.openrouterApiKey,
    });

    const model = openrouter(config.openrouterModel);

    // Calculate distribution based on count
    const cpuCount = Math.round(input.count * 0.15);
    const gpuCount = Math.round(input.count * 0.15);
    const motherboardCount = Math.round(input.count * 0.15);
    const ramCount = Math.round(input.count * 0.15);
    const storageCount = Math.round(input.count * 0.15);
    const psuCount = Math.round(input.count * 0.10);
    const caseCount = Math.round(input.count * 0.10);
    const coolerCount = Math.max(1, input.count - (cpuCount + gpuCount + motherboardCount + ramCount + storageCount + psuCount + caseCount));

    const prompt = `Generate a comprehensive PC components catalog for the Indian market.

REQUIREMENTS:
Generate ${input.count} products distributed as follows:
- CPU: ${cpuCount} products
- GPU: ${gpuCount} products
- Motherboard: ${motherboardCount} products
- RAM: ${ramCount} products
- Storage: ${storageCount} products
- PSU: ${psuCount} products
- Case: ${caseCount} products
- Cooler: ${coolerCount} products

COMPONENT DETAILS:
Each product must include:
- category: Component type (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler)
- name: Full product name with brand and model (e.g., "AMD Ryzen 7 7800X3D Processor")
- asin: Real Amazon India ASIN (10-character alphanumeric like B0BTDL8N8T)
- price: Price in Indian Rupees (realistic 2024-2025 market price)
- specs: Object with relevant specifications

BRANDS TO USE:
- CPU: Intel (Core i3/i5/i7/i9), AMD (Ryzen 3/5/7/9)
- GPU: Nvidia (RTX 3050/3060/4060/4070), AMD (RX 6600/7600)
- Motherboard: ASUS, MSI, Gigabyte, ASRock
- RAM: Corsair, G.Skill, Kingston, Crucial
- Storage: Samsung, WD, Crucial, Kingston
- PSU: Corsair, Cooler Master, Seasonic, Thermaltake
- Case: NZXT, Lian Li, Corsair, Cooler Master
- Cooler: Noctua, Cooler Master, Arctic, NZXT

SPECIFICATIONS TO VARY:
- CPUs: 4-16 cores, 65W-125W TDP, different generations
- GPUs: 4GB-16GB VRAM, various performance tiers
- Motherboards: B550/B650/X670/Z690/Z790, ATX/mATX/Mini-ITX
- RAM: 8GB-64GB, 3200-6000MHz, DDR4/DDR5
- Storage: 256GB-4TB, NVMe/SATA, 3500-7000MB/s
- PSUs: 450W-1000W, 80+ Bronze/Gold/Platinum
- Cases: Mid/Full Tower, various colors, RGB options
- Coolers: Air/AIO, 120mm-360mm

PRICING GUIDANCE:
- Include budget, mid-range, and high-end options
- Use realistic current Indian market prices
- Ensure variety across all price ranges

CRITICAL INSTRUCTIONS:
- Return ONLY a JSON array of products
- No markdown formatting, no code blocks, no explanation
- Start with [ and end with ]
- Use unique ASINs for each product
- Ensure realistic specifications and pricing

Generate the product catalog now as a JSON array.`;

    try {
      // Retry logic with exponential backoff
      const result = await retryWithBackoff(async () => {
        const { object } = await generateObject({
          model,
          schema: productsArraySchema,
          prompt,
          temperature: 0.7, // Balanced creativity and consistency
          maxTokens: 8000, // Increased to avoid truncation for larger counts
        });
        return object.products;
      }, 3, 2000);

      console.log(`AI successfully generated ${result.length} objects.`);

      // Clear existing products
      await db.productCatalog.deleteMany({});

      // Prepare products with URLs and imageUrls
      const productsToInsert = result.map((product) => {
        const searchQuery = encodeURIComponent(product.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;

        // Generate a placeholder image URL (in production, these would be real Amazon images)
        const imageUrl = `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(product.category)}`;

        return {
          category: product.category,
          name: product.name,
          asin: product.asin,
          price: product.price,
          url,
          imageUrl,
          specs: product.specs,
        };
      });

      // De-duplicate by ASIN to prevent unique constraint violations
      const seenAsins = new Set<string>();
      const uniqueProducts = productsToInsert.filter((product) => {
        if (seenAsins.has(product.asin)) {
          console.warn(`Duplicate ASIN detected and removed: ${product.asin} (${product.name})`);
          return false;
        }
        seenAsins.add(product.asin);
        return true;
      });

      console.log(`Generated ${productsToInsert.length} products, ${uniqueProducts.length} unique products after de-duplication`);

      // Insert all unique products
      await db.productCatalog.createMany({
        data: uniqueProducts,
      });

      return {
        success: true,
        count: uniqueProducts.length,
        message: `Successfully generated and saved ${uniqueProducts.length} products to the catalog`,
      };
    } catch (error: any) {
      console.error("AI product catalog generation error after retries:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to generate product catalog. Please try again.";

      if (error?.message?.includes("API key")) {
        errorMessage = "OpenRouter API key is invalid or expired. Please check your configuration.";
      } else if (error?.message?.includes("rate limit")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error?.message?.includes("model")) {
        errorMessage = "The configured AI model is unavailable. Please check your model selection in settings.";
      } else if (error?.message?.includes("timeout")) {
        errorMessage = "Request timed out. The AI model may be overloaded. Please try again.";
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
        cause: error,
      });
    }
  });
