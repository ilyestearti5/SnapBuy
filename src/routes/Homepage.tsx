import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button, Icon, Translate, Card, Line } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
// Animation variants
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
export const Homepage = () => {
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
      step: "01",
    },
    {
      icon: allIcons.solid.faHandshake,
      title: "Connect Delivery Partner",
      description: "Choose from our network of trusted delivery partners.",
      step: "02",
    },
    {
      icon: allIcons.solid.faRocket,
      title: "Start Selling",
      description:
        "Manage everything from one dashboard and grow your business.",
      step: "03",
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
                iconClassName="text-[--biqpod-primary] text-2xl"
              />
              <span className="font-bold text-[--biqpod-primary] text-2xl">
                SnapBuy
              </span>
            </div>
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#home"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
              >
                <Translate content="Home" />
              </a>
              <a
                href="#features"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
              >
                <Translate content="Features" />
              </a>
              <a
                href="#how-it-works"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
              >
                <Translate content="How It Works" />
              </a>
              <a
                href="#documentation"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
              >
                <Translate content="Documentation" />
              </a>
              <a
                href="#contact"
                className="text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
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
                  <Icon icon={allIcons.solid.faPlay} iconClassName="mr-2" />
                  <Translate content="Watch Demo" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
          {/* Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-16"
          >
            <div className="flex max-md:flex-col justify-evenly items-center bg-[--biqpod-secondary-background] py-14 border border-[--biqpod-borders] border-solid rounded-[60px]">
              <div className="text-center">
                <Icon
                  icon={allIcons.solid.faStore}
                  iconClassName="text-4xl mb-2"
                />
                <h3 className="font-semibold">
                  <Translate content="Store Management" />
                </h3>
              </div>
              <div className="text-center">
                <Icon
                  icon={allIcons.solid.faTruck}
                  iconClassName="text-4xl mb-2"
                />
                <h3 className="font-semibold">
                  <Translate content="Delivery Network" />
                </h3>
              </div>
              <div className="text-center">
                <Icon
                  icon={allIcons.solid.faCreditCard}
                  iconClassName="text-4xl mb-2"
                />
                <h3 className="font-semibold">
                  <Translate content="Payment Processing" />
                </h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Line />
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
      {/* Features Section */}
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
              <motion.div key={index} variants={scaleIn}>
                <Card className="hover:shadow-lg p-6 h-full transition-shadow duration-300">
                  <div className="text-center">
                    <div className="mb-4 text-[--biqpod-primary]">
                      <Icon icon={feature.icon} iconClassName="text-4xl" />
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
                    <div className="flex justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Icon
                      icon={step.icon}
                      iconClassName="text-[--biqpod-primary] text-4xl mb-4"
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
                      iconClassName="text-[--biqpod-primary] text-2xl"
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
      <section className="bg-[--biqpod-secondary-background] py-20">
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
              <motion.div key={index} variants={scaleIn}>
                <Card className="p-6 h-full">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Icon
                        key={i}
                        icon={allIcons.solid.faStar}
                        iconClassName="text-[--biqpod-primary] text-sm"
                      />
                    ))}
                  </div>
                  <p className="opacity-80 mb-6 text-[--biqpod-text-color] italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="pt-4 border-[--biqpod-borders] border-t">
                    <h4 className="font-semibold text-[--biqpod-text-color]">
                      {testimonial.name}
                    </h4>
                    <p className="opacity-60 text-[--biqpod-text-color] text-sm">
                      {testimonial.role}
                    </p>
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
              <motion.div variants={scaleIn}>
                <Card className="hover:shadow-lg p-6 h-full text-center transition-shadow duration-300">
                  <div className="mb-4 text-[--biqpod-primary]">
                    <Icon
                      icon={allIcons.solid.faRocket}
                      iconClassName="text-4xl"
                    />
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="Quick Start Guide" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Get your store up and running in minutes with our step-by-step setup guide." />
                  </p>
                  <Link to="/documentation#quick-start">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid text-[--biqpod-primary] hover:text-white">
                      <Translate content="Start Setup" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn}>
                <Card className="hover:shadow-lg p-6 h-full text-center transition-shadow duration-300">
                  <div className="mb-4 text-[--biqpod-primary]">
                    <Icon
                      icon={allIcons.solid.faBook}
                      iconClassName="text-4xl"
                    />
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="API Reference" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Complete API documentation for developers who want to integrate with SnapBuy." />
                  </p>
                  <Link to="/documentation#api">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid text-[--biqpod-primary] hover:text-white">
                      <Translate content="View API" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn}>
                <Card className="hover:shadow-lg p-6 h-full text-center transition-shadow duration-300">
                  <div className="mb-4 text-[--biqpod-primary]">
                    <Icon
                      icon={allIcons.solid.faQuestionCircle}
                      iconClassName="text-4xl"
                    />
                  </div>
                  <h3 className="mb-3 font-semibold text-[--biqpod-text-color] text-xl">
                    <Translate content="FAQ & Support" />
                  </h3>
                  <p className="opacity-80 mb-4 text-[--biqpod-text-color] leading-relaxed">
                    <Translate content="Find answers to common questions and get help from our support team." />
                  </p>
                  <Link to="/documentation#faq">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] border border-[--biqpod-primary] border-solid text-[--biqpod-primary] hover:text-white">
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
                      <Icon
                        icon={allIcons.solid.faFileText}
                        iconClassName="mr-2"
                      />
                      <Translate content="View Full Docs" />
                    </Button>
                  </Link>
                  <Link to="/feedbacks">
                    <Button className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-primary] px-6 py-3 border-[--biqpod-primary] border-2 border-solid text-[--biqpod-primary] hover:text-white">
                      <Icon
                        icon={allIcons.solid.faLifeRing}
                        iconClassName="mr-2"
                      />
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
                  <Icon icon={allIcons.solid.faRocket} iconClassName="mr-2" />
                  <Translate content="Start Free Trial" />
                </Button>
              </Link>
              <Button className="bg-[--biqpod-secondary-background] px-8 py-4 border-[--biqpod-primary] border-2 border-solid w-fit text-[--biqpod-primary] text-lg">
                <Icon icon={allIcons.solid.faCalendar} iconClassName="mr-2" />
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
                  iconClassName="text-[--biqpod-primary] text-2xl"
                />
                <span className="font-bold text-2xl">SnapBuy</span>
              </div>
              <p className="opacity-80 mb-6 text-[--biqpod-text-color] leading-relaxed">
                <Translate content="The complete e-commerce platform that empowers sellers to manage their stores, deliveries, and payments efficiently. Join the revolution." />
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                >
                  <Icon
                    icon={allIcons.brands.faFacebook}
                    iconClassName="text-xl"
                  />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                >
                  <Icon
                    icon={allIcons.brands.faTwitter}
                    iconClassName="text-xl"
                  />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                >
                  <Icon
                    icon={allIcons.brands.faInstagram}
                    iconClassName="text-xl"
                  />
                </a>
                <a
                  href="#"
                  className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                >
                  <Icon
                    icon={allIcons.brands.faLinkedin}
                    iconClassName="text-xl"
                  />
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
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Features" />
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Pricing" />
                  </a>
                </li>
                <li>
                  <Link
                    to="/documentation"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Documentation" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feedbacks"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
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
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Privacy Policy" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Terms of Service" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
                  >
                    <Translate content="Cookie Policy" />
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="opacity-60 text-[--biqpod-text-color] hover:text-[--biqpod-primary] transition-colors"
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
