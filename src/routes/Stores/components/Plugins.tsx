import { useEffect, useState } from "react";
import {
  Card,
  Line,
  Field,
  Scroll,
  EmptyComponent,
  Translate,
} from "@biqpod/app/ui/components";
import { getFieldValue } from "@biqpod/app/ui/hooks";
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  photo: string;
  author: string;
  category: string;
  rating: number;
  tags: string[];
}
const dummyPlugins: Plugin[] = [
  {
    id: "1",
    name: "Analytics Plugin",
    description: "Tracks user interactions and provides analytics data.",
    version: "1.0.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "BiqPod Team",
    category: "Analytics",
    rating: 4.5,
    tags: ["analytics", "tracking", "data"],
  },
  {
    id: "2",
    name: "Payment Gateway",
    description: "Integrates with popular payment providers.",
    version: "2.1.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Payment Experts",
    category: "Payment",
    rating: 4.8,
    tags: ["payment", "gateway", "integration"],
  },
  {
    id: "3",
    name: "SEO Optimizer",
    description: "Optimizes your store for search engines.",
    version: "1.5.2",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "SEO Masters",
    category: "SEO",
    rating: 4.2,
    tags: ["seo", "optimization", "search"],
  },
  {
    id: "4",
    name: "Inventory Manager",
    description: "Manages stock levels and inventory tracking.",
    version: "1.2.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Inventory Pros",
    category: "Inventory",
    rating: 4.0,
    tags: ["inventory", "stock", "management"],
  },
  {
    id: "5",
    name: "Customer Support Chat",
    description: "Provides real-time customer support via chat.",
    version: "1.3.1",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Support Team",
    category: "Support",
    rating: 4.6,
    tags: ["chat", "support", "customer"],
  },
  {
    id: "6",
    name: "Email Marketing",
    description: "Sends automated marketing emails to customers.",
    version: "2.0.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Marketing Gurus",
    category: "Marketing",
    rating: 4.3,
    tags: ["email", "marketing", "automation"],
  },
  {
    id: "7",
    name: "Social Media Integration",
    description: "Integrates with social media platforms for sharing.",
    version: "1.1.5",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Social Experts",
    category: "Social",
    rating: 4.1,
    tags: ["social", "media", "integration"],
  },
  {
    id: "8",
    name: "Loyalty Program",
    description: "Manages customer loyalty points and rewards.",
    version: "1.4.2",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Loyalty Builders",
    category: "Loyalty",
    rating: 4.7,
    tags: ["loyalty", "rewards", "points"],
  },
  {
    id: "9",
    name: "Shipping Calculator",
    description: "Calculates shipping costs based on location.",
    version: "1.0.8",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Shipping Solutions",
    category: "Shipping",
    rating: 3.9,
    tags: ["shipping", "calculator", "costs"],
  },
  {
    id: "10",
    name: "Review System",
    description: "Allows customers to leave reviews and ratings.",
    version: "2.2.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Review Masters",
    category: "Reviews",
    rating: 4.4,
    tags: ["reviews", "ratings", "feedback"],
  },
  {
    id: "11",
    name: "Discount Manager",
    description: "Creates and manages discount codes and offers.",
    version: "1.5.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Discount Pros",
    category: "Discounts",
    rating: 4.5,
    tags: ["discount", "codes", "offers"],
  },
  {
    id: "12",
    name: "Multi-Language Support",
    description: "Supports multiple languages for the store.",
    version: "1.2.3",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Language Experts",
    category: "Localization",
    rating: 4.0,
    tags: ["language", "multi", "support"],
  },
  {
    id: "13",
    name: "Order Tracking",
    description: "Tracks orders from placement to delivery.",
    version: "1.3.7",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Tracking Team",
    category: "Orders",
    rating: 4.6,
    tags: ["order", "tracking", "delivery"],
  },
  {
    id: "14",
    name: "Abandoned Cart Recovery",
    description: "Recovers abandoned shopping carts via email.",
    version: "1.1.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Recovery Experts",
    category: "Recovery",
    rating: 4.2,
    tags: ["cart", "recovery", "email"],
  },
  {
    id: "15",
    name: "Product Recommendations",
    description: "Suggests products based on user behavior.",
    version: "2.0.5",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Recommendation AI",
    category: "Recommendations",
    rating: 4.8,
    tags: ["recommendations", "products", "ai"],
  },
  {
    id: "16",
    name: "Tax Calculator",
    description: "Calculates taxes based on location and rules.",
    version: "1.4.1",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Tax Advisors",
    category: "Taxes",
    rating: 3.8,
    tags: ["tax", "calculator", "location"],
  },
  {
    id: "17",
    name: "Backup and Restore",
    description: "Backs up and restores store data.",
    version: "1.0.9",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Data Guardians",
    category: "Backup",
    rating: 4.3,
    tags: ["backup", "restore", "data"],
  },
  {
    id: "18",
    name: "Custom Branding",
    description: "Allows customization of store branding.",
    version: "1.6.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Branding Pros",
    category: "Branding",
    rating: 4.1,
    tags: ["branding", "custom", "design"],
  },
  {
    id: "19",
    name: "API Integration",
    description: "Integrates with third-party APIs.",
    version: "2.1.2",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "API Wizards",
    category: "Integration",
    rating: 4.7,
    tags: ["api", "integration", "third-party"],
  },
  {
    id: "20",
    name: "Security Enhancer",
    description: "Enhances store security features.",
    version: "1.7.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Security Experts",
    category: "Security",
    rating: 4.9,
    tags: ["security", "enhancer", "protection"],
  },
  {
    id: "21",
    name: "Mobile Optimization",
    description: "Optimizes the store for mobile devices.",
    version: "1.8.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Search_engine_optimization.svg/200px-Search_engine_optimization.svg.png",
    author: "Mobile Masters",
    category: "Mobile",
    rating: 4.4,
    tags: ["mobile", "optimization", "responsive"],
  },
  {
    id: "22",
    name: "Data Export",
    description: "Exports store data to various formats.",
    version: "1.9.0",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bar_chart.svg/200px-Bar_chart.svg.png",
    author: "Data Exporters",
    category: "Data",
    rating: 4.0,
    tags: ["export", "data", "formats"],
  },
  {
    id: "23",
    name: "Notification System",
    description: "Sends notifications to customers and admins.",
    version: "2.0.1",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Credit_card.svg/200px-Credit_card.svg.png",
    author: "Notification Pros",
    category: "Notifications",
    rating: 4.5,
    tags: ["notifications", "alerts", "communication"],
  },
];
export const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchTerm = getFieldValue("search-plugins") || "";
  useEffect(() => {
    const fetchPlugins = async () => {
      if (import.meta.env.DEV) {
        // Development mode: use dummy data
        setPlugins(dummyPlugins);
        setLoading(false);
      } else {
        // Production mode: fetch from API
        try {
          const response = await fetch("https://extensions.biqpod.com/snapbuy");
          if (!response.ok) {
            throw new Error("Failed to fetch plugins");
          }
          const data: Plugin[] = await response.json();
          setPlugins(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPlugins();
  }, []);
  if (loading) {
    return <div>Loading plugins...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  const filteredPlugins = plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <EmptyComponent>
      <div className="p-2">
        <h2 className="text-2xl">
          <Translate content="plugins" />
        </h2>
      </div>
      <Line />
      <div className="p-2">
        <Field
          inputName="search-plugins"
          className="rounded-xl"
          placeholder="Search plugins..."
        />
      </div>
      <Line />
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {filteredPlugins.map((plugin) => (
            <Card className="mb-4 p-4" key={plugin.id}>
              <div className="flex items-center gap-4">
                <img
                  src={plugin.photo}
                  alt={plugin.name}
                  className="rounded-lg w-16 h-16 object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{plugin.name}</h3>
                  <p className="text-[--biqpod-gray-opacity-2]">
                    {plugin.description}
                  </p>
                  <small className="text-[--biqpod-gray-opacity-2]">
                    Version: {plugin.version}
                  </small>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Scroll>
    </EmptyComponent>
  );
};
