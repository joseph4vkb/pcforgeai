import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

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

const partSchema = z.object({
  category: z.string(),
  name: z.string(),
  asin: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const laptopSchema = z.object({
  name: z.string(),
  brand: z.string(),
  processor: z.string(),
  ram: z.string(),
  storage: z.string(),
  gpu: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const monitorSchema = z.object({
  name: z.string(),
  brand: z.string(),
  resolution: z.string(),
  size: z.string(),
  refreshRate: z.string(),
  panelType: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const headsetSchema = z.object({
  name: z.string(),
  brand: z.string(),
  type: z.string(), // Wired/Wireless
  connectivity: z.string(),
  features: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const miniPcSchema = z.object({
  name: z.string(),
  brand: z.string(),
  processor: z.string(),
  ram: z.string(),
  storage: z.string(),
  gpu: z.string(),
  price: z.number(),
  specs: z.record(z.any()),
});

const buildOutputSchema = z.object({
  parts: z.array(partSchema),
  laptops: z.array(laptopSchema).min(1).max(4).describe("1-4 recommended laptops that match the PC build's performance (aim for 3-4)"),
  monitors: z.array(monitorSchema).min(1).max(4).describe("1-4 recommended monitors suitable for this build (aim for 2-4)"),
  headsets: z.array(headsetSchema).min(1).max(4).describe("1-4 recommended gaming/professional headsets (aim for 2-4)"),
  miniPcs: z.array(miniPcSchema).min(1).max(4).describe("1-4 recommended Mini PCs with similar performance to this build (aim for 2-4)"),
  totalCost: z.number(),
  compatibility: z.number().min(90, "Compatibility score must be at least 90%"),
  compatibilityNotes: z.string().describe("Detailed explanation of why components are compatible"),
});

export const generatePcBuild = baseProcedure
  .input(
    z.object({
      category: z.string(),
      budget: z.number(),
    })
  )
  .mutation(async ({ input }) => {
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

    const prompt = `Generate a complete PC build for the Indian market with accessories.

BUILD PARAMETERS:
Category: ${input.category}
Target Budget: ₹${input.budget.toLocaleString("en-IN")}

CRITICAL BUDGET REQUIREMENTS (DO YOUR BEST):
- Target range: ₹${Math.floor(input.budget * 0.85).toLocaleString("en-IN")} - ₹${Math.ceil(input.budget * 1.15).toLocaleString("en-IN")} (±15% is ideal)
- The total cost should be as close to ₹${input.budget.toLocaleString("en-IN")} as possible
- If exact match is difficult, prioritize a working build over perfect budget matching
- Prioritize value and performance within the budget
${input.budget < 50000 ? '- Budget build: Use entry-level components, consider APUs with integrated graphics to save costs' : ''}
${input.budget >= 50000 && input.budget < 100000 ? '- Mid-range build: Balance performance and cost, focus on best value components' : ''}
${input.budget >= 100000 ? '- High-end build: Premium components while maintaining value, avoid unnecessarily expensive parts' : ''}

REQUIRED COMPONENTS (exactly 8):
1. CPU - Intel or AMD processor
2. Motherboard - Compatible chipset and socket
3. RAM - 8GB/16GB/32GB, DDR4 or DDR5
4. GPU - Dedicated GPU or "INTEGRATED" for APU builds
5. SSD - NVMe or SATA storage
6. PSU - Adequate wattage for components
7. Case - Mid/Full tower
8. Cooler - Air/AIO or "STOCK" for stock coolers

INDIAN MARKET PRICING GUIDELINES (2024-2025 - MUST BE ACCURATE):

Entry-Level Components (₹30k-60k builds):
- CPU: Intel i3-12100F (₹7,000-9,000), Ryzen 5 5600G (₹12,000-14,000), i3-13100F (₹9,000-11,000)
- Motherboard: H610 (₹5,000-7,000), B450 (₹5,000-7,000), A520 (₹4,000-6,000)
- RAM: 8GB DDR4 (₹1,500-2,500), 16GB DDR4 (₹3,000-4,500)
- GPU: GTX 1650 (₹12,000-15,000), RX 6500 XT (₹13,000-16,000), INTEGRATED for APU
- SSD: 256GB NVMe (₹1,500-2,500), 512GB NVMe (₹2,500-4,000)
- PSU: 450W (₹2,000-3,500), 550W (₹3,000-4,500)
- Case: Budget cases (₹2,000-3,500)
- Cooler: Stock cooler (₹0), basic tower cooler (₹800-1,500)

Mid-Range Components (₹60k-120k builds):
- CPU: i5-12400F (₹12,000-15,000), Ryzen 5 5600X (₹14,000-17,000), i5-13400F (₹16,000-19,000)
- Motherboard: B660 (₹10,000-15,000), B550 (₹9,000-14,000)
- RAM: 16GB DDR4 (₹3,000-4,500), 32GB DDR4 (₹6,000-9,000), 16GB DDR5 (₹5,000-7,000)
- GPU: RTX 3060 (₹28,000-35,000), RTX 4060 (₹32,000-38,000), RX 6700 XT (₹32,000-38,000)
- SSD: 512GB NVMe (₹2,500-4,000), 1TB NVMe (₹4,500-7,000)
- PSU: 650W (₹4,500-6,500), 750W (₹6,000-8,500)
- Case: Mid-range cases (₹3,500-6,000)
- Cooler: Tower cooler (₹1,500-3,000), 240mm AIO (₹5,000-8,000)

High-End Components (₹120k+ builds):
- CPU: i7-13700K (₹35,000-42,000), Ryzen 7 7800X3D (₹38,000-45,000), i9-13900K (₹50,000-60,000)
- Motherboard: Z690 (₹18,000-30,000), B650 (₹15,000-22,000), X670 (₹25,000-40,000)
- RAM: 32GB DDR5 (₹10,000-15,000), 64GB DDR5 (₹20,000-30,000)
- GPU: RTX 4070 (₹55,000-65,000), RTX 4070 Ti (₹75,000-85,000), RTX 4080 (₹1,00,000-1,20,000)
- SSD: 1TB NVMe Gen4 (₹7,000-10,000), 2TB NVMe Gen4 (₹12,000-18,000)
- PSU: 850W (₹9,000-13,000), 1000W (₹13,000-18,000)
- Case: Premium cases (₹6,000-12,000)
- Cooler: 280mm AIO (₹9,000-13,000), 360mm AIO (₹12,000-18,000)

COMPONENT SPECIFICATIONS:
- Use real Amazon India ASINs (10 characters) or special values: "STOCK", "INTEGRATED"
- Use REALISTIC 2024-2025 Indian market prices from the ranges above
- Provide detailed specs for each component
- Ensure socket/chipset compatibility (e.g., AM5 CPU with AM5 motherboard)
- Match RAM type with motherboard (DDR4 or DDR5)
- Verify PSU wattage is sufficient for all components
- Compatibility score should be 95% or higher if possible

LAPTOP RECOMMENDATIONS (aim for 3-4 laptops, minimum 2):
- Suggest laptops matching PC build performance and category
- Popular brands: Dell, HP, Lenovo, ASUS, Acer, MSI
- CRITICAL PRICING ACCURACY:
  * Entry gaming laptops: ₹45,000-70,000 (GTX 1650, i5/Ryzen 5, 8GB RAM)
  * Mid-range gaming: ₹70,000-1,20,000 (RTX 3050/4050, i5/Ryzen 5, 16GB RAM)
  * High-end gaming: ₹1,20,000-2,00,000 (RTX 4060/4070, i7/Ryzen 7, 16GB+ RAM)
  * Content creation: ₹80,000-1,80,000 (powerful CPU, 16GB+ RAM, color-accurate display)
  * Office/productivity: ₹35,000-60,000 (integrated graphics, 8-16GB RAM)
- Price range similar to PC build total cost (±20%)
- Try to generate 3-4 laptops with ACCURATE Indian market prices (minimum 2 is acceptable)

MONITOR RECOMMENDATIONS (aim for 2-4 monitors, minimum 1):
- Suggest monitors specifically suitable for the "${input.category}" category
- Popular brands: LG, Samsung, ASUS, Acer, BenQ, Dell, MSI
- CRITICAL PRICING ACCURACY:
  * 1080p 60Hz office monitors: ₹8,000-15,000
  * 1080p 144Hz gaming monitors: ₹12,000-20,000
  * 1440p 144Hz gaming monitors: ₹20,000-35,000
  * 1440p 165Hz+ gaming monitors: ₹25,000-45,000
  * 4K 60Hz monitors: ₹25,000-40,000
  * 4K 144Hz gaming monitors: ₹50,000-80,000
  * Professional color-accurate monitors: ₹30,000-70,000
- Match monitor specifications to the build's category and performance level
- Gaming builds: High refresh rate monitors (144Hz+)
- Content Creation/Video Editing: Color-accurate IPS panels, high resolution (1440p/4K)
- Office/Productivity: Standard 1080p/1440p monitors with good ergonomics
- Try to generate 2-4 monitors with ACCURATE prices (minimum 1 is acceptable)

HEADSET RECOMMENDATIONS (aim for 2-4 headsets, minimum 1):
- Suggest headsets specifically appropriate for the "${input.category}" category
- Popular brands: HyperX, Logitech, Razer, SteelSeries, Corsair, Sony, JBL, Audio-Technica
- CRITICAL PRICING ACCURACY:
  * Budget gaming headsets: ₹1,500-3,000 (basic wired, decent audio)
  * Mid-range gaming headsets: ₹3,000-7,000 (good audio, comfortable, wireless options)
  * Premium gaming headsets: ₹7,000-15,000 (excellent audio, wireless, premium build)
  * Professional studio headsets: ₹5,000-25,000 (accurate audio reproduction, comfortable)
  * Office/call headsets: ₹1,500-5,000 (clear microphone, comfortable for long use)
- Match headset type to the build's category
- Try to generate 2-4 headsets with ACCURATE prices (minimum 1 is acceptable)

MINI PC RECOMMENDATIONS (aim for 2-4 Mini PCs, minimum 1):
- Suggest Mini PCs with SIMILAR CONFIGURATION and performance to this PC build
- CRITICAL: Match the processor class, RAM capacity, storage type, and GPU capability
- CRITICAL PRICING ACCURACY:
  * Entry-level Mini PCs (Celeron/i3/Ryzen 3, 8GB RAM, integrated graphics): ₹20,000-40,000
  * Mid-range Mini PCs (i5/Ryzen 5, 16GB RAM, integrated/entry discrete graphics): ₹40,000-80,000
  * High-end Mini PCs (i7/Ryzen 7, 16GB+ RAM, better discrete graphics): ₹80,000-1,50,000
  * Workstation Mini PCs (powerful CPU, 32GB+ RAM, professional graphics): ₹1,00,000-2,50,000
- Popular brands: Intel NUC, ASUS, HP, Lenovo, Beelink, Minisforum, Geekom
- Price range should be comparable to the PC build total cost (±30%)
- Try to generate 2-4 Mini PCs with ACCURATE prices and similar performance (minimum 1 is acceptable)

CATEGORY-SPECIFIC OPTIMIZATION:
${input.category === "Gaming" ? `
GAMING BUILD FOCUS:
- PC: Prioritize GPU performance (RTX 3060/4060 or better), 16GB+ RAM, fast SSD
- Laptops: Gaming laptops with dedicated NVIDIA/AMD GPUs (RTX 3050+, RX 6600M+)
- Monitors: High refresh rate (144Hz-240Hz), 1080p or 1440p, low response time
- Headsets: Gaming headsets with 7.1 surround sound, RGB, good microphone
- Mini PCs: Gaming-focused Mini PCs with dedicated graphics or powerful APUs
` : ""}
${input.category === "Content Creation" ? `
CONTENT CREATION BUILD FOCUS:
- PC: Prioritize CPU cores (8+ cores), 32GB RAM if budget allows, fast NVMe SSD, capable GPU
- Laptops: Creator laptops with powerful CPUs (i7/Ryzen 7+), 16GB+ RAM, color-accurate displays
- Monitors: Color-accurate IPS panels, 1440p or 4K resolution, 99% sRGB or wider gamut
- Headsets: Studio-quality headphones with flat frequency response, accurate audio reproduction
- Mini PCs: Workstation Mini PCs with multi-core processors, high RAM capacity
` : ""}
${input.category === "AI/ML Development" ? `
AI/ML DEVELOPMENT BUILD FOCUS:
- PC: Focus on GPU with high VRAM (12GB+), powerful CPU, 32GB+ RAM, fast storage
- Laptops: Laptops with NVIDIA RTX GPUs (for CUDA), 16GB+ RAM, powerful processors
- Monitors: Large screens (27"+) for code/data visualization, high resolution (1440p+)
- Headsets: Quality headsets for video calls and meetings, noise cancellation helpful
- Mini PCs: Workstation Mini PCs with powerful processors, high RAM
` : ""}
${input.category === "Video Editing" ? `
VIDEO EDITING BUILD FOCUS:
- PC: Balance CPU (8+ cores), GPU (for encoding), 32GB RAM, fast NVMe SSD (1TB+)
- Laptops: Laptops with powerful CPUs and GPUs, 16GB+ RAM, fast storage, color-accurate displays
- Monitors: 4K or high-resolution (1440p), color-accurate IPS panels, large size (27"+)
- Headsets: Studio-quality headsets with accurate audio reproduction
- Mini PCs: High-performance Mini PCs with multi-core CPUs, high RAM, fast storage
` : ""}
${input.category === "Office/Productivity" ? `
OFFICE/PRODUCTIVITY BUILD FOCUS:
- PC: Use integrated graphics (APU), focus on efficiency, 8-16GB RAM, adequate storage
- Laptops: Business laptops with good battery life, 8-16GB RAM, integrated graphics
- Monitors: 1080p or 1440p office monitors, ergonomic features, eye care technology
- Headsets: Comfortable headsets optimized for calls and meetings, noise cancellation
- Mini PCs: Compact office Mini PCs with integrated graphics, energy efficient
` : ""}
${input.category === "Budget Gaming" ? `
BUDGET GAMING BUILD FOCUS:
- PC: Balance GPU and CPU, maximize value, 16GB RAM, entry-level dedicated GPU or strong APU
- Laptops: Budget gaming laptops with GTX 1650/RTX 3050 or equivalent
- Monitors: 1080p 144Hz monitors, affordable IPS or VA panels
- Headsets: Budget gaming headsets with good audio quality and microphone
- Mini PCs: Budget gaming Mini PCs with strong APUs
` : ""}

CRITICAL SUCCESS REQUIREMENTS:
1. ALWAYS generate exactly 8 PC components (this is mandatory)
2. Try to generate 3-4 laptops with ACCURATE Indian market prices (minimum 2 acceptable)
3. Try to generate 2-4 monitors with ACCURATE prices matching the build category (minimum 1 acceptable)
4. Try to generate 2-4 headsets with ACCURATE prices matching the build category (minimum 1 acceptable)
5. Try to generate 2-4 Mini PCs with ACCURATE prices and similar configuration (minimum 1 acceptable)
6. Compatibility score should be 95% or higher if possible
7. ALL prices MUST be realistic and accurate for the Indian market (2024-2025)
8. Total PC build cost should ideally be within ±15% of the target budget (₹${input.budget.toLocaleString("en-IN")}), but getting close is acceptable
9. All recommendations should align with the "${input.category}" category
10. PRIORITIZE generating a complete, working build over perfect specifications

PRICE ACCURACY IS CRITICAL:
- Double-check all prices against the ranges provided above
- Ensure prices are realistic for Indian market conditions
- Consider import duties, GST, and retailer margins in pricing
- Use current market prices, not outdated or international prices

RESPONSE FORMAT:
- Return ONLY valid JSON matching the exact schema
- No markdown formatting, no code blocks, no explanations
- Do your best to include recommended accessories, but prioritize a complete PC build
- Double-check all compatibility requirements before responding
- Verify all prices are accurate and within specified ranges

Generate the complete PC build with all recommendations now as a JSON object.`;

    try {
      // Retry logic with exponential backoff
      const result = await retryWithBackoff(async () => {
        const { object } = await generateObject({
          model,
          schema: buildOutputSchema,
          prompt,
          temperature: 0.7, // Balanced creativity and consistency
          maxTokens: 6000, // Increased to ensure enough tokens for all accessories
        });
        return object;
      }, 3, 2000);

      // Log the generated result for debugging
      console.log("✓ AI generation complete");
      console.log(`  - Parts: ${result.parts.length}`);
      console.log(`  - Laptops: ${result.laptops.length}`);
      console.log(`  - Monitors: ${result.monitors.length}`);
      console.log(`  - Headsets: ${result.headsets.length}`);
      console.log(`  - Mini PCs: ${result.miniPcs.length}`);

      // RELAXED VALIDATION: Log warnings for accessory arrays that don't meet ideal counts
      // These are now warnings only, not hard failures
      if (result.laptops.length < 3) {
        console.warn(`⚠️ Laptops count lower than ideal: Got ${result.laptops.length}, ideal is 3-4. Continuing anyway.`);
      }

      if (result.monitors.length < 2) {
        console.warn(`⚠️ Monitors count lower than ideal: Got ${result.monitors.length}, ideal is 2-4. Continuing anyway.`);
      }

      if (result.headsets.length < 2) {
        console.warn(`⚠️ Headsets count lower than ideal: Got ${result.headsets.length}, ideal is 2-4. Continuing anyway.`);
      }

      if (result.miniPcs.length < 2) {
        console.warn(`⚠️ Mini PCs count lower than ideal: Got ${result.miniPcs.length}, ideal is 2-4. Continuing anyway.`);
      }

      console.log("✓ All accessory arrays validated (with warnings if applicable)");

      // Calculate the actual total cost from parts to ensure accuracy
      const actualTotalCost = result.parts.reduce((sum, part) => sum + part.price, 0);

      // RELAXED VALIDATION: Budget Check - now only logs warnings, doesn't fail
      const budgetMin = input.budget * 0.85;
      const budgetMax = input.budget * 1.15;
      const wideBudgetMin = input.budget * 0.70;
      const wideBudgetMax = input.budget * 1.30;

      // Log warnings for budget deviation but don't fail
      if (actualTotalCost < wideBudgetMin || actualTotalCost > wideBudgetMax) {
        console.warn(`⚠️ Budget significantly off target: Total cost ₹${actualTotalCost.toLocaleString("en-IN")} is outside wide range ₹${wideBudgetMin.toLocaleString("en-IN")}-₹${wideBudgetMax.toLocaleString("en-IN")} (±30%). Continuing anyway.`);
      } else if (actualTotalCost < budgetMin || actualTotalCost > budgetMax) {
        console.warn(`⚠️ Budget slightly off target: Total cost ₹${actualTotalCost.toLocaleString("en-IN")} is outside preferred range ₹${budgetMin.toLocaleString("en-IN")}-₹${budgetMax.toLocaleString("en-IN")} (±15%). Still acceptable.`);
      } else {
        console.log(`✓ Budget check passed: Total cost ₹${actualTotalCost.toLocaleString("en-IN")} is within preferred range`);
      }

      // VALIDATION 2: Compatibility Score Check (must be ≥90%) - LOG WARNING BUT DON'T FAIL
      if (result.compatibility < 90) {
        console.warn(`⚠️ Compatibility score ${result.compatibility}% is below 90%. Returning build anyway.`);
      } else {
        console.log(`✓ Compatibility check passed: ${result.compatibility}%`);
      }

      // VALIDATION 3: Ensure all 8 required components are present - THIS IS MANDATORY
      const requiredCategories = ["CPU", "Motherboard", "RAM", "GPU", "SSD", "PSU", "Case", "Cooler"];
      const presentCategories = result.parts.map(p => p.category);
      const missingCategories = requiredCategories.filter(cat => !presentCategories.includes(cat));
      
      if (missingCategories.length > 0) {
        console.error(`Missing required components: ${missingCategories.join(", ")}`);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Generated build is missing required components: ${missingCategories.join(", ")}. Please try again.`,
        });
      }

      // VALIDATION 4: Price reasonableness check for accessories
      const priceWarnings: string[] = [];

      // Check laptop prices
      if (result.laptops) {
        result.laptops.forEach((laptop, idx) => {
          if (laptop.price < 25000 || laptop.price > 300000) {
            priceWarnings.push(`Laptop ${idx + 1} (${laptop.name}): Price ₹${laptop.price.toLocaleString("en-IN")} seems unrealistic`);
          }
        });
      }

      // Check monitor prices
      if (result.monitors) {
        result.monitors.forEach((monitor, idx) => {
          if (monitor.price < 5000 || monitor.price > 100000) {
            priceWarnings.push(`Monitor ${idx + 1} (${monitor.name}): Price ₹${monitor.price.toLocaleString("en-IN")} seems unrealistic`);
          }
        });
      }

      // Check headset prices
      if (result.headsets) {
        result.headsets.forEach((headset, idx) => {
          if (headset.price < 1000 || headset.price > 30000) {
            priceWarnings.push(`Headset ${idx + 1} (${headset.name}): Price ₹${headset.price.toLocaleString("en-IN")} seems unrealistic`);
          }
        });
      }

      // Check mini PC prices
      if (result.miniPcs) {
        result.miniPcs.forEach((miniPc, idx) => {
          if (miniPc.price < 15000 || miniPc.price > 300000) {
            priceWarnings.push(`Mini PC ${idx + 1} (${miniPc.name}): Price ₹${miniPc.price.toLocaleString("en-IN")} seems unrealistic`);
          }
        });
      }

      if (priceWarnings.length > 0) {
        console.warn(`⚠️ Price warnings detected:\n${priceWarnings.join('\n')}`);
      }

      console.log(`✓ Build validation complete: Budget ₹${actualTotalCost.toLocaleString("en-IN")} (target: ₹${input.budget.toLocaleString("en-IN")}), Compatibility: ${result.compatibility}%`);

      // Add URLs to each part using the Amazon search format
      const partsWithUrls = result.parts.map((part) => {
        const searchQuery = encodeURIComponent(part.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;
        
        return {
          ...part,
          url,
        };
      });

      // Add URLs to each laptop using Amazon search
      const laptopsWithUrls = result.laptops.map((laptop) => {
        const searchQuery = encodeURIComponent(laptop.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;
        
        return {
          ...laptop,
          url,
        };
      });

      // Add URLs to each monitor using Amazon search
      const monitorsWithUrls = result.monitors.map((monitor) => {
        const searchQuery = encodeURIComponent(monitor.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;
        
        return {
          ...monitor,
          url,
        };
      });

      // Add URLs to each headset using Amazon search
      const headsetsWithUrls = result.headsets.map((headset) => {
        const searchQuery = encodeURIComponent(headset.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;
        
        return {
          ...headset,
          url,
        };
      });

      // Add URLs to each mini PC using Amazon search
      const miniPcsWithUrls = result.miniPcs.map((miniPc) => {
        const searchQuery = encodeURIComponent(miniPc.name);
        const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${config.amazonAffiliateId}`;
        
        return {
          ...miniPc,
          url,
        };
      });

      return {
        category: input.category,
        budget: input.budget,
        parts: partsWithUrls,
        laptops: laptopsWithUrls,
        monitors: monitorsWithUrls,
        headsets: headsetsWithUrls,
        miniPcs: miniPcsWithUrls,
        totalCost: actualTotalCost, // Use calculated total instead of AI's totalCost
        compatibility: result.compatibility,
        compatibilityNotes: result.compatibilityNotes,
      };
    } catch (error: any) {
      // If it's already a TRPCError (from our validations), re-throw it
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Provide more specific error messages
      console.error("AI PC build generation error after retries:", error);
      
      let errorMessage = "Failed to generate PC build. Please try again.";
      
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
