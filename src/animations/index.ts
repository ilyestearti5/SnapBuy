/**
 * Centralized Framer Motion animation configurations for Biqpod.Snapbuy
 * This file contains reusable animation variants and utilities
 */

import { Variants, Transition } from "framer-motion";

// Common easing functions
export const easings = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  sharp: [0.4, 0, 1, 1],
  standard: [0.4, 0, 0.2, 1],
} as const;

// Common durations
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: durations.fast,
      ease: easings.sharp,
    },
  },
};

// Card animations
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: easings.sharp,
    },
  },
};

// List item animations
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: durations.fast,
      ease: easings.sharp,
    },
  },
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Button animations
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: easings.sharp,
    },
  },
};

// Modal/Popup animations
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.bounce,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: durations.fast,
      ease: easings.sharp,
    },
  },
};

// Backdrop animations
export const backdropVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: durations.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
};

// Slide animations
export const slideVariants = {
  fromLeft: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  fromRight: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fromTop: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  fromBottom: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
} as const;

// Icon animations
export const iconVariants: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: 0.1,
    },
  },
};

// Fade animations
export const fadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: durations.normal,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
};

// Loading animations
export const loadingVariants: Variants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Notification animations
export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.bounce,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: {
      duration: durations.fast,
      ease: easings.sharp,
    },
  },
};

// Grid animations for product grids
export const gridItemVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
};

// Header animations
export const headerVariants: Variants = {
  initial: {
    y: -100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
};

// Sidebar animations
export const sidebarVariants: Variants = {
  initial: {
    x: -300,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    },
  },
  exit: {
    x: -300,
    opacity: 0,
    transition: {
      duration: durations.fast,
      ease: easings.sharp,
    },
  },
};

// Floating action button animations
export const fabVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: durations.normal,
      ease: easings.bounce,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: durations.fast,
      ease: easings.smooth,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: 0.1,
    },
  },
};

// Common transitions
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: durations.normal,
  ease: easings.smooth,
};

// Utility function to create custom variants
export const createVariants = (
  initial: Record<string, any>,
  animate: Record<string, any>,
  exit?: Record<string, any>
): Variants => ({
  initial,
  animate,
  ...(exit && { exit }),
});

// Utility function for stagger animations
export const createStaggerVariants = (
  staggerDelay: number = 0.1,
  delayChildren: number = 0
): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

// Utility functions
export const createSpringTransition = (stiffness = 300, damping = 30) => ({
  type: "spring" as const,
  stiffness,
  damping,
});

export const createEaseTransition = (
  duration = 0.3,
  ease = [0.4, 0, 0.2, 1] as number[]
) => ({
  duration,
  ease,
});

export const getRandomDelay = (min = 0, max = 0.5) =>
  Math.random() * (max - min) + min;

// Re-export utility components and hooks
export * from "./components";
export * from "./hooks";
export * from "./utils";
