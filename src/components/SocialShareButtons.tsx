import { Facebook, Twitter, Linkedin, Share2 } from "lucide-react";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export function SocialShareButtons({ url, title, className = "" }: SocialShareButtonsProps) {
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const handleShare = (platform: string) => {
    let shareLink = "";
    
    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${shareTitle}%20${shareUrl}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-400">Share:</span>
      
      <button
        onClick={() => handleShare("twitter")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-blue-500/20 hover:text-blue-400"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </button>

      <button
        onClick={() => handleShare("facebook")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-blue-600/20 hover:text-blue-500"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </button>

      <button
        onClick={() => handleShare("linkedin")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-blue-700/20 hover:text-blue-600"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>

      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-purple-500/20 hover:text-purple-400"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
