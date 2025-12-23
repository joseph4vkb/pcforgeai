import { db } from "./db";

export default async function handler(event: any) {
  try {
    // Extract ad ID from the URL path
    // Expected format: /track/ad/{adId}
    const url = new URL(event.node.req.url || "", `http://${event.node.req.headers.host}`);
    const pathParts = url.pathname.split("/");
    const adIdStr = pathParts[pathParts.length - 1];
    const adId = parseInt(adIdStr, 10);

    if (isNaN(adId)) {
      return new Response("Invalid ad ID", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Fetch the banner ad
    const ad = await db.bannerAd.findUnique({
      where: { id: adId },
    });

    if (!ad || !ad.destinationUrl) {
      return new Response("Ad not found or has no destination URL", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Log the click with metadata
    const userAgent = event.node.req.headers["user-agent"] || "unknown";
    const referer = event.node.req.headers["referer"] || event.node.req.headers["referrer"] || "direct";
    const ip = event.node.req.headers["x-forwarded-for"] || 
               event.node.req.headers["x-real-ip"] || 
               event.node.req.connection?.remoteAddress || 
               "unknown";

    await db.adClick.create({
      data: {
        adId: ad.id,
        metadata: {
          userAgent,
          referer,
          ip: Array.isArray(ip) ? ip[0] : ip,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Redirect to the destination URL
    return new Response(null, {
      status: 302,
      headers: {
        Location: ad.destinationUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in tracking handler:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
