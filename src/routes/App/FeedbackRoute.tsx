import { allIcons } from "@biqpod/app/ui/apis";
import {
  Translate,
  Button,
  EmptyComponent,
  Icon,
  Line,
  Card,
} from "@biqpod/app/ui/components";
import {
  langHooks,
  openMenu,
  showBottomSheet,
  useDeviceResolution,
} from "@biqpod/app/ui/hooks";
import { MenuRecordProps } from "@biqpod/app/ui/types";
import { motion, AnimatePresence } from "framer-motion";
import image from "../../assets/feeds-background.png";
import { useMemo } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      duration: 0.6,
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

const imageVariants = {
  hidden: {
    opacity: 0,
    scale: 1.1,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
      duration: 0.8,
    },
  },
};

const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      delay: 0.3,
    },
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const bottomSheetVariants = {
  hidden: {
    opacity: 0,
    y: 100,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: {
      duration: 0.3,
    },
  },
};

const menuItemVariants = {
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
    scale: 1.02,
    x: 5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
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
      stiffness: 250,
      damping: 20,
    },
  },
};

export const useWords = () => {
  const langs = langHooks.getAll();
  const words = useMemo(() => {
    return langs.map((lang) => {
      return lang.word;
    });
  }, [langs]);
  return words;
};
export const FeedbackRoute = () => {
  const { isMobile } = useDeviceResolution();
  return (
    <motion.div
      className="flex justify-center items-center w-full h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants} whileHover="hover">
        <Card className="relative max-w-[80vw] overflow-hidden">
          <motion.img draggable={false} src={image} variants={imageVariants} />
          <Line />
          <div className="flex justify-center items-center p-2">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                className="p-3 rounded-full w-fit"
                onClick={({ clientX, clientY }) => {
                  const menu: MenuRecordProps[] = [
                    {
                      name: "Messenger",
                      icon: allIcons.brands.faFacebookMessenger,
                      link: "https://web.facebook.com/messages/t/503063686232064",
                    },
                    {
                      name: "Twitter",
                      icon: allIcons.brands.faTwitter,
                      link: "https://x.com/ilyestearti5",
                    },
                    {
                      name: "Instagram",
                      icon: allIcons.brands.faInstagram,
                      link: "https://www.instagram.com/biqpod/",
                    },
                    {
                      name: "Discord",
                      icon: allIcons.brands.faDiscord,
                      link: "https://discord.gg/Nb6wwXyj",
                    },
                    {
                      name: "Snapchat",
                      icon: allIcons.brands.faSnapchatGhost,
                      link: "https://www.snapchat.com/add/tiartiilyes",
                    },
                    {
                      name: "TikTok",
                      icon: allIcons.brands.faTiktok,
                      link: "https://www.tiktok.com/@biqpod",
                    },
                  ].map(({ name, icon, link }) => {
                    return {
                      label: name,
                      defaultIcon: icon,
                      click: () => {
                        const anchor = document.createElement("a");
                        anchor.href = link;
                        anchor.target = "_blank";
                        anchor.click();
                      },
                    };
                  });
                  if (isMobile) {
                    showBottomSheet(
                      <motion.div
                        variants={bottomSheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <EmptyComponent>
                          <motion.div className="p-2" variants={headerVariants}>
                            <h1 className="font-bold text-3xl uppercase">
                              <Translate content="send feedback" />
                            </h1>
                          </motion.div>
                          <Line />
                          <AnimatePresence>
                            {menu.map(({ label, defaultIcon, click }) => {
                              return (
                                <motion.div
                                  key={label}
                                  variants={menuItemVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                  className="flex items-center gap-2 hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] p-2 text-xl cursor-pointer"
                                  onClick={() => click?.()}
                                >
                                  <div className="flex justify-center w-[40px]">
                                    <Icon icon={defaultIcon} />
                                  </div>
                                  <h1>
                                    {label && <Translate content={label} />}
                                  </h1>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </EmptyComponent>
                      </motion.div>
                    );
                    return;
                  }
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu,
                  });
                }}
              >
                <Translate content="send feedback" />
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
