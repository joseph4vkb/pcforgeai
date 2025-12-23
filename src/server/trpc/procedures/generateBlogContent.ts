import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

const blogOutputSchema = z.object({
  titleVariations: z.array(z.string()).min(3).max(5).describe("3-5 SEO-friendly, high-CTR title variations"),
  metaDescription: z.string().max(160).describe("Compelling meta description under 160 characters with keywords"),
  seoKeywords: z.array(z.string()).min(3).max(5).describe("3-5 primary and secondary SEO keywords"),
  articleContent: z.string().describe("Full article in Markdown format with H1, H2, H3 headings, naturally embedded component details and affiliate links"),
  category: z.string().describe("Blog category (Gaming PC, Budget Build, Workstation, etc.)"),
  tags: z.array(z.string()).min(3).max(8).describe("3-8 relevant tags for the blog post"),
  wordCount: z.number().describe("Approximate word count of the article"),
  readingTime: z.number().describe("Estimated reading time in minutes"),
});

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

export const generateBlogContent = baseProcedure
  .input(
    z.object({
      authToken: z.string(),
      buildId: z.number(),
      tone: z.enum(["technical", "beginner-friendly", "comparison", "influencer", "youtube-script"]).default("beginner-friendly"),
    })
  )
  .mutation(async ({ input }) => {
    // Verify admin authentication
    try {
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ id: z.number(), role: z.enum(["admin", "user"]) }).parse(verified);
      
      if (parsed.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required. Only admins can generate blog content.",
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

    // Fetch the PC build
    const build = await db.pcBuild.findUnique({
      where: { id: input.buildId },
    });

    if (!build) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "PC build not found",
      });
    }

    // Fetch admin config for OpenRouter credentials
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

    // Parse build parts
    const parts = build.parts as Array<{
      category: string;
      name: string;
      asin: string;
      price: number;
      specs: Record<string, any>;
      url: string;
    }>;

    const laptops = build.laptops as Array<{
      name: string;
      brand: string;
      processor: string;
      ram: string;
      storage: string;
      gpu: string;
      price: number;
      url: string;
      specs: Record<string, any>;
    }> | null;

    // Build concise component list with affiliate links
    const amazonAffiliateId = config.amazonAffiliateId;
    const componentList = parts.map(part => {
      // ALWAYS use search URL format with product name and affiliate tag
      const searchQuery = encodeURIComponent(part.name);
      const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${amazonAffiliateId}`;
      return `- ${part.category}: ${part.name} (₹${part.price.toLocaleString("en-IN")}) [Amazon Link: ${url}]`;
    }).join("\n");

    const laptopList = laptops ? laptops.map(laptop => {
      // ALWAYS use search URL format with product name and affiliate tag
      const searchQuery = encodeURIComponent(`${laptop.brand} ${laptop.name}`);
      const url = `https://www.amazon.in/s?k=${searchQuery}&tag=${amazonAffiliateId}`;
      return `- ${laptop.brand} ${laptop.name} - ${laptop.processor}, ${laptop.ram}, ${laptop.storage}, ${laptop.gpu} (₹${laptop.price.toLocaleString("en-IN")}) [Amazon Link: ${url}]`;
    }).join("\n") : "";

    // Tone-specific writing style
    const toneGuide: Record<string, string> = {
      "technical": "Use technical terminology, detailed specifications, benchmarks, and in-depth analysis. Target experienced PC builders.",
      "beginner-friendly": "Use simple, clear language. Explain technical terms. Make it easy to understand for first-time builders.",
      "comparison": "Focus on comparing components, discussing alternatives, value propositions, and include pros/cons sections.",
      "influencer": "Use engaging, conversational tone with personality, opinions, and personal recommendations.",
      "youtube-script": "Write as a video script with hooks, transitions, timestamps, and calls-to-action.",
    };

    // Optimized, simplified prompt focused on successful content generation
    const prompt = `Create SEO-optimized blog content for a PC build targeting the Indian market.

BUILD DETAILS:
- Category: ${build.category}
- Budget: ₹${build.totalCost.toLocaleString("en-IN")}
- Compatibility: ${build.compatibility}%

AMAZON AFFILIATE TAG: ${amazonAffiliateId}

COMPONENTS:
${componentList}

${laptopList ? `LAPTOPS:\n${laptopList}\n` : ""}

WRITING STYLE: ${toneGuide[input.tone]}

DELIVERABLES:
1. Title Variations: Generate 3-5 engaging, SEO-optimized titles
2. Meta Description: Write a compelling description under 160 characters with key terms
3. SEO Keywords: Identify 3-5 most relevant keywords
4. Article Content: Create an 800-1200 word article in Markdown with:
   - H1 main title
   - Introduction (hook the reader, 100 words)
   - H2 Build Overview (summarize the build and its purpose)
   - H2 Component Breakdown (use H3 for each part: explain specs, why it was chosen, include Amazon affiliate link)
   - H2 Performance & Use Cases (what can this build do?)
   - H2 Pros & Cons (balanced assessment)
   ${laptopList ? "- H2 PC vs Laptop Comparison (when to choose which)\n" : ""}
   - H2 Frequently Asked Questions (2-3 common questions with answers)
   - Conclusion (call-to-action, 100 words)
5. Category: Assign to "${build.category}"
6. Tags: Generate 3-8 relevant tags
7. Word Count: Calculate approximate word count
8. Reading Time: Estimate reading time in minutes

AMAZON LINK FORMAT:
- Use search URL format: https://www.amazon.in/s?k=PRODUCT_NAME&tag=${amazonAffiliateId}
- Make links natural: [Product Name](https://www.amazon.in/s?k=PRODUCT_NAME&tag=${amazonAffiliateId})
- Include affiliate tag in every Amazon URL

QUALITY GUIDELINES:
- Write for Indian audience (use ₹ for prices)
- Embed Amazon links naturally within the text
- Use proper Markdown formatting (# for H1, ## for H2, ### for H3)
- Keep content valuable and informative
- Avoid keyword stuffing
- Make the article engaging and easy to read

Generate the content now.`;

    try {
      // Retry logic with exponential backoff
      const result = await retryWithBackoff(async () => {
        const { object } = await generateObject({
          model,
          schema: blogOutputSchema,
          prompt,
          temperature: 0.7, // Balanced creativity and consistency
          maxTokens: 3000, // Reduced from 4000 to speed up generation
        });
        return object;
      }, 3, 2000);

      return {
        ...result,
        buildId: build.id,
        buildCategory: build.category,
        buildBudget: build.totalCost,
      };
    } catch (error: any) {
      console.error("AI blog generation error after retries:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to generate blog content. Please try again.";
      
      if (error?.message?.includes("API key") || error?.message?.includes("authentication")) {
        errorMessage = "OpenRouter API key is invalid or expired. Please check your configuration in Settings.";
      } else if (error?.message?.includes("rate limit") || error?.message?.includes("429")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error?.message?.includes("model") || error?.message?.includes("404")) {
        errorMessage = "The configured AI model is unavailable. Please check your model selection in Settings.";
      } else if (error?.message?.includes("timeout") || error?.message?.includes("timed out")) {
        errorMessage = "Request timed out. The AI service may be overloaded. Please try again in a few moments.";
      } else if (error?.message?.includes("network") || error?.message?.includes("ECONNREFUSED")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.code === "INSUFFICIENT_QUOTA") {
        errorMessage = "OpenRouter account has insufficient credits. Please add credits to your account.";
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
        cause: error,
      });
    }
  });
