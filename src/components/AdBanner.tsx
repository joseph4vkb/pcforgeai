import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useMemo } from "react";

interface AdBannerProps {
  locationKey: string;
  className?: string;
}

interface BannerAd {
  id: number;
  imageUrl: string | null;
  destinationUrl: string | null;
  locationKey: string;
  priority: number;
  htmlContent: string | null;
}

export function AdBanner({ locationKey, className = "" }: AdBannerProps) {
  const trpc = useTRPC();

  // Fetch all active banners with shorter cache time (30 seconds)
  const bannersQuery = useQuery(
    trpc.getActiveBanners.queryOptions(undefined, {
      staleTime: 30 * 1000, // 30 seconds - short cache to ensure new ads appear quickly
      gcTime: 60 * 1000, // 1 minute
    })
  );

  // Filter banners for this location and select one using weighted random
  const selectedAd = useMemo(() => {
    if (!bannersQuery.data) return null;

    const locationAds = bannersQuery.data.filter(
      (ad) => ad.locationKey === locationKey
    );

    if (locationAds.length === 0) return null;
    if (locationAds.length === 1) return locationAds[0];

    // Weighted random selection based on priority
    const totalPriority = locationAds.reduce((sum, ad) => sum + ad.priority, 0);
    let random = Math.random() * totalPriority;

    for (const ad of locationAds) {
      random -= ad.priority;
      if (random <= 0) {
        return ad;
      }
    }

    // Fallback to first ad (should never happen)
    return locationAds[0];
  }, [bannersQuery.data, locationKey]);

  if (!selectedAd) return null;

  // Render HTML content directly
  if (selectedAd.htmlContent) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: selectedAd.htmlContent }}
      />
    );
  }

  // Render image banner with click tracking
  if (selectedAd.imageUrl && selectedAd.destinationUrl) {
    return (
      <div className={className}>
        <a
          href={`/track/ad/${selectedAd.id}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
        >
          <img
            src={selectedAd.imageUrl}
            alt="Advertisement"
            className="w-full h-auto rounded-lg shadow-lg transition hover:opacity-90"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  return null;
}
