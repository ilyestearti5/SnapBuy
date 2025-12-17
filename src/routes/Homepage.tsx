import { motion } from "framer-motion";
import { Link, useHistory } from "react-router-dom";
import {
  Button,
  Icon,
  Translate,
  Card,
  Line,
  Image,
  CardWait,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  confirm,
  getIndexedDBItem,
  setIndexedDBItem,
} from "@biqpod/app/ui/hooks";
import { useUser } from "@biqpod/app/ui/hooks";
import { useEffect, useState } from "react";
import { Biqpod } from "@biqpod/app/ui/types";
import snapbuy from "../assets/snapbuy.png";
import store from "../assets/store.png";
import delivery from "../assets/delivery.png";
import paymentChecked from "../assets/payment-checked.png";
import products from "../assets/products.png";
import shopping from "../assets/shopping.png";
import overview from "../assets/overview.png";
import { pagesSrcs } from "./pages";
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};
const MAX_RECENT_STORES = 5;
export const Homepage = () => {
  const user = useUser();
  const [recentStores, setRecentStores] = useState<Biqpod.Snapbuy.Store[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  // Load recently visited stores from IndexedDB
  useEffect(() => {
    const loadRecentStores = async () => {
      if (!user) {
        setLoadingRecent(false);
        return;
      }
      try {
        const key = `recently-visited-${user.uid}`;
        const data = await getIndexedDBItem<{
          userId: string;
          stores: Biqpod.Snapbuy.Store[];
          lastUpdated: number;
        }>(key);
        if (data?.stores) {
          setRecentStores(data.stores.slice(0, MAX_RECENT_STORES));
        }
      } catch (error) {
        console.error("Error loading recent stores:", error);
      } finally {
        setLoadingRecent(false);
      }
    };
    loadRecentStores();
  }, [user]);
  const features = [
    {
      icon: allIcons.solid.faStore,
      title: "Smart Store Management",
      description:
        "Easily manage your e-store products and inventory with our intuitive dashboard.",
    },
    {
      icon: allIcons.solid.faTruck,
      title: "Integrated Deliveries",
      description:
        "Connect with trusted delivery partners in one click and streamline your logistics.",
    },
    {
      icon: allIcons.solid.faCreditCard,
      title: "Secure Payments",
      description:
        "Handle customer payments safely and efficiently with multiple payment options.",
    },
    {
      icon: allIcons.solid.faChartBar,
      title: "Analytics Dashboard",
      description:
        "Track performance and sales with visual reports and real-time insights.",
    },
  ];
  const steps = [
    {
      icon: allIcons.solid.faUserPlus,
      title: "Register Your Store",
      description:
        "Create your account and set up your store profile in minutes.",
      step: "1",
    },
    {
      icon: allIcons.solid.faHandshake,
      title: "Connect Delivery Partner",
      description: "Choose from our network of trusted delivery partners.",
      step: "2",
    },
    {
      icon: allIcons.solid.faRocket,
      title: "Start Selling",
      description:
        "Manage everything from one dashboard and grow your business.",
      step: "3",
    },
  ];
  const testimonials = [
    {
      name: "Sarah Ahmed",
      role: "Fashion Store Owner",
      content:
        "SnapBuy transformed my online business. Managing orders and deliveries has never been easier!",
      rating: 5,
    },
    {
      name: "Mohamed Ali",
      role: "Electronics Retailer",
      content:
        "The analytics dashboard helps me make better decisions. Sales increased by 40% in just 3 months.",
      rating: 5,
    },
    {
      name: "Fatima Hassan",
      role: "Home Goods Seller",
      content:
        "Customer support is excellent and the platform is so user-friendly. Highly recommended!",
      rating: 5,
    },
  ];
  const exampleImages = [
    {
      name: "Cat & Dog",
      photo: pagesSrcs[0],
      web: "https://snapbuy.com/docs/dashboard",
    },
    {
      name: "Cosmetics",
      photo: pagesSrcs[1],
      web: "https://snapbuy.com/docs/products",
    },
    {
      name: "Car Filters",
      photo: pagesSrcs[2],
      web: "https://snapbuy.com/docs/orders",
    },
    {
      name: "Car Accessories",
      photo: pagesSrcs[3],
      web: "https://snapbuy.com/docs/delivery",
    },
    {
      name: "Car Auto",
      photo: pagesSrcs[4],
      web: "https://snapbuy.com/docs/payments",
    },
    {
      name: "Learning",
      photo: pagesSrcs[5],
      web: "https://snapbuy.com/docs/analytics",
    },
    {
      name: "University",
      photo: pagesSrcs[6],
      web: "https://snapbuy.com/docs/customers",
    },
    {
      name: "Sport Equipment",
      photo: pagesSrcs[7],
      web: "https://snapbuy.com/docs/inventory",
    },
    {
      name: "Car Parts",
      photo: pagesSrcs[8],
      web: "https://snapbuy.com/docs/api",
    },
    {
      name: "Motocycle Gear",
      photo: pagesSrcs[9],
      web: "https://snapbuy.com/docs/mobile",
    },
    ...pagesSrcs.slice(10).map((_, index) => ({
      name: `Example ${index}`,
      photo: _,
      web: "https://snapbuy.com/docs",
    })),
  ];
  const hist = useHistory();
  return (
    <div className="bg-[--biqpod-primary-background] min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="top-0 z-50 sticky shadow-sm backdrop-blur-sm"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Icon
                icon={allIcons.solid.faBolt}
                className="text-[--biqpod-primary] text-2xl"
              />
              <span className="font-bold text-[--biqpod-primary] text-2xl">
                SnapBuy
              </span>
            </div>
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#home"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
              >
                <Translate content="Home" />
              </a>
              <a
                href="#features"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
              >
                <Translate content="Features" />
              </a>
              <a
                href="#how-it-works"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
              >
                <Translate content="How It Works" />
              </a>
              <a
                href="#documentation"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
              >
                <Translate content="Documentation" />
              </a>
              <a
                href="#contact"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
              >
                <Translate content="Contact" />
              </a>
            </nav>
            {/* CTA Button */}
            <Link to="/profile">
              <Button className="px-6 py-2">
                <Translate content="Get Started" />
              </Button>
            </Link>
          </div>
        </div>
        <Line />
      </motion.header>
      {/* Hero Section */}
      <section id="home" className="py-20 lg:py-32">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="mb-6 font-bold text-[--biqpod-text-color] text-4xl md:text-6xl"
            >
              <Translate content="Simplify Your" />{" "}
              <span className="text-[--biqpod-primary]">
                E-Commerce Journey
              </span>{" "}
              <Translate content="with SnapBuy" />
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto mb-8 max-w-3xl text-[--biqpod-text-color] text-xl leading-relaxed"
            >
              <Translate content="The all-in-one platform that connects sellers, buyers, and delivery companies. Manage your online store, handle deliveries, and process payments seamlessly." />
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex sm:flex-row flex-col justify-center items-center gap-4"
            >
              <Link to="/profile">
                <Button
                  icon={allIcons.solid.faRocket}
                  className="px-8 py-4 text-lg"
                >
                  <Translate content="Get Started Now" />
                </Button>
              </Link>
              <Button className="bg-[--biqpod-secondary-background] px-8 py-4 border-[--biqpod-primary] border-2 border-solid w-fit text-[--biqpod-primary] text-lg">
                <a href="#video" className="flex items-center">
                  <Icon icon={allIcons.solid.faPlay} className="mr-2" />
                  <Translate content="Watch Demo" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
          {/* Hero Illustration with Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-16"
          >
            <div className="bg-[--biqpod-secondary-background] border border-[--biqpod-borders] border-solid rounded-[60px] overflow-hidden">
              {/* Main Hero Image */}
              <div className="relative px-6 py-8">
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  src={snapbuy}
                  alt="SnapBuy Platform"
                  className="mx-auto max-w-full h-auto max-h-[400px] object-contain"
                />
              </div>
              {/* Feature Cards Below Image */}
              <div className="flex max-md:flex-col justify-evenly items-center px-6 py-8 border-[--biqpod-borders] border-t">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="p-4 text-center hover:scale-105 transition-transform"
                >
                  <div className="mb-3">
                    <img
                      src={store}
                      alt="Store Management"
                      className="mx-auto w-16 h-16 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold">
                    <Translate content="Store Management" />
                  </h3>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="p-4 text-center hover:scale-105 transition-transform"
                >
                  <div className="mb-3">
                    <img
                      src={delivery}
                      alt="Delivery Network"
                      className="mx-auto w-16 h-16 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold">
                    <Translate content="Delivery Network" />
                  </h3>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="p-4 text-center hover:scale-105 transition-transform"
                >
                  <div className="mb-3">
                    <img
                      src={paymentChecked}
                      alt="Payment Processing"
                      className="mx-auto w-16 h-16 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold">
                    <Translate content="Payment Processing" />
                  </h3>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Recently Visited Stores Section */}
      {user && (loadingRecent || recentStores.length > 0) && (
        <EmptyComponent>
          <section className="py-20">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl text-center"
                >
                  <Translate content="Recently Visited Stores" />
                </motion.h2>
                <motion.p
                  variants={fadeInUp}
                  className="opacity-80 mx-auto mb-12 max-w-2xl text-[--biqpod-text-color] text-xl text-center"
                >
                  <Translate content="Quick access to your recently visited stores" />
                </motion.p>
                {loadingRecent ? (
                  <motion.div
                    variants={staggerContainer}
                    className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                  >
                    {Array.from({ length: MAX_RECENT_STORES }).map(
                      (_, index) => (
                        <CardWait key={index} className="h-[180px]" />
                      )
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                  >
                    {recentStores.map((store) => (
                      <motion.div
                        key={store.id}
                        variants={scaleIn}
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="cursor-pointer">
                          <div className="flex items-center gap-2 p-2 text-center">
                            <Image
                              className="bg-[--biqpod-gray-opacity] rounded-xl w-20 h-20 object-cover"
                              src={store.photo}
                              alt={
                                <div className="flex justify-center items-center font-bold text-2xl">
                                  {store.name[0]?.toUpperCase()}
                                </div>
                              }
                            />
                            <div className="flex flex-col">
                              <h3 className="font-semibold text-[--biqpod-text-color] text-lg line-clamp-1">
                                {store.name}
                              </h3>
                              <p className="opacity-70 text-[--biqpod-text-color] text-sm line-clamp-1">
                                {store.phone}
                              </p>
                            </div>
                          </div>
                          <Line />
                          <div className="flex justify-end items-center gap-2 p-2 w-full">
                            <Button
                              className="bg-[--biqpod-gray-opacity] rounded-full w-fit text-[--biqpod-text-color]"
                              icon={allIcons.solid.faTrash}
                              onClick={async () => {
                                const response = await confirm({
                                  title: "Remove Store",
                                  message: `Are you sure you want to remove "${store.name}" from your recently visited stores?`,
                                  type: "warning",
                                });
                                if (response) {
                                  const updatedStores = recentStores.filter(
                                    (s) => s.id !== store.id
                                  );
                                  setRecentStores(updatedStores);
                                  setIndexedDBItem(
                                    `recently-visited-${user.uid}`,
                                    {
                                      userId: user.uid,
                                      stores: updatedStores,
                                      lastUpdated: Date.now(),
                                    }
                                  );
                                }
                              }}
                            >
                              <Translate content="Remove" />
                            </Button>
                            <Button
                              onClick={() => {
                                hist.push(`/store/${store.id}/dashboard`);
                              }}
                              className="rounded-full w-fit"
                              rightIcon={allIcons.solid.faArrowRight}
                            >
                              <Translate content="Visit Store" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </section>
          <Line />
        </EmptyComponent>
      )}
      {/* Video Section */}
      <section id="video" className="py-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl"
            >
              <Translate content="See SnapBuy in Action" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto mb-12 max-w-2xl text-[--biqpod-text-color] text-xl"
            >
              <Translate content="Watch how SnapBuy transforms your e-commerce operations with seamless store management, delivery integration, and payment processing." />
            </motion.p>
            <motion.div
              variants={scaleIn}
              className="relative mx-auto max-w-4xl"
            >
              <div className="relative bg-[--biqpod-secondary-background] shadow-2xl rounded-2xl overflow-hidden">
                {/* Video Container */}
                <div className="relative pb-[56.25%] h-0">
                  {/* 16:9 Aspect Ratio */}
                  <iframe
                    className="top-0 left-0 absolute w-full h-full"
                    src="https://www.youtube.com/embed/S7P1CvjavIw?si=UrYgQISwbZliIukw"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
              {/* Video Stats */}
              <motion.div
                variants={fadeInUp}
                className="gap-8 grid grid-cols-1 md:grid-cols-3 mt-8"
              >
                <div className="text-center">
                  <div className="mb-2 font-bold text-[--biqpod-primary] text-2xl">
                    2M+
                  </div>
                  <p className="opacity-80 text-[--biqpod-text-color]">
                    <Translate content="Products Managed" />
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 font-bold text-[--biqpod-primary] text-2xl">
                    50K+
                  </div>
                  <p className="opacity-80 text-[--biqpod-text-color]">
                    <Translate content="Orders Delivered" />
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2 font-bold text-[--biqpod-primary] text-2xl">
                    99.9%
                  </div>
                  <p className="opacity-80 text-[--biqpod-text-color]">
                    <Translate content="Uptime Guarantee" />
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Image Showcase Section */}
      <section className="py-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* First Row: Products Management */}
            <div className="items-center gap-8 grid grid-cols-1 lg:grid-cols-2 mb-20">
              <motion.div variants={fadeInUp}>
                <h3 className="mb-4 font-bold text-[--biqpod-text-color] text-3xl">
                  <Translate content="Effortless Product Management" />
                </h3>
                <p className="opacity-80 mb-6 text-[--biqpod-text-color] text-lg leading-relaxed">
                  <Translate content="Organize and manage your entire product catalog with ease. Add, edit, and track inventory in real-time with our intuitive interface." />
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Bulk product uploads and editing" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Real-time inventory tracking" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Advanced categorization and filters" />
                    </span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl p-4 overflow-hidden">
                  <img
                    src={products}
                    alt="Products Management"
                    className="rounded-lg w-full h-auto max-h-[300px] object-contain"
                  />
                </Card>
              </motion.div>
            </div>
            {/* Second Row: Shopping Experience (Reversed) */}
            <div className="items-center gap-8 grid grid-cols-1 lg:grid-cols-2 mb-20">
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="order-last lg:order-first"
              >
                <Card className="shadow-xl p-4 overflow-hidden">
                  <img
                    src={shopping}
                    alt="Shopping Experience"
                    className="rounded-lg w-full h-auto max-h-[300px] object-contain"
                  />
                </Card>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="order-first lg:order-last"
              >
                <h3 className="mb-4 font-bold text-[--biqpod-text-color] text-3xl">
                  <Translate content="Seamless Shopping Experience" />
                </h3>
                <p className="opacity-80 mb-6 text-[--biqpod-text-color] text-lg leading-relaxed">
                  <Translate content="Provide your customers with a smooth and enjoyable shopping journey from browsing to checkout." />
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Mobile-optimized shopping interface" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Quick checkout process" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Personalized recommendations" />
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>
            {/* Third Row: Overview Dashboard */}
            <div className="items-center gap-8 grid grid-cols-1 lg:grid-cols-2">
              <motion.div variants={fadeInUp}>
                <h3 className="mb-4 font-bold text-[--biqpod-text-color] text-3xl">
                  <Translate content="Comprehensive Overview Dashboard" />
                </h3>
                <p className="opacity-80 mb-6 text-[--biqpod-text-color] text-lg leading-relaxed">
                  <Translate content="Monitor your business performance at a glance with detailed analytics and insights." />
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Real-time sales analytics" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Customer insights and behavior" />
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Icon
                      icon={allIcons.solid.faCheck}
                      className="mt-1 mr-3 text-[--biqpod-primary]"
                    />
                    <span className="text-[--biqpod-text-color]">
                      <Translate content="Performance reports and trends" />
                    </span>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl p-4 overflow-hidden">
                  <img
                    src={overview}
                    alt="Overview Dashboard"
                    className="rounded-lg w-full h-auto max-h-[300px] object-contain"
                  />
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Examples Section */}
      <section className="py-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 w-full overflow-hidden"
          >
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {exampleImages.map((image, index) => (
                <Card
                  key={index}
                  className="overflow-hidden cursor-pointer"
                  onClick={() => window.open(image.web, "_blank")}
                >
                  <img
                    src={image.photo}
                    alt={image.name}
                    className="w-full h-48 object-cover"
                  />
                  <Line />
                  <div className="p-2">
                    <p className="font-semibold text-[--biqpod-text-color] text-sm text-center">
                      {image.name}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Features Section with Images */}
      <section
        id="features"
        className="bg-[--biqpod-secondary-background] py-20"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl"
            >
              <Translate content="Powerful Features for Your Success" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto max-w-2xl text-[--biqpod-text-color] text-xl"
            >
              <Translate content="Everything you need to run a successful e-commerce business, all in one place." />
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Card className="group hover:shadow-2xl p-6 h-full overflow-hidden">
                  <div className="text-center">
                    {/* Animated Icon Background */}
                    <div className="relative mx-auto mb-4 w-20 h-20">
                      <motion.div
                        className="absolute inset-0 bg-[--biqpod-primary] opacity-10 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative flex justify-center items-center w-full h-full text-[--biqpod-primary]">
                        <Icon
                          icon={feature.icon}
                          className="text-4xl group-hover:scale-110 transition-transform"
                        />
                      </div>
                    </div>
                    <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                      <Translate content={feature.title} />
                    </h3>
                    <p className="opacity-80 text-[--biqpod-text-color] leading-relaxed">
                      <Translate content={feature.description} />
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <Line />
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl"
            >
              <Translate content="How SnapBuy Works" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto max-w-2xl text-[--biqpod-text-color] text-xl"
            >
              <Translate content="Get started in just three simple steps and begin growing your business today." />
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="gap-8 grid grid-cols-1 md:grid-cols-3"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={scaleIn} className="relative">
                <Card className="p-8 h-full text-center">
                  {/* Step Number */}
                  <div className="-top-4 left-1/2 absolute -translate-x-1/2 transform">
                    <div className="flex justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 font-bold text-[--biqpod-primary-content]">
                      {step.step}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Icon
                      icon={step.icon}
                      className="mb-4 text-[--biqpod-primary] text-4xl"
                    />
                    <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                      <Translate content={step.title} />
                    </h3>
                    <p className="opacity-80 text-[--biqpod-text-color] leading-relaxed">
                      <Translate content={step.description} />
                    </p>
                  </div>
                </Card>
                {/* Connecting Arrow (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block top-1/2 -right-4 absolute -translate-y-1/2 transform">
                    <Icon
                      icon={allIcons.solid.faArrowRight}
                      className="text-[--biqpod-primary] text-2xl"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Testimonials Section */}
      <section className="relative bg-[--biqpod-secondary-background] py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="top-10 left-10 absolute bg-[--biqpod-primary] rounded-full w-32 h-32"
            animate={{ y: [0, 30, 0], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="right-10 bottom-10 absolute bg-[--biqpod-primary] rounded-full w-48 h-48"
            animate={{ y: [0, -40, 0], rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl"
            >
              <Translate content="What Our Users Say" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto max-w-2xl text-[--biqpod-text-color] text-xl"
            >
              <Translate content="Join thousands of successful sellers who trust SnapBuy to grow their business." />
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="gap-8 grid grid-cols-1 md:grid-cols-3"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <Card className="relative hover:shadow-2xl p-6 h-full overflow-hidden">
                  {/* Decorative Quote Icon */}
                  <div className="top-4 right-4 absolute opacity-10">
                    <Icon
                      icon={allIcons.solid.faQuoteRight}
                      className="text-[--biqpod-primary] text-5xl"
                    />
                  </div>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Icon
                          icon={allIcons.solid.faStar}
                          className="text-[--biqpod-primary] text-sm"
                        />
                      </motion.div>
                    ))}
                  </div>
                  <p className="opacity-80 mb-6 text-[--biqpod-text-color] italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-[--biqpod-borders] border-t">
                    {/* Avatar Circle with Initial */}
                    <div className="flex justify-center items-center bg-[--biqpod-primary] rounded-full w-12 h-12 font-bold text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[--biqpod-text-color]">
                        {testimonial.name}
                      </h4>
                      <p className="opacity-60 text-[--biqpod-text-color] text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Documentation Section */}
      <section id="documentation" className="py-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-[--biqpod-text-color] text-3xl md:text-4xl"
            >
              <Translate content="Comprehensive Documentation" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto mb-12 max-w-2xl text-[--biqpod-text-color] text-xl"
            >
              <Translate content="Everything you need to get started with SnapBuy. From quick setup guides to advanced features, we've got you covered." />
            </motion.p>
            <motion.div
              variants={staggerContainer}
              className="gap-8 grid grid-cols-1 md:grid-cols-3 mb-12"
            >
              <motion.div variants={scaleIn} whileHover={{ y: -8 }}>
                <Card className="group hover:shadow-xl p-6 h-full overflow-hidden text-center">
                  {/* Image Header */}
                  <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[--biqpod-primary] to-purple-600 opacity-80"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="relative flex justify-center items-center h-full">
                      <Icon
                        icon={allIcons.solid.faRocket}
                        className="text-white text-5xl group-hover:scale-110 transition-transform"
                      />
                    </div>
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="Quick Start Guide" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Get your store up and running in minutes with our step-by-step setup guide." />
                  </p>
                  <Link to="/documentation#quick-start">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid w-full text-[--biqpod-primary] hover:text-white">
                      <Translate content="Start Setup" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ y: -8 }}>
                <Card className="group hover:shadow-xl p-6 h-full overflow-hidden text-center">
                  {/* Image Header */}
                  <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-80"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="relative flex justify-center items-center h-full">
                      <Icon
                        icon={allIcons.solid.faBook}
                        className="text-white text-5xl group-hover:scale-110 transition-transform"
                      />
                    </div>
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="API Reference" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Complete API documentation for developers who want to integrate with SnapBuy." />
                  </p>
                  <Link to="/documentation#api">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid w-full text-[--biqpod-primary] hover:text-white">
                      <Translate content="View API" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
              <motion.div variants={scaleIn} whileHover={{ y: -8 }}>
                <Card className="group hover:shadow-xl p-6 h-full overflow-hidden text-center">
                  {/* Image Header */}
                  <div className="relative -mx-6 -mt-6 mb-4 h-32 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-80"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="relative flex justify-center items-center h-full">
                      <Icon
                        icon={allIcons.solid.faQuestionCircle}
                        className="text-white text-5xl group-hover:scale-110 transition-transform"
                      />
                    </div>
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="FAQ & Support" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Find answers to common questions and get help from our support team." />
                  </p>
                  <Link to="/documentation#faq">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid w-full text-[--biqpod-primary] hover:text-white">
                      <Translate content="Get Help" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="bg-[--biqpod-secondary-background] p-8 rounded-2xl"
            >
              <div className="flex md:flex-row flex-col justify-between items-center gap-6">
                <div className="md:text-left text-center">
                  <h3 className="mb-2 font-bold text-[--biqpod-text-color] text-2xl">
                    <Translate content="Need More Help?" />
                  </h3>
                  <p className="opacity-80 text-[--biqpod-text-color] text-lg">
                    <Translate content="Our documentation covers everything from basic setup to advanced integrations." />
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link to="/documentation">
                    <Button className="px-6 py-3">
                      <Icon icon={allIcons.solid.faFileText} className="mr-2" />
                      <Translate content="View Full Docs" />
                    </Button>
                  </Link>
                  <Link to="/feedbacks">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] px-6 py-3 border-[--biqpod-primary] border-2 border-solid text-[--biqpod-primary] hover:text-white">
                      <Icon icon={allIcons.solid.faLifeRing} className="mr-2" />
                      <Translate content="Contact Support" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-bold text-3xl md:text-4xl"
            >
              <Translate content="Ready to Transform Your Business?" />
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="opacity-80 mx-auto mb-8 max-w-2xl text-xl"
            >
              <Translate content="Join thousands of successful sellers and start growing your e-commerce business today." />
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex sm:flex-row flex-col justify-center items-center gap-4"
            >
              <Link to="/profile">
                <Button className="px-8 py-4 text-lg">
                  <Icon icon={allIcons.solid.faRocket} className="mr-2" />
                  <Translate content="Start Free Trial" />
                </Button>
              </Link>
              <Button className="bg-[--biqpod-secondary-background] px-8 py-4 border-[--biqpod-primary] border-2 border-solid w-fit text-[--biqpod-primary] text-lg">
                <Icon icon={allIcons.solid.faCalendar} className="mr-2" />
                <Translate content="Schedule Demo" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <Line />
      {/* Footer */}
      <footer className="bg-[--biqpod-secondary-background] py-16 text-[--biqpod-text-color]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="gap-8 grid grid-cols-1 md:grid-cols-4">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Icon
                  icon={allIcons.solid.faBolt}
                  className="text-[--biqpod-primary] text-2xl"
                />
                <span className="font-bold text-2xl">SnapBuy</span>
              </div>
              <p className="opacity-80 mb-6 text-[--biqpod-text-color] leading-relaxed">
                <Translate content="The complete e-commerce platform that empowers sellers to manage their stores, deliveries, and payments efficiently. Join the revolution." />
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                >
                  <Icon icon={allIcons.brands.faFacebook} className="text-xl" />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                >
                  <Icon icon={allIcons.brands.faTwitter} className="text-xl" />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                >
                  <Icon
                    icon={allIcons.brands.faInstagram}
                    className="text-xl"
                  />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                >
                  <Icon icon={allIcons.brands.faLinkedin} className="text-xl" />
                </a>
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="mb-4 font-semibold text-lg">
                <Translate content="Quick Links" />
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Features" />
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Pricing" />
                  </a>
                </li>
                <li>
                  <Link
                    to="/documentation"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Documentation" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feedbacks"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Support" />
                  </Link>
                </li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h3 className="mb-4 font-semibold text-lg">
                <Translate content="Legal" />
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Privacy Policy" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Terms of Service" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Cookie Policy" />
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary]"
                  >
                    <Translate content="Contact Us" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="my-8 border-[--biqpod-borders] border-t" />
          <div className="flex md:flex-row flex-col justify-between items-center">
            <p className="opacity-60 text-[--biqpod-text-color] text-sm">
              © 2025 SnapBuy. <Translate content="All rights reserved." />
            </p>
            <p className="opacity-60 mt-2 md:mt-0 text-[--biqpod-text-color] text-sm">
              <Translate content="Made with" /> ❤️{" "}
              <Translate content="for e-commerce success" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
