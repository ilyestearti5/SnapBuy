import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  isLoading,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { delay, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../apis";
import { UpsertTemplate } from "./UpsertTemplate";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    y: 20,
    scale: 0.95,
    rotateY: -5,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -8,
    scale: 1.03,
    rotateY: 2,
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    transition: {
      duration: 0.3,
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    rotateY: 5,
    transition: {
      duration: 0.4,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const emptyStateVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      duration: 0.6,
      delay: 0.3,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.2,
    },
  },
};

const loadingVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
    },
  }),
};

const templateCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    rotateY: -5,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -8,
    scale: 1.03,
    rotateY: 2,
    transition: {
      duration: 0.3,
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    rotateY: 5,
    transition: {
      duration: 0.4,
    },
  },
};

const templateListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const DeveloperRoute = () => {
  const deleteAction = useAction(
    "delete-template",
    async (templateId: string) => {
      await snapbuyApi.templates.delete(templateId);
      showToast("Template deleted successfully", "success");
      execAction("refresh-templates");
    },
    []
  );
  const templates = useCopyState<Snapbuy.Template[]>([]);
  const refreshAction = useAction(
    "refresh-templates",
    async () => {
      await delay(100); // Small delay to allow for state updates
      const result = await snapbuyApi.templates.getMyList();
      templates.set(result);
    },
    []
  );
  useEffect(() => {
    execAction("refresh-templates");
  }, []);
  const loading = isLoading(deleteAction) || isLoading(refreshAction);
  return (
    <Scroll>
      <motion.div
        className="flex flex-col gap-2 p-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="overflow-hidden">
            <motion.div
              className="flex justify-between items-center p-4"
              variants={headerVariants}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.h1
                  className="font-bold text-2xl capitalize"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Translate content="developer templates" />
                </motion.h1>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Translate content="manage your custom templates" />
                </motion.p>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <CircleTip
                    icon={allIcons.solid.faRefresh}
                    onClick={() => {
                      execAction("refresh-templates");
                    }}
                    className={tw(loading && "animate-spin")}
                  />
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    icon={allIcons.solid.faPlus}
                    onClick={() => {
                      showPopup(<UpsertTemplate />);
                    }}
                    className="rounded-full"
                  >
                    <Translate content="create template" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </Card>
        </motion.div>
        <AnimatePresence>
          {loading && (
            <motion.div
              className="flex flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={index}
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  custom={index}
                >
                  <CardWait className="rounded-xl w-full h-[120px]" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!loading && templates && templates.get.length === 0 && (
            <motion.div
              variants={emptyStateVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="flex flex-col justify-center items-center gap-4 p-8">
                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <Icon
                    icon={allIcons.solid.faCode}
                    iconClassName="text-5xl text-[--biqpod-gray-opacity-2]"
                  />
                </motion.div>
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <motion.h2
                    className="text-[--biqpod-gray-opacity-2] font-bold text-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <Translate content="no templates found" />
                  </motion.h2>
                  <motion.p
                    className="text-[--biqpod-gray-opacity-2]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <Translate content="create your first template to get started" />
                  </motion.p>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    icon={allIcons.solid.faPlus}
                    onClick={() => {
                      showPopup(<UpsertTemplate />);
                    }}
                    className="rounded-full"
                  >
                    <Translate content="create template" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!loading && templates && templates.get.length > 0 && (
            <motion.div
              className="flex flex-col gap-2"
              variants={templateListVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {templates.get.map((template) => (
                <motion.div
                  key={template.id}
                  variants={templateCardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  layout
                >
                  <Card className="overflow-hidden">
                    <div className="flex justify-between items-start p-4">
                      {template.photo && (
                        <motion.div
                          className="flex-shrink-0 mr-4"
                          initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          transition={{
                            delay: 0.2,
                            duration: 0.5,
                            type: "spring",
                          }}
                        >
                          <Image
                            src={template.photo}
                            alt={template.name || "Template"}
                            className="rounded-lg w-[120px] h-[80px] object-cover"
                          />
                        </motion.div>
                      )}
                      <motion.div
                        className="flex-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <motion.div
                          className="flex items-center gap-2 mb-2"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                        >
                          <h3 className="font-bold text-lg capitalize">
                            {template.name || "Untitled Template"}
                          </h3>
                          {template.status === "accepted" && (
                            <Icon
                              icon={allIcons.solid.faCheckCircle}
                              iconClassName="text-[--biqpod-success] text-sm"
                            />
                          )}
                          {!template.status && (
                            <Icon
                              icon={allIcons.solid.faClock}
                              iconClassName="text-[--biqpod-warning] text-sm"
                            />
                          )}
                        </motion.div>
                        <p className="text-[--biqpod-gray-opacity-2] mb-2">
                          {template.description || "No description provided"}
                        </p>
                        {template.url && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon icon={allIcons.solid.faLink} />
                            <a
                              href={template.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[--biqpod-primary] hover:underline truncate"
                            >
                              {template.url}
                            </a>
                          </div>
                        )}
                        {template.createdAt && (
                          <p className="text-[--biqpod-gray-opacity-2] mt-2 text-xs">
                            <Translate content="created" />:{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </motion.div>
                    </div>
                    <Line />
                    <motion.div
                      className="flex justify-evenly items-center gap-2 p-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          icon={allIcons.solid.faPen}
                          onClick={() => {
                            showPopup(<UpsertTemplate template={template} />);
                          }}
                          className="bg-[--biqpod-primary] px-3 py-2 rounded-full w-fit text-white"
                        >
                          <Translate content="edit" />
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          icon={allIcons.solid.faTrash}
                          onClick={async () => {
                            const response = await confirm({
                              title: "Delete Template",
                              message: `Are you sure you want to delete "${
                                template.name || "this template"
                              }"?`,
                            });
                            if (response) {
                              execAction("delete-template", template.id!);
                            }
                          }}
                          className="bg-[--biqpod-danger] px-3 py-2 rounded-full w-fit text-white"
                        >
                          <Translate content="delete" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Scroll>
  );
};
