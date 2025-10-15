/**
 * Animation Showcase Component
 * Demonstrates all available animations in the Souqify project
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CircleTip, Line, Icon } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  AnimatedCard,
  AnimatedPage,
  FadeIn,
  HoverScale,
  AutoAnimate,
  SequentialAnimate,
  BouncyNumber,
  LoadingDots,
  FloatingButton,
  SlideUpReveal,
  StaggeredGrid,
  Typewriter,
} from "../animations";
import { cardVariants, modalVariants } from "../animations/index";
export const AnimationShowcase = () => {
  const [showModal, setShowModal] = useState(false);
  const [counter, setCounter] = useState(0);
  const [showCards, setShowCards] = useState(true);
  const demoCards = [
    { id: 1, title: "Card Animation 1", content: "Smooth entrance animations" },
    { id: 2, title: "Card Animation 2", content: "Hover effects and scaling" },
    { id: 3, title: "Card Animation 3", content: "Staggered loading states" },
    { id: 4, title: "Card Animation 4", content: "Interactive animations" },
    { id: 5, title: "Card Animation 5", content: "Spring physics" },
    { id: 6, title: "Card Animation 6", content: "Gesture animations" },
  ];
  return (
    <AnimatedPage>
      <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
        {/* Header Section */}
        <AutoAnimate variant="fade" delay={0.1}>
          <div className="text-center">
            <h1 className="mb-2 font-bold text-4xl">
              <Typewriter
                text="Souqify Animation Showcase"
                speed={100}
                delay={0.5}
              />
            </h1>
            <p className="text-gray-600">
              Demonstrating the complete animation system
            </p>
          </div>
        </AutoAnimate>
        {/* Counter Section */}
        <FadeIn delay={0.3}>
          <AnimatedCard className="p-6 text-center">
            <h2 className="mb-4 font-bold text-2xl">Interactive Counter</h2>
            <div className="flex justify-center items-center gap-4 mb-4">
              <HoverScale scale={1.1}>
                <Button
                  onClick={() => setCounter(counter - 1)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Icon icon={allIcons.solid.faMinus} />
                </Button>
              </HoverScale>
              <div className="font-bold text-6xl">
                <BouncyNumber value={counter} delay={0.1} />
              </div>
              <HoverScale scale={1.1}>
                <Button
                  onClick={() => setCounter(counter + 1)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Icon icon={allIcons.solid.faPlus} />
                </Button>
              </HoverScale>
            </div>
            <LoadingDots className="text-blue-500" />
          </AnimatedCard>
        </FadeIn>
        {/* Card Grid Section */}
        <SlideUpReveal delay={0.5}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-2xl">Animated Card Grid</h2>
            <HoverScale scale={1.05}>
              <Button onClick={() => setShowCards(!showCards)}>
                <Icon icon={allIcons.solid.faRefresh} />
                Toggle Cards
              </Button>
            </HoverScale>
          </div>
        </SlideUpReveal>
        <AnimatePresence>
          {showCards && (
            <StaggeredGrid columns={3} staggerDelay={0.1}>
              {demoCards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  layout
                >
                  <AnimatedCard className="p-4 cursor-pointer">
                    <h3 className="mb-2 font-semibold text-lg">{card.title}</h3>
                    <p className="text-gray-600">{card.content}</p>
                    <div className="flex justify-end mt-4">
                      <HoverScale scale={1.2}>
                        <CircleTip
                          icon={allIcons.solid.faArrowRight}
                          onClick={() => console.log(`Clicked ${card.title}`)}
                        />
                      </HoverScale>
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </StaggeredGrid>
          )}
        </AnimatePresence>
        {/* Sequential Animation Section */}
        <AutoAnimate variant="fade" delay={0.7}>
          <h2 className="mb-4 font-bold text-2xl">Sequential Animations</h2>
        </AutoAnimate>
        <SequentialAnimate staggerDelay={0.2}>
          {[
            {
              icon: allIcons.solid.faRocket,
              label: "Fast Performance",
              color: "text-blue-500",
            },
            {
              icon: allIcons.solid.faMagic,
              label: "Smooth Transitions",
              color: "text-purple-500",
            },
            {
              icon: allIcons.solid.faHeart,
              label: "Delightful Experience",
              color: "text-red-500",
            },
            {
              icon: allIcons.solid.faCheck,
              label: "Easy to Use",
              color: "text-green-500",
            },
          ].map((item, index) => (
            <AnimatedCard key={index} className="flex items-center gap-4 p-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                }}
              >
                <Icon
                  icon={item.icon}
                  iconClassName={`text-2xl ${item.color}`}
                />
              </motion.div>
              <span className="font-medium text-lg">{item.label}</span>
            </AnimatedCard>
          ))}
        </SequentialAnimate>
        {/* Modal Demo Section */}
        <FadeIn delay={0.9}>
          <AnimatedCard className="p-6 text-center">
            <h2 className="mb-4 font-bold text-2xl">Modal Animation Demo</h2>
            <HoverScale scale={1.05}>
              <Button onClick={() => setShowModal(true)}>
                Open Animated Modal
              </Button>
            </HoverScale>
          </AnimatedCard>
        </FadeIn>
        {/* Floating Action Button */}
        <FloatingButton
          className="right-6 bottom-6 z-50 fixed bg-blue-500 shadow-lg p-4 rounded-full text-white"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          delay={1.2}
        >
          <Icon icon={allIcons.solid.faArrowUp} />
        </FloatingButton>
        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              {/* Backdrop */}
              <motion.div
                className="z-40 fixed inset-0 bg-black bg-opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
              />
              {/* Modal Content */}
              <motion.div
                className="top-1/2 left-1/2 z-50 fixed -translate-x-1/2 -translate-y-1/2 transform"
                variants={modalVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <AnimatedCard className="p-8 w-full max-w-md">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <Icon
                        icon={allIcons.solid.faCheckCircle}
                        iconClassName="text-6xl text-green-500 mb-4"
                      />
                    </motion.div>
                    <h3 className="mb-4 font-bold text-2xl">
                      <Typewriter text="Animation Success!" speed={80} />
                    </h3>
                    <p className="mb-6 text-gray-600">
                      This modal demonstrates entrance animations, backdrop
                      effects, and interactive elements.
                    </p>
                    <div className="flex justify-center gap-4">
                      <HoverScale scale={1.05}>
                        <Button
                          onClick={() => setShowModal(false)}
                          className="bg-gray-500 hover:bg-gray-600"
                        >
                          Close
                        </Button>
                      </HoverScale>
                      <HoverScale scale={1.05}>
                        <Button
                          onClick={() => {
                            setCounter(counter + 10);
                            setShowModal(false);
                          }}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Add 10 to Counter
                        </Button>
                      </HoverScale>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Footer */}
        <SlideUpReveal delay={1.0}>
          <div className="py-8 text-center">
            <Line />
            <p className="mt-4 text-gray-500">
              🎨 All animations powered by Framer Motion and custom animation
              utilities
            </p>
          </div>
        </SlideUpReveal>
      </div>
    </AnimatedPage>
  );
};
