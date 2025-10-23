import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Translate,
  Button,
  Scroll,
  CircleTip,
  EmptyComponent,
  Icon,
  Field,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
import { AnimatedPage } from "../../animations/components";
import { getFieldValue, setFieldValue } from "@biqpod/app/ui/hooks";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
};
const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};
interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  tips: string[];
  route?: string;
  isNew?: boolean;
  isPro?: boolean;
}
interface Task {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  prerequisites?: string[];
  relatedFeatures?: string[];
}
interface Category {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}
const categories: Category[] = [
  {
    id: "core",
    name: "Core Features",
    description: "Essential e-commerce functionality",
    icon: allIcons.solid.faStore,
    color: "text-[--biqpod-primary]",
  },
  {
    id: "ai",
    name: "AI & Smart Features",
    description: "AI-powered tools and automation",
    icon: allIcons.solid.faRobot,
    color: "text-[--biqpod-primary]",
  },
  {
    id: "delivery",
    name: "Delivery & Logistics",
    description: "Order fulfillment and shipping",
    icon: allIcons.solid.faTruck,
    color: "text-[--biqpod-primary]",
  },
  {
    id: "management",
    name: "Store Management",
    description: "Business operations and analytics",
    icon: allIcons.solid.faChartLine,
    color: "text-[--biqpod-primary]",
  },
  {
    id: "customer",
    name: "Customer Experience",
    description: "Client-facing features and support",
    icon: allIcons.solid.faUsers,
    color: "text-[--biqpod-primary]",
  },
  {
    id: "integration",
    name: "Integrations",
    description: "Third-party services and APIs",
    icon: allIcons.solid.faPlug,
    color: "text-[--biqpod-primary]",
  },
];
const features: Feature[] = [
  // Core Features
  {
    id: "stores",
    name: "Store Management",
    description:
      "Create and manage multiple online stores with customizable settings",
    icon: allIcons.solid.faStore,
    category: "core",
    route: "/store",
    tips: [
      "Access store configuration through the Store Settings tab",
      "Use the store overview dashboard to monitor sales, orders, and customers",
      "Configure store details like name, address, phone, and photo",
      "Set up store pixels for tracking (Facebook, Google, etc.)",
      "Enable store templates for consistent branding",
      "Use the copy store link feature to share your store easily",
    ],
  },
  {
    id: "products",
    name: "Product Management",
    description:
      "Comprehensive product creation and management with photo uploads",
    icon: allIcons.solid.faBox,
    category: "core",
    tips: [
      "Use the Products tab in store management to add and edit products",
      "Upload multiple high-quality photos for each product",
      "Set proper pricing, quantity, and availability status",
      "Use product descriptions to provide detailed information",
      "Organize products with the search and filter functionality",
      "Bulk manage products using the Excel import feature",
    ],
  },
  {
    id: "orders",
    name: "Order Processing",
    description: "Complete order management and fulfillment tracking",
    icon: allIcons.solid.faShoppingCart,
    category: "core",
    tips: [
      "Monitor orders through the Orders tab in store management",
      "Track order status from pending to completed",
      "Use order filters to find specific orders quickly",
      "Access detailed order information including products and customer data",
      "Export order data for accounting and reporting",
      "Set up delivery assignments for order fulfillment",
    ],
  },
  {
    id: "coupons",
    name: "Coupon System",
    description: "Create and manage discount codes and promotional offers",
    icon: allIcons.solid.faTicket,
    category: "core",
    tips: [
      "Access coupon management through the Coupons tab",
      "Set start and end dates for time-limited promotions",
      "Configure minimum order amounts for coupon eligibility",
      "Track coupon usage and remaining limits",
      "Create both percentage and fixed amount discounts",
      "Use descriptive coupon codes that customers can remember",
    ],
  },
  // AI & Smart Features
  {
    id: "ai-agent",
    name: "AI Shopping Assistant",
    description:
      "Interactive AI assistant for customer support and automated actions",
    icon: allIcons.solid.faRobot,
    category: "ai",
    route: "/agent",
    isNew: true,
    tips: [
      "Access the AI agent through the Agent route in the main navigation",
      "Use natural language commands to interact with the AI",
      "The AI can interpret commands and suggest actions",
      "Upload files and attachments to provide context to the AI",
      "Switch between different AI models (GPT-3.5, GPT-4, etc.)",
      "Use the AI for generating product descriptions automatically",
    ],
  },
  {
    id: "ai-actions",
    name: "AI Action Commands",
    description: "Automated actions and command interpretation system",
    icon: allIcons.solid.faMagic,
    category: "ai",
    isNew: true,
    tips: [
      "View available AI actions through the Offers page",
      "Use command interpretation to execute complex tasks",
      "AI can generate product descriptions based on product data",
      "Commands are processed using natural language understanding",
      "Actions are cached for better performance",
      "Use AI actions to automate repetitive tasks",
    ],
  },
  {
    id: "smart-templates",
    name: "Smart Templates",
    description: "AI-powered template generation and customization",
    icon: allIcons.solid.faPaintBrush,
    category: "ai",
    isNew: true,
    tips: [
      "Create custom templates through the Developer route",
      "Templates can be submitted for review and approval",
      "Use template photos and descriptions for better presentation",
      "Templates support custom URLs and metadata",
      "Track template creation and modification dates",
      "Share templates across different stores",
    ],
  },
  // Delivery & Logistics
  {
    id: "delivery",
    name: "Delivery Management",
    description:
      "Comprehensive delivery system with zone and pricing management",
    icon: allIcons.solid.faTruck,
    category: "delivery",
    route: "/deliveries",
    tips: [
      "Access delivery management through the Deliveries route",
      "Create delivery zones using the Zones feature",
      "Link zones together with custom pricing",
      "Manage delivery accounts for different roles",
      "Track delivery statistics and performance metrics",
      "Assign delivery agents to specific orders",
    ],
  },
  {
    id: "tracking",
    name: "Order Tracking",
    description: "Real-time tracking system for orders and deliveries",
    icon: allIcons.solid.faMapMarkerAlt,
    category: "delivery",
    route: "/tracking",
    tips: [
      "Monitor today's deliveries through the tracking interface",
      "View delivery overview with key metrics",
      "Track delivery sales and performance data",
      "Use delivery filters to find specific orders",
      "Assign orders to delivery agents",
      "Monitor delivery completion rates",
    ],
  },
  {
    id: "delivery-pricing",
    name: "Delivery Pricing",
    description: "Flexible pricing system for delivery options and zones",
    icon: allIcons.solid.faCalculator,
    category: "delivery",
    tips: [
      "Set up delivery options through store configuration",
      "Create zone-based pricing with custom rates",
      "Configure delivery prices for different distances",
      "Use the delivery pricing component for dynamic rates",
      "Link delivery zones for complex routing",
      "Track pricing effectiveness through analytics",
    ],
  },
  // Store Management
  {
    id: "analytics",
    name: "Store Analytics",
    description:
      "Comprehensive dashboard with sales, orders, and customer insights",
    icon: allIcons.solid.faChartLine,
    category: "management",
    tips: [
      "View store overview with total sales, orders, and customers",
      "Monitor today's order count with real-time updates",
      "Analyze weekly sales trends using the line chart",
      "Click on metrics to drill down into specific data",
      "Track performance over time with historical data",
      "Use analytics to identify peak sales periods",
    ],
  },
  {
    id: "collections",
    name: "Product Collections",
    description: "Organize products into curated collections and categories",
    icon: allIcons.solid.faLayerGroup,
    category: "management",
    tips: [
      "Access collections through the Collections tab",
      "Group related products for better organization",
      "Add product photos and descriptions to collections",
      "Use collections to create themed product groups",
      "Link collections to specific stores",
      "Manage collection visibility and availability",
    ],
  },
  {
    id: "brands",
    name: "Brand Management",
    description: "Create and manage product brands with logos and information",
    icon: allIcons.solid.faTags,
    category: "management",
    tips: [
      "Create brands through the Brands tab in store management",
      "Upload brand logos and set descriptions",
      "Associate products with specific brands",
      "Track brand performance across your store",
      "Use brands for better product categorization",
      "Manage brand information and metadata",
    ],
  },
  {
    id: "variables",
    name: "Custom Variables",
    description: "Define custom variables for dynamic store content",
    icon: allIcons.solid.faCode,
    category: "management",
    tips: [
      "Create custom variables through the Vars management system",
      "Use variables for dynamic content across your store",
      "Set variable values specific to each store",
      "Reference variables in templates and forms",
      "Track variable usage and performance",
      "Update variables without code changes",
    ],
  },
  // Customer Experience
  {
    id: "client-portal",
    name: "Customer Portal",
    description:
      "Self-service portal for customers to browse stores and products",
    icon: allIcons.solid.faUser,
    category: "customer",
    route: "/client",
    tips: [
      "Customers can browse stores through the /client/stores route",
      "View specific store products via /client/stores/:storeId/products",
      "Shopping cart functionality is built-in with local storage",
      "Customers can explore different stores and products",
      "Store routing handles both owned and public store access",
      "Client interface supports mobile and desktop viewing",
    ],
  },
  {
    id: "customers",
    name: "Customer Management",
    description: "Manage customer data and track customer interactions",
    icon: allIcons.solid.faUsers,
    category: "customer",
    tips: [
      "Access customer management through the Customers tab",
      "Track customer orders and purchase history",
      "Manage customer status (pending, accepted, rejected)",
      "Store customer contact information and preferences",
      "Link customers to specific stores",
      "Export customer data for marketing campaigns",
    ],
  },
  {
    id: "notifications",
    name: "Notification Settings",
    description: "Configure store notification preferences and settings",
    icon: allIcons.solid.faBell,
    category: "customer",
    tips: [
      "Set up notification preferences through store configuration",
      "Configure notification settings for different events",
      "Use the notification settings component for customization",
      "Set up order confirmation and status notifications",
      "Configure delivery and shipping notifications",
      "Test notification settings with example notifications",
    ],
  },
  {
    id: "support",
    name: "Customer Support",
    description:
      "Integrated feedback and support system with social media links",
    icon: allIcons.solid.faHeadset,
    category: "customer",
    route: "/feedbacks",
    tips: [
      "Access support through the Feedbacks route",
      "Multiple social media integration (Facebook, Twitter, Instagram)",
      "Direct links to support channels like Discord and Snapchat",
      "Animated feedback interface for better user experience",
      "TikTok integration for social media support",
      "Professional support page with contact options",
    ],
  },
  // Integrations
  {
    id: "forms",
    name: "Form Builder",
    description: "Create custom forms for products and orders",
    icon: allIcons.solid.faEdit,
    category: "integration",
    tips: [
      "Access form builder through the Forms section",
      "Create product forms to collect product information",
      "Set up order forms for custom order details",
      "Use form collections to organize different form types",
      "Configure form fields and validation rules",
      "Link forms to specific store workflows",
    ],
  },
  {
    id: "invoices",
    name: "Invoice Management",
    description: "Generate and manage customer invoices",
    icon: allIcons.solid.faFileInvoice,
    category: "integration",
    tips: [
      "Create invoices through the Invoices tab",
      "Link invoices to specific orders and customers",
      "Set invoice status (draft, sent, paid, overdue, cancelled)",
      "Configure tax and discount calculations",
      "Track invoice due dates and payment status",
      "Export invoice data for accounting systems",
    ],
  },
  {
    id: "api-tokens",
    name: "API Access Tokens",
    description: "Generate and manage API tokens for store integration",
    icon: allIcons.solid.faKey,
    category: "integration",
    isPro: true,
    tips: [
      "Generate store-specific API tokens for secure access",
      "View partial token information for security",
      "Use API tokens for third-party integrations",
      "Manage token permissions and access levels",
      "Monitor API usage and token activity",
      "Regenerate tokens when needed for security",
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive Integration",
    description: "Sync photos and data with Google Drive",
    icon: allIcons.brands.faGoogleDrive,
    category: "integration",
    tips: [
      "Link your account with Google Drive for photo storage",
      "Sync product photos directly from Drive",
      "Use Drive integration for data backup",
      "Access Drive photos through the photo management system",
      "Bulk import photos from Google Drive folders",
      "Maintain photo organization between platforms",
    ],
  },
];
const tasks: Task[] = [
  // Getting Started Tasks
  {
    id: "create-store",
    title: "Create Your First Store",
    description:
      "Set up your online store using the Snapbuy store management system",
    icon: allIcons.solid.faStore,
    category: "getting-started",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    steps: [
      {
        title: "Navigate to Store Management",
        description:
          "Go to the main profile page and click on the 'Store' service card",
        tip: "The store management system is accessed through the main navigation",
      },
      {
        title: "Add New Store",
        description: "Click the 'Add Store' button to create a new store entry",
        tip: "Each store has a unique ID that cannot be changed after creation",
      },
      {
        title: "Fill Store Details",
        description:
          "Enter store name, address, phone number, and upload a store photo",
        tip: "Store photos help customers identify your business and build trust",
      },
      {
        title: "Configure Store Settings",
        description:
          "Access the store configuration through the Store Settings tab",
        tip: "You can set up notification preferences and other store-specific settings",
      },
      {
        title: "Set Up Store Template",
        description: "Choose from available templates or create a custom one",
        tip: "Templates can be managed through the Developer section",
      },
      {
        title: "Configure Pixels and Tracking",
        description: "Set up Facebook, Google, and other tracking pixels",
        tip: "Tracking pixels help you monitor store performance and customer behavior",
      },
    ],
    relatedFeatures: ["stores", "smart-templates"],
  },
  {
    id: "add-first-product",
    title: "Add Your First Product",
    description:
      "Create your first product using the Snapbuy product management system",
    icon: allIcons.solid.faBox,
    category: "getting-started",
    difficulty: "beginner",
    estimatedTime: "8 minutes",
    steps: [
      {
        title: "Access Products Management",
        description: "Go to your store and navigate to the Products tab",
        tip: "The Products tab is in the store management interface alongside Orders and other features",
      },
      {
        title: "Create New Product",
        description: "Use the product creation interface to add a new product",
        tip: "You can create products with single or multiple variants",
      },
      {
        title: "Enter Product Information",
        description: "Fill in product name, description, and basic details",
        tip: "Use descriptive names that customers can easily search for",
      },
      {
        title: "Set Product Pricing",
        description: "Configure the product price and availability settings",
        tip: "Mark products as available or unavailable to control visibility",
      },
      {
        title: "Upload Product Photos",
        description: "Add multiple high-quality product images",
        tip: "You can upload photos from your device or sync from Google Drive",
      },
      {
        title: "Configure Inventory",
        description: "Set quantity limits and stock management preferences",
        tip: "Enable limited quantity tracking for better inventory control",
      },
      {
        title: "Save and Publish",
        description: "Save your product and make it available in your store",
        tip: "Products can be edited later through the Products management interface",
      },
    ],
    relatedFeatures: ["products", "google-drive"],
  },
  {
    id: "manage-orders",
    title: "Manage Customer Orders",
    description:
      "Process and track customer orders through the order management system",
    icon: allIcons.solid.faShoppingCart,
    category: "getting-started",
    difficulty: "beginner",
    estimatedTime: "12 minutes",
    steps: [
      {
        title: "Access Order Management",
        description: "Navigate to the Orders tab in your store management",
        tip: "Orders are organized alongside Customers and Invoices in the same interface",
      },
      {
        title: "View Order Details",
        description:
          "Click on orders to view detailed information including products and customer data",
        tip: "Order details include product information, quantities, and customer contact details",
      },
      {
        title: "Update Order Status",
        description:
          "Change order status from pending to processing to completed",
        tip: "Order status helps you track fulfillment progress and customer expectations",
      },
      {
        title: "Assign Delivery Agents",
        description:
          "Use the delivery system to assign orders to delivery agents",
        tip: "Delivery assignment can be done through the delivery management interface",
      },
      {
        title: "Track Order Progress",
        description: "Monitor order fulfillment through the tracking system",
        tip: "Use the tracking interface to see real-time delivery status",
      },
      {
        title: "Generate Invoices",
        description:
          "Create invoices for completed orders through the invoice system",
        tip: "Invoices can include tax calculations and discount applications",
      },
    ],
    prerequisites: ["create-store", "add-first-product"],
    relatedFeatures: ["orders", "delivery", "invoices"],
  },
  {
    id: "setup-delivery-system",
    title: "Configure Delivery System",
    description:
      "Set up delivery zones, pricing, and agent management for order fulfillment",
    icon: allIcons.solid.faTruck,
    category: "getting-started",
    difficulty: "intermediate",
    estimatedTime: "18 minutes",
    steps: [
      {
        title: "Access Delivery Management",
        description: "Navigate to the Deliveries section from the main menu",
        tip: "The delivery system includes overview, pricing, and settings sections",
      },
      {
        title: "Create Delivery Zones",
        description: "Set up geographic zones for your delivery coverage area",
        tip: "Zones help you organize delivery pricing by geographic regions",
      },
      {
        title: "Link Delivery Zones",
        description:
          "Connect zones together with custom pricing for inter-zone delivery",
        tip: "Zone linking allows for complex delivery routing and pricing structures",
      },
      {
        title: "Set Up Delivery Accounts",
        description:
          "Create delivery agent accounts with different roles and permissions",
        tip: "Different roles like delivery_agent help organize your delivery team",
      },
      {
        title: "Configure Delivery Pricing",
        description: "Set pricing for different zones and delivery options",
        tip: "Use the delivery pricing component to create dynamic pricing rules",
      },
      {
        title: "Test Delivery Assignment",
        description:
          "Practice assigning orders to delivery agents and tracking progress",
        tip: "Monitor delivery performance through the analytics dashboard",
      },
    ],
    prerequisites: ["create-store"],
    relatedFeatures: ["delivery", "tracking", "delivery-pricing"],
  },
  {
    id: "generate-api-token",
    title: "Generate Store API Token",
    description:
      "Create secure API tokens for store integration and automation",
    icon: allIcons.solid.faKey,
    category: "advanced",
    difficulty: "advanced",
    estimatedTime: "5 minutes",
    steps: [
      {
        title: "Access Store Integration",
        description: "Navigate to your store's integration settings",
        tip: "API token generation is available for store owners and authorized users",
      },
      {
        title: "Generate API Token",
        description:
          "Use the generateStoreApiToken API function to create a token",
        tip: "Each store can have its own unique API token for security",
      },
      {
        title: "View Token Information",
        description: "Use getPartOfToken to view partial token information",
        tip: "Only partial token information is shown for security purposes",
      },
      {
        title: "Configure Token Permissions",
        description: "Set up appropriate access levels for the API token",
        tip: "Tokens inherit permissions from the user who creates them",
      },
      {
        title: "Test API Access",
        description:
          "Test the token with basic API calls to verify functionality",
        tip: "Use the token in HTTP headers for authentication",
      },
      {
        title: "Secure Token Storage",
        description: "Store the token securely in your application",
        tip: "Never expose API tokens in client-side code or public repositories",
      },
    ],
    prerequisites: ["create-store"],
    relatedFeatures: ["api-tokens"],
  },
  {
    id: "use-ai-assistant",
    title: "Use the AI Shopping Assistant",
    description:
      "Interact with the AI agent for automated tasks and product assistance",
    icon: allIcons.solid.faRobot,
    category: "ai-setup",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    steps: [
      {
        title: "Access AI Agent",
        description: "Navigate to the Agent section from the main menu",
        tip: "The AI agent interface supports both text input and file attachments",
      },
      {
        title: "Choose AI Model",
        description: "Select from available AI models (GPT-3.5, GPT-4, etc.)",
        tip: "Different models have different capabilities and response styles",
      },
      {
        title: "Start Conversation",
        description: "Type your question or request in natural language",
        tip: "The AI can understand complex commands and business questions",
      },
      {
        title: "Upload Context Files",
        description: "Attach files to provide additional context for the AI",
        tip: "File attachments help the AI understand specific business needs",
      },
      {
        title: "Use Command Interpretation",
        description: "Ask the AI to interpret and execute business commands",
        tip: "The AI can suggest actions and help automate repetitive tasks",
      },
      {
        title: "Generate Product Descriptions",
        description: "Use AI to automatically create product descriptions",
        tip: "AI-generated descriptions can save time and improve consistency",
      },
      {
        title: "Explore AI Actions",
        description: "Visit the Offers page to see available AI actions",
        tip: "AI actions provide pre-built functionality for common business tasks",
      },
    ],
    relatedFeatures: ["ai-agent", "ai-actions"],
  },
  {
    id: "organize-products-collections",
    title: "Organize Products with Collections",
    description:
      "Create product collections and manage brands for better organization",
    icon: allIcons.solid.faLayerGroup,
    category: "product-management",
    difficulty: "intermediate",
    estimatedTime: "15 minutes",
    steps: [
      {
        title: "Access Collections Management",
        description: "Navigate to the Collections tab in your store management",
        tip: "Collections help organize products into themed groups for better customer navigation",
      },
      {
        title: "Create New Collection",
        description:
          "Use the collection creation interface to add a new collection",
        tip: "Give collections descriptive names that clearly indicate their purpose",
      },
      {
        title: "Add Collection Details",
        description:
          "Set collection name, description, and upload a collection photo",
        tip: "Collection photos help customers quickly identify different product categories",
      },
      {
        title: "Assign Products to Collection",
        description: "Link existing products to the collection",
        tip: "Products can belong to multiple collections for flexible organization",
      },
      {
        title: "Manage Product Brands",
        description: "Create and assign brands through the Brands tab",
        tip: "Brands help customers find products from specific manufacturers or labels",
      },
      {
        title: "Monitor Collection Performance",
        description: "Track which collections are most popular with customers",
        tip: "Use collection analytics to optimize your product organization strategy",
      },
    ],
    prerequisites: ["create-store", "add-first-product"],
    relatedFeatures: ["collections", "brands", "products"],
  },
  {
    id: "monitor-store-analytics",
    title: "Monitor Store Performance",
    description:
      "Use the built-in analytics dashboard to track sales, orders, and customer metrics",
    icon: allIcons.solid.faChartLine,
    category: "analytics",
    difficulty: "beginner",
    estimatedTime: "10 minutes",
    steps: [
      {
        title: "Access Store Dashboard",
        description: "Navigate to your store and view the Dashboard tab",
        tip: "The dashboard provides a real-time overview of your store's performance",
      },
      {
        title: "Review Key Metrics",
        description: "Monitor total sales, order count, and customer numbers",
        tip: "Click on individual metrics to drill down into specific data",
      },
      {
        title: "Analyze Sales Trends",
        description:
          "Use the weekly sales chart to identify patterns and trends",
        tip: "Sales trends help you plan inventory and marketing campaigns",
      },
      {
        title: "Track Today's Orders",
        description: "Monitor daily order volume and processing status",
        tip: "Today's orders widget shows immediate business activity",
      },
      {
        title: "Set Up Performance Alerts",
        description: "Configure notifications for important business events",
        tip: "Alerts help you stay informed about critical business changes",
      },
      {
        title: "Export Analytics Data",
        description: "Use analytics data for external reporting and analysis",
        tip: "Regular data exports help with business planning and tax reporting",
      },
    ],
    prerequisites: ["create-store", "add-first-product"],
    relatedFeatures: ["analytics", "notifications"],
  },
];
const TaskCard = memo(
  ({ task, onSelect }: { task: Task; onSelect: (task: Task) => void }) => {
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case "beginner":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        case "intermediate":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        case "advanced":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        default:
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      }
    };
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="relative"
      >
        <Card className="relative h-full overflow-hidden cursor-pointer">
          <div className="flex flex-col p-4 h-full">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-[--biqpod-gray-opacity] p-2 rounded-lg">
                <div className="text-[--biqpod-primary] text-lg">
                  <Icon icon={task.icon} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    <Translate content={task.title} />
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(
                      task.difficulty
                    )}`}
                  >
                    <Translate content={task.difficulty} />
                  </span>
                </div>
                <p className="text-[--biqpod-text-secondary] text-xs line-clamp-2">
                  <Translate content={task.description} />
                </p>
              </div>
            </div>
            {/* Task info */}
            <div className="flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 text-[--biqpod-text-secondary] text-xs">
                <Icon icon={allIcons.solid.faClock} />
                <span>{task.estimatedTime}</span>
              </div>
              <Button
                className="px-3 py-1 w-fit text-xs"
                onClick={() => onSelect(task)}
              >
                <Translate content="view guide" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
);
const TaskDetails = memo(
  ({ task, onClose }: { task: Task; onClose: () => void }) => {
    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case "beginner":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        case "intermediate":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        case "advanced":
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
        default:
          return "text-[--biqpod-primary] bg-[--biqpod-gray-opacity]";
      }
    };
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          exit={{ y: 50 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="p-6 border-[--biqpod-borders] border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
                    <div className="text-[--biqpod-primary] text-2xl">
                      <Icon icon={task.icon} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="font-bold text-2xl">
                        <Translate content={task.title} />
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
                          task.difficulty
                        )}`}
                      >
                        <Translate content={task.difficulty} />
                      </span>
                    </div>
                    <p className="mb-2 text-[--biqpod-text-secondary]">
                      <Translate content={task.description} />
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-[--biqpod-text-secondary]">
                        <Icon icon={allIcons.solid.faClock} />
                        <span>
                          <Translate content="estimated time" />:{" "}
                          {task.estimatedTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[--biqpod-text-secondary]">
                        <Icon icon={allIcons.solid.faListOl} />
                        <span>
                          {task.steps.length} <Translate content="steps" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <CircleTip
                    icon={allIcons.solid.faTimes}
                    onClick={onClose}
                    className="text-[--biqpod-text-secondary]"
                  />
                </div>
              </div>
            </div>
            {/* Content */}
            <Scroll className="max-h-[60vh]">
              <div className="p-6">
                {/* Prerequisites */}
                {task.prerequisites && task.prerequisites.length > 0 && (
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 mb-3 font-semibold text-lg">
                      <div className="text-[--biqpod-primary]">
                        <Icon icon={allIcons.solid.faExclamationTriangle} />
                      </div>
                      <Translate content="prerequisites" />
                    </h3>
                    <div className="bg-[--biqpod-gray-opacity] p-3 border border-[--biqpod-borders] rounded-lg">
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {task.prerequisites.map((prereq, index) => (
                          <li
                            key={index}
                            className="text-[--biqpod-text-secondary]"
                          >
                            <Translate content={prereq} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {/* Steps */}
                <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
                  <div className="text-[--biqpod-primary]">
                    <Icon icon={allIcons.solid.faListOl} />
                  </div>
                  <Translate content="step-by-step guide" />
                </h3>
                <div className="space-y-4">
                  {task.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[--biqpod-gray-opacity] p-4 border border-[--biqpod-borders] rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-shrink-0 justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 font-semibold text-[--biqpod-primary-content] text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 font-semibold text-base">
                            <Translate content={step.title} />
                          </h4>
                          <p className="mb-2 text-sm leading-relaxed">
                            <Translate content={step.description} />
                          </p>
                          {step.tip && (
                            <div className="bg-[--biqpod-gray-opacity] mt-2 p-2 border border-[--biqpod-borders] rounded">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 text-[--biqpod-primary] text-xs">
                                  <Icon icon={allIcons.solid.faLightbulb} />
                                </div>
                                <p className="text-[--biqpod-text-secondary] text-xs">
                                  <Translate content={step.tip} />
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {/* Related Features */}
                {task.relatedFeatures && task.relatedFeatures.length > 0 && (
                  <div className="bg-[--biqpod-gray-opacity] mt-6 p-4 border border-[--biqpod-borders] rounded-lg">
                    <h4 className="mb-2 font-semibold text-[--biqpod-text-color]">
                      <Translate content="related features" />
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {task.relatedFeatures.map((featureId) => {
                        const feature = features.find(
                          (f) => f.id === featureId
                        );
                        return feature ? (
                          <Button
                            key={featureId}
                            className="bg-[--biqpod-primary] px-3 py-1 text-[--biqpod-primary-content] text-xs"
                            onClick={() => {
                              onClose();
                              // Could add logic to navigate to feature details
                            }}
                          >
                            <Translate content={feature.name} />
                          </Button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Scroll>
          </Card>
        </motion.div>
      </motion.div>
    );
  }
);
const FeatureCard = memo(
  ({
    feature,
    onSelect,
  }: {
    feature: Feature;
    onSelect: (feature: Feature) => void;
  }) => {
    const category = categories.find((cat) => cat.id === feature.category);
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        className="relative"
      >
        <Card className="relative h-full overflow-hidden cursor-pointer">
          <div className="flex flex-col p-4 h-full">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-[--biqpod-gray-opacity] p-2 rounded-lg">
                <div className="text-[--biqpod-primary] text-lg">
                  <Icon icon={feature.icon} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
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
                <p className="text-[--biqpod-text-secondary] text-xs line-clamp-2">
                  <Translate content={feature.description} />
                </p>
              </div>
            </div>
            {/* Tips count */}
            <div className="flex justify-between items-center mt-auto">
              <span className="text-[--biqpod-text-secondary] text-xs">
                {feature.tips.length} <Translate content="tips available" />
              </span>
              <Button
                className="px-3 py-1 w-fit text-xs"
                onClick={() => onSelect(feature)}
              >
                <Translate content="view tips" />
              </Button>
            </div>
          </div>
          {/* Category indicator */}
          <div
            className={tw(
              "absolute top-2 right-2 w-3 h-3 rounded-full",
              category?.color?.replace("text-", "bg-")
            )}
          />
        </Card>
      </motion.div>
    );
  }
);
const CategoryFilter = memo(
  ({
    categories,
    activeCategories,
    onCategorySelect,
  }: {
    categories: Category[];
    activeCategories: string[];
    onCategorySelect: (id: string) => void;
  }) => {
    return (
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          icon={allIcons.solid.faList}
          className={tw(
            "text-sm px-4 py-2 w-fit rounded-full transition-all",
            activeCategories.length === 0
              ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
              : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          )}
          onClick={() => onCategorySelect("")}
        >
          <Translate content="all" />
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            className={tw(
              "text-sm px-4 py-2 w-fit rounded-full transition-all flex items-center gap-2",
              activeCategories.includes(category.id)
                ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            )}
            onClick={() => onCategorySelect(category.id)}
          >
            <div className="text-xs">
              <Icon icon={category.icon} />
            </div>
            <Translate content={category.name} />
          </Button>
        ))}
      </div>
    );
  }
);
const FeatureDetails = memo(
  ({ feature, onClose }: { feature: Feature; onClose: () => void }) => {
    const category = categories.find((cat) => cat.id === feature.category);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          exit={{ y: 50 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="p-6 border-[--biqpod-borders] border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
                    <div className="text-[--biqpod-primary] text-2xl">
                      <Icon icon={feature.icon} />
                    </div>
                  </div>
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
                    <p className="mb-2 text-[--biqpod-text-secondary]">
                      <Translate content={feature.description} />
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="text-[--biqpod-primary] text-sm">
                        <Icon icon={category?.icon || allIcons.solid.faStore} />
                      </div>
                      <span className="text-[--biqpod-text-secondary]">
                        <Translate content={category?.name || ""} />
                      </span>
                    </div>
                  </div>
                </div>
                <CircleTip
                  icon={allIcons.solid.faTimes}
                  onClick={onClose}
                  className="text-[--biqpod-text-secondary]"
                />
              </div>
            </div>
            {/* Content */}
            <Scroll className="max-h-[60vh]">
              <div className="p-6">
                <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
                  <div className="text-[--biqpod-primary]">
                    <Icon icon={allIcons.solid.faLightbulb} />
                  </div>
                  <Translate content="tips & best practices" />
                </h3>
                <div className="space-y-3">
                  {feature.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 bg-[--biqpod-gray-opacity] p-3 rounded-lg"
                    >
                      <div className="flex flex-shrink-0 justify-center items-center bg-[--biqpod-primary] rounded-full w-6 h-6 font-semibold text-[--biqpod-primary-content] text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed">
                        <Translate content={tip} />
                      </p>
                    </motion.div>
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
                        className="w-fit"
                        onClick={() => {
                          window.location.href = feature.route!;
                        }}
                      >
                        <Translate content="go to feature" />
                        <div className="ml-2">
                          <Icon icon={allIcons.solid.faArrowRight} />
                        </div>
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
  }
);
export const DocumentationRoute = () => {
  const searchQuery = getFieldValue("search-in-doc");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const filteredFeatures = useMemo(() => {
    let filtered = features;
    // Filter by categories
    if (activeCategories.length > 0) {
      filtered = filtered.filter((feature) =>
        activeCategories.includes(feature.category)
      );
    }
    // Filter by search query
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
  }, [activeCategories, searchQuery]);
  const featuresByCategory = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      features: features.filter((feature) => feature.category === category.id),
      count: features.filter((feature) => feature.category === category.id)
        .length,
    }));
  }, []);
  return (
    <AnimatedPage>
      <motion.div
        className="w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Scroll className="w-full h-full">
          <div className="mx-auto p-6 max-w-7xl">
            {/* Header */}
            <motion.div variants={sectionVariants} className="mb-8 text-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="text-[--biqpod-primary] text-4xl">
                  <Icon icon={allIcons.solid.faBook} />
                </div>
                <h1 className="font-bold text-4xl">
                  <Translate content="Snapbuy Documentation" />
                </h1>
              </div>
              <p className="mx-auto max-w-3xl text-[--biqpod-text-secondary] text-lg">
                <Translate content="Discover all features, tips, and best practices to maximize your e-commerce success with Snapbuy" />
              </p>
            </motion.div>
            {/* Stats */}
            <motion.div
              variants={sectionVariants}
              className="gap-4 grid grid-cols-2 md:grid-cols-4 mb-8"
            >
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
            </motion.div>
            {/* Popular Tasks */}
            <motion.div variants={sectionVariants} className="mb-8">
              <div className="flex justify-center items-center gap-3 mb-6">
                <div className="text-[--biqpod-primary] text-3xl">
                  <Icon icon={allIcons.solid.faTasks} />
                </div>
                <h2 className="font-bold text-3xl">
                  <Translate content="Popular Tasks" />
                </h2>
              </div>
              <p className="mx-auto mb-6 max-w-3xl text-[--biqpod-text-secondary] text-center">
                <Translate content="Step-by-step guides to help you get started and master Snapbuy's powerful features" />
              </p>
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={setSelectedTask}
                  />
                ))}
              </div>
            </motion.div>
            {/* Search */}
            <motion.div variants={sectionVariants} className="mb-6">
              <div className="mx-auto max-w-md">
                <Field
                  inputName="search-in-doc"
                  className="p-2 rounded-2xl"
                  placeholder="Search features, tips, and documentation..."
                />
              </div>
            </motion.div>
            {/* Category Filter */}
            <motion.div variants={sectionVariants}>
              <CategoryFilter
                categories={categories}
                activeCategories={activeCategories}
                onCategorySelect={(id) => {
                  if (id === "") {
                    // Clear all categories
                    setActiveCategories([]);
                  } else {
                    // Toggle category
                    setActiveCategories((prev) =>
                      prev.includes(id)
                        ? prev.filter((cat) => cat !== id)
                        : [...prev, id]
                    );
                  }
                }}
              />
            </motion.div>
            {/* Category Overview (when no filter) */}
            {activeCategories.length === 0 && !searchQuery && (
              <motion.div variants={sectionVariants} className="mb-8">
                <h2 className="mb-6 font-bold text-2xl text-center">
                  <Translate content="feature categories" />
                </h2>
                <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {featuresByCategory.map((category) => (
                    <motion.div
                      key={category.id}
                      variants={cardVariants}
                      whileHover="hover"
                    >
                      <Card
                        className="p-6 cursor-pointer"
                        onClick={() => setActiveCategories([category.id])}
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-xl">
                            <div className="text-[--biqpod-primary] text-2xl">
                              <Icon icon={category.icon} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="mb-2 font-semibold text-lg">
                              <Translate content={category.name} />
                            </h3>
                            <p className="mb-3 text-[--biqpod-text-secondary] text-sm">
                              <Translate content={category.description} />
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-[--biqpod-primary] text-sm">
                                {category.count}{" "}
                                <Translate content="features" />
                              </span>
                              <div className="text-[--biqpod-text-secondary]">
                                <Icon icon={allIcons.solid.faArrowRight} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Features Grid */}
            {(activeCategories.length > 0 || searchQuery) && (
              <motion.div variants={sectionVariants}>
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
                      <div className="mb-4 text-[--biqpod-text-secondary] text-4xl">
                        <Icon icon={allIcons.solid.faSearch} />
                      </div>
                      <h3 className="mb-2 font-semibold text-lg">
                        <Translate content="no features found" />
                      </h3>
                      <p className="mb-4 text-[--biqpod-text-secondary]">
                        <Translate content="try adjusting your search or category filter" />
                      </p>
                      <Button
                        onClick={() => {
                          setActiveCategories([]);
                          setFieldValue("search-in-doc", "");
                        }}
                      >
                        <Translate content="clear filters" />
                      </Button>
                    </Card>
                  </EmptyComponent>
                )}
              </motion.div>
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
        {/* Task Details Modal */}
        <AnimatePresence>
          {selectedTask && (
            <TaskDetails
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatedPage>
  );
};
