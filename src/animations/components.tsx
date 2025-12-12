/**
 * Animated wrapper components for easy integration with existing components
 */
import { motion, HTMLMotionProps } from "framer-motion";
import React, { forwardRef } from "react";
import {
  cardVariants,
  listItemVariants,
  buttonVariants,
  fadeVariants,
  gridItemVariants,
  iconVariants,
  pageVariants,
  staggerContainer,
} from "./index";
// Generic animated div wrapper
export const AnimatedDiv = motion.div;
// Animated Card wrapper
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "hover" | "subtle";
  stagger?: boolean;
}
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, variant = "default", stagger = false, ...props }, ref) => {
    const variants = variant === "subtle" ? fadeVariants : cardVariants;
    const containerVariants = stagger ? staggerContainer : undefined;
    return (
      <motion.div
        ref={ref}
        variants={containerVariants || variants}
        initial="initial"
        animate="animate"
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";
// Animated List Container
interface AnimatedListProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerDelay?: number;
}
export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ children, staggerDelay = 0.1, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: 0.1,
            },
          },
        }}
        initial="initial"
        animate="animate"
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedList.displayName = "AnimatedList";
// Animated List Item
interface AnimatedListItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  index?: number;
}
export const AnimatedListItem = forwardRef<
  HTMLDivElement,
  AnimatedListItemProps
>(({ children, index, ...props }, ref) => {
  return (
    <motion.div ref={ref} variants={listItemVariants} custom={index} {...props}>
      {children}
    </motion.div>
  );
});
AnimatedListItem.displayName = "AnimatedListItem";
// Animated Button wrapper
interface AnimatedButtonProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  disabled?: boolean;
}
export const AnimatedButton = forwardRef<HTMLDivElement, AnimatedButtonProps>(
  ({ children, disabled = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";
// Animated Page wrapper
interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}
export const AnimatedPage = forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full"
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedPage.displayName = "AnimatedPage";
// Animated Grid Item
interface AnimatedGridItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  index?: number;
}
export const AnimatedGridItem = forwardRef<
  HTMLDivElement,
  AnimatedGridItemProps
>(({ children, index, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={gridItemVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      custom={index}
      {...props}
    >
      {children}
    </motion.div>
  );
});
AnimatedGridItem.displayName = "AnimatedGridItem";
// Animated Icon wrapper
interface AnimatedIconProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  disabled?: boolean;
}
export const AnimatedIcon = forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ children, disabled = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={iconVariants}
        initial="initial"
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedIcon.displayName = "AnimatedIcon";
// Fade In wrapper
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}
export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        transition={{ delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";
// Scale In wrapper
interface ScaleInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}
export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
ScaleIn.displayName = "ScaleIn";
// Slide In wrapper
interface SlideInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
}
export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ children, direction = "up", delay = 0, ...props }, ref) => {
    const directionVariants = {
      left: { x: -50, opacity: 0 },
      right: { x: 50, opacity: 0 },
      up: { y: 50, opacity: 0 },
      down: { y: -50, opacity: 0 },
    };
    return (
      <motion.div
        ref={ref}
        initial={directionVariants[direction]}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
SlideIn.displayName = "SlideIn";
// Hover Scale wrapper
interface HoverScaleProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  scale?: number;
}
export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, scale, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ scale }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverScale.displayName = "HoverScale";
// Pulse animation for loading states
interface PulseProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}
export const Pulse = forwardRef<HTMLDivElement, PulseProps>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Pulse.displayName = "Pulse";
