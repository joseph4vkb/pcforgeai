import { db } from "./db";
import { getBaseUrl } from "./utils/base-url";

export default async function handler(event: any) {
  try {
    const baseUrl = getBaseUrl();

    // Fetch all builds
    const builds = await db.pcBuild.findMany({
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch all published blog posts
    const blogs = await db.blogPost.findMany({
      where: {
        status: "published",
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Define static routes with their priorities and change frequencies
    const staticRoutes = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/build", priority: "0.9", changefreq: "weekly" },
      { url: "/builds", priority: "0.9", changefreq: "daily" },
      { url: "/products", priority: "0.8", changefreq: "weekly" },
      { url: "/laptops", priority: "0.8", changefreq: "weekly" },
      { url: "/monitors", priority: "0.8", changefreq: "weekly" },
      { url: "/headsets", priority: "0.8", changefreq: "weekly" },
      { url: "/mini-pcs", priority: "0.8", changefreq: "weekly" },
      { url: "/blogs", priority: "0.9", changefreq: "daily" },
      { url: "/compare", priority: "0.7", changefreq: "weekly" },
      { url: "/compare/laptops", priority: "0.7", changefreq: "weekly" },
      { url: "/login", priority: "0.5", changefreq: "monthly" },
      { url: "/register", priority: "0.5", changefreq: "monthly" },
      { url: "/forgot-password", priority: "0.3", changefreq: "monthly" },
      { url: "/account", priority: "0.6", changefreq: "weekly" },
    ];

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    for (const route of staticRoutes) {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${route.url}</loc>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += "  </url>\n";
    }

    // Add dynamic build routes
    for (const build of builds) {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/build/${build.id}</loc>\n`;
      xml += `    <lastmod>${build.createdAt.toISOString()}</lastmod>\n`;
      xml += "    <changefreq>monthly</changefreq>\n";
      xml += "    <priority>0.7</priority>\n";
      xml += "  </url>\n";
    }

    // Add dynamic blog routes
    for (const blog of blogs) {
      const lastmod = blog.publishedAt || blog.updatedAt;
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/blogs/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod.toISOString()}</lastmod>\n`;
      xml += "    <changefreq>monthly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    // Set proper headers for XML response
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
