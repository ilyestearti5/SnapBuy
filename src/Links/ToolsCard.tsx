import { allIcons } from "@biqpod/app/ui/apis";
import { Card, CircleTip } from "@biqpod/app/ui/components";
import { getTemp, showPopup } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import { useUsedBy } from "../routes/Stores/Stores";
import { UpsertProduct } from "./NewProduct/NewProduct";
import { ImportExportPopup } from "./Import";

export const ToolsCard = memo(
  ({
    showTools,
    onToggleTools,
    onStartSelection,
  }: {
    showTools: boolean;
    onToggleTools: () => void;
    onStartSelection: () => void;
  }) => {
    const usedBy = useUsedBy();
    const isSelectionMode = getTemp<boolean>("is-selection-mode");
    return (
      <motion.div
        drag
        dragMomentum={false}
        layout
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5,
        }}
      >
        <Card
          motionProps={{
            initial: { opacity: 0, y: 20, scale: 0.9, height: "auto" },
            animate: {
              opacity: 1,
              y: 0,
              scale: 1,
              height: showTools ? "auto" : 60,
              transition: {
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { type: "spring", stiffness: 400, damping: 25 },
                y: { type: "spring", stiffness: 400, damping: 25 },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              },
            },
            exit: { opacity: 0, y: 20, scale: 0.9, height: 60 },
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.3,
            },
            whileHover: {
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            },
            whileTap: { scale: 0.98 },
            layout: true,
          }}
          enableAnimations
          className="flex flex-col items-center bg-[--biqpod-gray-opacity] shadow-2xl backdrop-blur-sm p-3 border-0 rounded-3xl overflow-hidden"
        >
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.1,
                    },
                  },
                }}
                className="flex flex-col gap-2"
              >
                {usedBy !== "read" && (
                  <motion.div
                    variants={{
                      hidden: { scale: 0, opacity: 0, y: 20 },
                      visible: { scale: 1, opacity: 1, y: 0 },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    {!isSelectionMode && (
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <CircleTip
                          icon={allIcons.solid.faListCheck}
                          className="text-orange-600 hover:text-orange-700 transition-colors duration-200"
                          onClick={() => {
                            onStartSelection();
                          }}
                        />
                      </motion.div>
                    )}
                    {/* Import Button */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      variants={{
                        hidden: { scale: 0, opacity: 0, y: 20 },
                        visible: { scale: 1, opacity: 1, y: 0 },
                      }}
                    >
                      <CircleTip
                        icon={allIcons.solid.faFileImport}
                        className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        onClick={() => {
                          showPopup(<ImportExportPopup mode="import" />);
                        }}
                      />
                    </motion.div>
                    {/* Export Button */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      variants={{
                        hidden: { scale: 0, opacity: 0, y: 20 },
                        visible: { scale: 1, opacity: 1, y: 0 },
                      }}
                    >
                      <CircleTip
                        icon={allIcons.solid.faFileExport}
                        className="text-purple-600 hover:text-purple-700 transition-colors duration-200"
                        onClick={() => {
                          showPopup(<ImportExportPopup mode="export" />);
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
                {usedBy !== "read" && (
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    variants={{
                      hidden: { scale: 0, opacity: 0, y: 20 },
                      visible: { scale: 1, opacity: 1, y: 0 },
                    }}
                  >
                    <CircleTip
                      icon={allIcons.solid.faPlus}
                      className="text-violet-500 hover:text-violet-600 transition-colors duration-200"
                      onClick={async () => {
                        showPopup(<UpsertProduct />);
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <CircleTip
              onClick={onToggleTools}
              icon={allIcons.solid.faPlus}
              className={tw(
                "transition-transform duration-300 ease-in-out",
                showTools ? "rotate-45" : "rotate-0"
              )}
            />
          </div>
        </Card>
      </motion.div>
    );
  }
);
