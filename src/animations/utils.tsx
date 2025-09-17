/**
 * Global animation utilities and higher-order components
 */

import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, forwardRef } from "react";
import { cardVariants, fadeVariants, gridItemVariants } from "./index";

/**
 * Auto-animate component that triggers animations when in view
 */
interface AutoAnimateProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  variant?: "fade" | "card" | "grid";
  delay?: number;
}

export const AutoAnimate = forwardRef<HTMLDivElement, AutoAnimateProps>(
  (
    { children, className, threshold = 0.1, variant = "fade", delay = 0 },
    ref
  ) => {
    const internalRef = useRef(null);
    const targetRef = ref || internalRef;
    const isInView = useInView(targetRef as React.RefObject<Element>, {
      amount: threshold,
      once: true,
    });
    const controls = useAnimation();

    const variants = {
      fade: fadeVariants,
      card: cardVariants,
      grid: gridItemVariants,
    }[variant];

    useEffect(() => {
      if (isInView) {
        const timer = setTimeout(() => {
          controls.start("animate");
        }, delay * 1000);

        return () => clearTimeout(timer);
      }
    }, [isInView, controls, delay]);

    return (
      <motion.div
        ref={targetRef}
        className={className}
        variants={variants}
        initial="initial"
        animate={controls}
      >
        {children}
      </motion.div>
    );
  }
);

AutoAnimate.displayName = "AutoAnimate";

/**
 * Sequential animation component for lists
 */
interface SequentialAnimateProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  threshold?: number;
}

export const SequentialAnimate = ({
  children,
  className,
  staggerDelay = 0.1,
  threshold = 0.1,
}: SequentialAnimateProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      children.forEach((_, index) => {
        setTimeout(() => {
          controls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          });
        }, index * staggerDelay * 1000);
      });
    }
  }, [isInView, children, staggerDelay, controls]);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          custom={index}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Bouncy number animation for counters
 */
interface BouncyNumberProps {
  value: number | string;
  className?: string;
  delay?: number;
}

export const BouncyNumber = ({
  value,
  className,
  delay = 0,
}: BouncyNumberProps) => {
  return (
    <motion.span
      key={value}
      className={className}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {value}
    </motion.span>
  );
};

/**
 * Loading dots animation
 */
export const LoadingDots = ({ className }: { className?: string }) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="bg-current rounded-full w-2 h-2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Floating action button with entrance animation
 */
interface FloatingButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export const FloatingButton = ({
  children,
  className,
  onClick,
  delay = 0.5,
}: FloatingButtonProps) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {children}
    </motion.button>
  );
};

/**
 * Slide up reveal animation
 */
interface SlideUpRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SlideUpReveal = ({
  children,
  className,
  delay = 0,
}: SlideUpRevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.1, once: true });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Staggered grid animation
 */
interface StaggeredGridProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  columns?: number;
}

export const StaggeredGrid = ({
  children,
  className,
  staggerDelay = 0.1,
  columns = 3,
}: StaggeredGridProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.1, once: true });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "1rem",
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }
              : {
                  opacity: 0,
                  scale: 0.8,
                  y: 20,
                }
          }
          transition={{
            delay: index * staggerDelay,
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
          whileHover={{ scale: 1.03, y: -5 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Typewriter text animation
 */
interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export const Typewriter = ({
  text,
  className,
  speed = 50,
  delay = 0,
}: TypewriterProps) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: delay + (index * speed) / 1000,
            duration: 0.1,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};
