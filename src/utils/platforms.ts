import facebookIcon from "../assets/platforms/facebook.png";
import snapchatIcon from "../assets/platforms/snapchat.png";
import tiktokIcon from "../assets/platforms/tiktok.png";
import instagramIcon from "../assets/platforms/instagram.png";
import youtubeIcon from "../assets/platforms/youtube.png";
import telegramIcon from "../assets/platforms/telegram.png";
import discordIcon from "../assets/platforms/discord.png";
import redditIcon from "../assets/platforms/reddit.png";
import linkedinIcon from "../assets/platforms/linkedin.png";
import pinterestIcon from "../assets/platforms/pinterest.png";
import xIcon from "../assets/platforms/x.png";
import chromeIcon from "../assets/platforms/chrome.png";
import edgeIcon from "../assets/platforms/edge.png";
import safariIcon from "../assets/platforms/safari.png";
import { Biqpod } from "@biqpod/app/ui/types";

export interface PlatformInfo {
  id: keyof Required<Required<Biqpod.Snapbuy.Store>["platforms"]>;
  name: string;
  icon: string;
  placeholder: string;
  color: string;
}

export const platformsInfo: PlatformInfo[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: facebookIcon,
    placeholder: "https://facebook.com/yourpage",
    color: "#1877F2",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: snapchatIcon,
    placeholder: "https://snapchat.com/add/username",
    color: "#FFFC00",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: tiktokIcon,
    placeholder: "https://tiktok.com/@username",
    color: "#000000",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: instagramIcon,
    placeholder: "https://instagram.com/username",
    color: "#E4405F",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: youtubeIcon,
    placeholder: "https://youtube.com/c/channelname",
    color: "#FF0000",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: telegramIcon,
    placeholder: "https://t.me/username",
    color: "#0088CC",
  },
  {
    id: "discord",
    name: "Discord",
    icon: discordIcon,
    placeholder: "https://discord.gg/invite",
    color: "#5865F2",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: redditIcon,
    placeholder: "https://reddit.com/r/subreddit",
    color: "#FF4500",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: linkedinIcon,
    placeholder: "https://linkedin.com/company/companyname",
    color: "#0A66C2",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: pinterestIcon,
    placeholder: "https://pinterest.com/username",
    color: "#BD081C",
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: xIcon,
    placeholder: "https://x.com/username",
    color: "#000000",
  },
  {
    id: "chrome",
    name: "Chrome",
    icon: chromeIcon,
    placeholder: "https://chrome.google.com/webstore/detail/extension-id",
    color: "#4285F4",
  },
  {
    id: "edge",
    name: "Edge",
    icon: edgeIcon,
    placeholder:
      "https://microsoftedge.microsoft.com/addons/detail/extension-id",
    color: "#0078D4",
  },
  {
    id: "safari",
    name: "Safari",
    icon: safariIcon,
    placeholder: "https://apps.apple.com/app/app-name/id",
    color: "#006CFF",
  },
];

export const getPlatformInfo = (
  platformId: keyof Required<Required<Biqpod.Snapbuy.Store>["platforms"]>
): PlatformInfo | undefined => {
  return platformsInfo.find((platform) => platform.id === platformId);
};

export const platformsPhoto: Record<
  keyof Required<Required<Biqpod.Snapbuy.Store>["platforms"]>,
  string
> = {
  facebook: facebookIcon,
  snapchat: snapchatIcon,
  tiktok: tiktokIcon,
  instagram: instagramIcon,
  youtube: youtubeIcon,
  telegram: telegramIcon,
  discord: discordIcon,
  reddit: redditIcon,
  linkedin: linkedinIcon,
  pinterest: pinterestIcon,
  x: xIcon,
  chrome: chromeIcon,
  edge: edgeIcon,
  safari: safariIcon,
};
