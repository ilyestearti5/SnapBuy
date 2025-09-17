import {
  Card,
  CircleLoading,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../../apis";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const headerVariants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.1,
    },
  },
};

const actionItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.01,
    x: 5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const loadingVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.3,
    },
  },
};

const titleVariants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 250,
      damping: 20,
    },
  },
};

const descriptionVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      delay: 0.1,
    },
  },
};

export const OffersPage = () => {
  const actions = useAsyncMemo(async () => {
    return snapbuyApi.getAIActions();
  }, []);
  return (
    <Scroll>
      <motion.div
        className="flex flex-col gap-2 p-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants} whileHover="hover">
          <Card>
            <motion.div
              className="p-3"
              variants={headerVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="font-bold text-2xl capitalize">
                <Translate content="ai actions" />
              </h1>
            </motion.div>
            <Line />
            <div>
              {actions === null && (
                <motion.div
                  className="flex justify-center items-center p-2"
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div>
                    <CircleLoading />
                  </div>
                </motion.div>
              )}
              <AnimatePresence>
                {actions?.map(({ name, description }, index) => (
                  <motion.div
                    key={name}
                    variants={actionItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    whileHover="hover"
                    custom={index}
                    className="odd:bg-[--biqpod-primary-background] p-2"
                  >
                    <motion.h2
                      className="font-semibold text-[--biqpod-primary] text-xl capitalize"
                      variants={titleVariants}
                    >
                      {name.replaceAll(/_+/gi, " ")}
                    </motion.h2>
                    <motion.p variants={descriptionVariants}>
                      {description}
                    </motion.p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </Scroll>
  );
};
