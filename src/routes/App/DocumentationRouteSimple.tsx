import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Translate,
  Button,
  Scroll,
  CircleTip,
  EmptyComponent,
  Field,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
import { AnimatedPage } from "../../animations/components";
import { getFieldValue, setFieldValue } from "@biqpod/app/ui/hooks";

// Simple documentation data structure
const features = [
  {
    id: "stores",
    name: "Store Management",
    description:
      "Create and manage multiple online stores with customizable templates",
    category: "core",
    route: "/store",
    tips: [
      "Use templates to quickly set up your store design and save time",
      "Configure multiple payment methods to accommodate different customer preferences",
      "Set up custom domains for professional branding and better SEO",
      "Enable multi-language support to reach global customers",
    ],
  },
  {
    id: "products",
    name: "Product Catalog",
    description:
      "Comprehensive product management with collections and variants",
    category: "core",
    tips: [
      "Use high-quality images and detailed descriptions",
      "Organize products into collections for better navigation",
      "Set up product variants (size, color, etc.)",
      "Use SEO-friendly URLs and meta descriptions",
    ],
  },
  {
    id: "ai-agent",
    name: "AI Shopping Assistant",
    description:
      "Smart AI agent for customer support and product recommendations",
    category: "ai",
    route: "/agent",
    isNew: true,
    tips: [
      "Train the AI with your product knowledge base",
      "Use voice commands for hands-free operation",
      "Enable multilingual support for global customers",
      "Set up automated responses for common questions",
    ],
  },
  {
    id: "delivery",
    name: "Delivery Management",
    description: "Comprehensive delivery and logistics system",
    category: "delivery",
    route: "/deliveries",
    tips: [
      "Set up delivery zones and pricing",
      "Integrate with delivery partners",
      "Provide real-time tracking for customers",
      "Configure delivery time slots",
    ],
  },
  {
    id: "client-portal",
    name: "Customer Portal",
    description: "Self-service portal for customers to manage orders",
    category: "customer",
    route: "/client",
    tips: [
      "Enable order history and reordering",
      "Allow address book management",
      "Set up wishlist and favorites",
      "Provide order cancellation options",
    ],
  },
  {
    id: "developer",
    name: "Developer Tools",
    description: "API access and developer integrations",
    category: "integration",
    route: "/developer",
    isPro: true,
    tips: [
      "Use webhooks for real-time updates",
      "Document your API endpoints",
      "Set up proper authentication",
      "Monitor API usage and performance",
    ],
  },
];

const categories = [
  { id: "core", name: "Core Features" },
  { id: "ai", name: "AI & Smart Features" },
  { id: "delivery", name: "Delivery & Logistics" },
  { id: "customer", name: "Customer Experience" },
  { id: "integration", name: "Integrations" },
];

const FeatureCard = ({
  feature,
  onSelect,
}: {
  feature: any;
  onSelect: (f: any) => void;
}) => (
  <Card className="hover:shadow-lg p-4 h-full transition-shadow cursor-pointer">
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-sm">
          <Translate content={feature.name} />
        </h3>
        {feature.isNew && (
          <span className="bg-[--biqpod-primary] px-2 py-0.5 rounded-full text-[--biqpod-primary-content] text-xs">
            <Translate content="new" />
          </span>
        )}
        {feature.isPro && (
          <span className="bg-[--biqpod-primary] px-2 py-0.5 rounded-full text-[--biqpod-primary-content] text-xs">
            <Translate content="pro" />
          </span>
        )}
      </div>
      <p className="flex-1 mb-3 text-[--biqpod-text-secondary] text-xs">
        <Translate content={feature.description} />
      </p>
      <div className="flex justify-between items-center">
        <span className="text-[--biqpod-text-secondary] text-xs">
          {feature.tips.length} tips
        </span>
        <Button className="px-3 py-1 text-xs" onClick={() => onSelect(feature)}>
          <Translate content="view tips" />
        </Button>
      </div>
    </div>
  </Card>
);

const FeatureDetails = ({
  feature,
  onClose,
}: {
  feature: any;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="overflow-hidden">
        <div className="p-6 border-[--biqpod-borders] border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-bold text-2xl">
                  <Translate content={feature.name} />
                </h2>
                {feature.isNew && (
                  <span className="bg-[--biqpod-primary] px-3 py-1 rounded-full text-[--biqpod-primary-content] text-sm">
                    <Translate content="new" />
                  </span>
                )}
                {feature.isPro && (
                  <span className="bg-[--biqpod-primary] px-3 py-1 rounded-full text-[--biqpod-primary-content] text-sm">
                    <Translate content="pro" />
                  </span>
                )}
              </div>
              <p className="text-[--biqpod-text-secondary]">
                <Translate content={feature.description} />
              </p>
            </div>
            <CircleTip icon={allIcons.solid.faTimes} onClick={onClose} />
          </div>
        </div>

        <Scroll className="max-h-[60vh]">
          <div className="p-6">
            <h3 className="mb-4 font-semibold text-lg">
              <Translate content="tips & best practices" />
            </h3>

            <div className="space-y-3">
              {feature.tips.map((tip: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-[--biqpod-gray-opacity] p-3 rounded-lg"
                >
                  <div className="flex flex-shrink-0 justify-center items-center bg-[--biqpod-primary] rounded-full w-6 h-6 font-semibold text-[--biqpod-primary-content] text-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed">
                    <Translate content={tip} />
                  </p>
                </div>
              ))}
            </div>

            {feature.route && (
              <div className="bg-[--biqpod-gray-opacity] mt-6 p-4 border border-[--biqpod-borders] rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="mb-1 font-semibold text-[--biqpod-text-color]">
                      <Translate content="explore this feature" />
                    </h4>
                    <p className="text-[--biqpod-text-secondary] text-sm">
                      <Translate content="visit the dedicated page to use this feature" />
                    </p>
                  </div>
                  <Button
                    className="bg-[--biqpod-primary] hover:bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                    onClick={() => (window.location.href = feature.route)}
                  >
                    <Translate content="go to feature" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Scroll>
      </Card>
    </motion.div>
  </motion.div>
);

export const DocumentationRoute = () => {
  const searchQuery = getFieldValue("search-in-doc");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const filteredFeatures = useMemo(() => {
    let filtered = features;

    if (activeCategory) {
      filtered = filtered.filter(
        (feature) => feature.category === activeCategory
      );
    }

    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (feature) =>
          feature.name.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query) ||
          feature.tips.some((tip) => tip.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeCategory, searchQuery]);

  return (
    <AnimatedPage>
      <Scroll className="w-full h-full">
        <div className="mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-bold text-4xl">
              <Translate content="Biqpod.Snapbuy Documentation" />
            </h1>
            <p className="mx-auto max-w-3xl text-[--biqpod-text-secondary] text-lg">
              <Translate content="Discover all features, tips, and best practices to maximize your e-commerce success with Biqpod.Snapbuy" />
            </p>
          </div>

          {/* Stats */}
          <div className="gap-4 grid grid-cols-2 md:grid-cols-4 mb-8">
            <Card className="p-4 text-center">
              <div className="font-bold text-[--biqpod-primary] text-2xl">
                {features.length}
              </div>
              <div className="text-[--biqpod-text-secondary] text-sm">
                <Translate content="features" />
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-[--biqpod-primary] text-2xl">
                {features.reduce((acc, f) => acc + f.tips.length, 0)}
              </div>
              <div className="text-[--biqpod-text-secondary] text-sm">
                <Translate content="tips" />
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-[--biqpod-primary] text-2xl">
                {features.filter((f) => f.isNew).length}
              </div>
              <div className="text-[--biqpod-text-secondary] text-sm">
                <Translate content="new features" />
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-[--biqpod-primary] text-2xl">
                {categories.length}
              </div>
              <div className="text-[--biqpod-text-secondary] text-sm">
                <Translate content="categories" />
              </div>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="mx-auto max-w-md">
              <Field
                inputName="search-in-doc"
                placeholder="Search features, tips, and documentation..."
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              className={tw(
                "text-sm px-4 py-2 rounded-full transition-all",
                !activeCategory
                  ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                  : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
              )}
              onClick={() => setActiveCategory(null)}
            >
              <Translate content="all" />
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                className={tw(
                  "text-sm px-4 py-2 rounded-full transition-all",
                  activeCategory === category.id
                    ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                    : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                <Translate content={category.name} />
              </Button>
            ))}
          </div>

          {/* Features Grid */}
          {filteredFeatures.length > 0 ? (
            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredFeatures.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  onSelect={setSelectedFeature}
                />
              ))}
            </div>
          ) : (
            <EmptyComponent>
              <Card className="p-8 text-center">
                <h3 className="mb-2 font-semibold text-lg">
                  <Translate content="no features found" />
                </h3>
                <p className="mb-4 text-[--biqpod-text-secondary]">
                  <Translate content="try adjusting your search or category filter" />
                </p>
                <Button
                  onClick={() => {
                    setActiveCategory(null);
                    setFieldValue("search-in-doc", "");
                  }}
                >
                  <Translate content="clear filters" />
                </Button>
              </Card>
            </EmptyComponent>
          )}
        </div>
      </Scroll>

      {/* Feature Details Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <FeatureDetails
            feature={selectedFeature}
            onClose={() => setSelectedFeature(null)}
          />
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
};
