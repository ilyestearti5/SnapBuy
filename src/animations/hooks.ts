/**
 * Custom hooks for animations
 */

import { useAnimation, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Hook for triggering animations when element comes into view
 */
export const useInViewAnimation = (
  threshold: number = 0.1,
  triggerOnce: boolean = true
) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, once: triggerOnce });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("animate");
    } else {
      controls.start("initial");
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

/**
 * Hook for staggered list animations
 */
export const useStaggeredAnimation = (delay: number = 0.1) => {
  const controls = useAnimation();

  const startAnimation = () => {
    controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * delay,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    }));
  };

  return { controls, startAnimation };
};

/**
 * Hook for loading animations
 */
export const useLoadingAnimation = () => {
  const controls = useAnimation();

  const startLoading = () => {
    controls.start({
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.02, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });
  };

  const stopLoading = () => {
    controls.stop();
    controls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    });
  };

  return { controls, startLoading, stopLoading };
};

/**
 * Hook for hover animations with custom scale
 */
export const useHoverAnimation = (scale: number = 1.05) => {
  const controls = useAnimation();

  const handleHoverStart = () => {
    controls.start({
      scale,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    });
  };

  const handleHoverEnd = () => {
    controls.start({
      scale: 1,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
    });
  };

  return { controls, handleHoverStart, handleHoverEnd };
};

/**
 * Hook for sequential animations
 */
export const useSequentialAnimation = () => {
  const controls = useAnimation();

  const playSequence = async (sequence: Array<{ [key: string]: any }>) => {
    for (const step of sequence) {
      await controls.start(step);
    }
  };

  return { controls, playSequence };
};

/**
 * Hook for page transition animations
 */
export const usePageTransition = () => {
  const controls = useAnimation();

  const enterPage = () => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    });
  };

  const exitPage = () => {
    controls.start({
      opacity: 0,
      y: -20,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    });
  };

  return { controls, enterPage, exitPage };
};

/**
 * Hook for modal animations
 */
export const useModalAnimation = () => {
  const controls = useAnimation();

  const openModal = () => {
    controls.start({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.68, -0.55, 0.265, 1.55], // bounce effect
      },
    });
  };

  const closeModal = () => {
    controls.start({
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    });
  };

  return { controls, openModal, closeModal };
};

/**
 * Hook for notification animations
 */
export const useNotificationAnimation = () => {
  const controls = useAnimation();

  const showNotification = () => {
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    });
  };

  const hideNotification = () => {
    controls.start({
      opacity: 0,
      y: -50,
      scale: 0.9,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    });
  };

  return { controls, showNotification, hideNotification };
};
