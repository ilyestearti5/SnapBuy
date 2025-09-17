import { allIcons } from "@biqpod/app/ui/apis";
import {
  CircleTip,
  Scroll,
  Line,
  AsyncComponent,
  CircleLoading,
  Translate,
} from "@biqpod/app/ui/components";
import { delay, tw } from "@biqpod/app/ui/utils";
import { OrderIndex, SnapBuyCollection } from "./Orders/OrderIndex";
import {
  confirm,
  showPopup,
  showToast,
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { useStoreId } from "../utils";
import { UpsertCollection } from "./UpsertCollection";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCard, AutoAnimate, StaggeredGrid } from "../animations";
import { staggerContainer, listItemVariants } from "../animations/index";
const forms: {
  id: SnapBuyCollection["type"];
  name: string;
  description: string;
}[] = [
  {
    id: "product",
    name: "Product",
    description: "Set up a product form to collect product information.",
  },
  {
    id: "order",
    name: "Order",
    description: "Set up an order form to collect order details.",
  },
];
export const Forms = () => {
  const showedForm = useCopyState<SnapBuyCollection["type"] | null>(null);
  const storeId = useStoreId();
  const selectedCollection = useTemp<SnapBuyCollection | null>(
    "props-collection"
  );
  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Scroll>
        <motion.div
          className="flex flex-col gap-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {forms.map((form, index) => {
            const selected = showedForm.get === form.id;
            return (
              <motion.div
                key={index}
                variants={listItemVariants}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <AnimatedCard className="overflow-hidden cursor-pointer">
                  <motion.div
                    className="flex justify-between items-center gap-2 active:bg-[--biqpod-gray-opacity] p-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <AutoAnimate variant="fade" delay={index * 0.1}>
                      <div>
                        <h1 className="font-bold text-xl">
                          <Translate content={form.name} />
                        </h1>
                        <p className="text-[--biqpod-gray-opacity-2]">
                          <Translate content={form.description} />
                        </p>
                      </div>
                    </AutoAnimate>
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <CircleTip
                          icon={allIcons.solid.faPlus}
                          onClick={() => {
                            showPopup(
                              <UpsertCollection
                                onChange={async () => {
                                  const id = form.id;
                                  showedForm.set(null);
                                  await delay(1000); // Simulate loading delay
                                  showedForm.set(id);
                                }}
                                type={form.id}
                              />
                            );
                          }}
                        />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <CircleTip
                          icon={allIcons.solid.faChevronDown}
                          iconClassName={tw(
                            "transition-transform duration-300",
                            selected && "rotate-180"
                          )}
                          onClick={() => {
                            showedForm.set(selected ? null : form.id);
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <Line />
                        <AsyncComponent
                          deps={[form.id]}
                          render={async () => {
                            await delay(1000); // Simulate loading delay
                            // Forms functionality removed
                            const propsCollections: any[] = [];
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <motion.div
                                  className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-3 font-bold uppercase"
                                  whileHover={{
                                    backgroundColor:
                                      "var(--biqpod-gray-opacity)",
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <h1>
                                    <Translate content="default" />
                                  </h1>
                                  <motion.div
                                    className="flex items-center"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <motion.div
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <CircleTip
                                        icon={allIcons.solid.faChevronRight}
                                        onClick={() => {
                                          showedForm.set(null);
                                          selectedCollection.set({
                                            id: form.id + ".default",
                                            name: "Default",
                                            storeId: storeId!,
                                            type: form.id,
                                          });
                                        }}
                                      />
                                    </motion.div>
                                  </motion.div>
                                </motion.div>
                                <StaggeredGrid columns={1} staggerDelay={0.1}>
                                  {propsCollections.map((collection) => {
                                    return (
                                      <motion.div
                                        key={collection.id}
                                        className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-3 font-bold uppercase"
                                        whileHover={{
                                          backgroundColor:
                                            "var(--biqpod-gray-opacity)",
                                        }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <h1>
                                          {collection.name ||
                                            "Untitled Collection"}
                                        </h1>
                                        <motion.div
                                          className="flex items-center"
                                          whileHover={{ scale: 1.05 }}
                                        >
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <CircleTip
                                              icon={allIcons.solid.faTrash}
                                              onClick={async () => {
                                                const response = await confirm({
                                                  title: "Delete Collection",
                                                  message:
                                                    "Are you sure you want to delete this collection?",
                                                  detail:
                                                    "This Gona Delete All Data Related To This Collection",
                                                });
                                                if (!response) {
                                                  return;
                                                }
                                                // Forms functionality removed - cannot delete collections
                                                showToast(
                                                  "Forms functionality has been removed",
                                                  "info"
                                                );
                                                const id = form.id;
                                                showedForm.set(null);
                                                await delay(1000); // Simulate loading delay
                                                showedForm.set(id);
                                              }}
                                            />
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <CircleTip
                                              icon={
                                                allIcons.solid.faChevronRight
                                              }
                                              onClick={() => {
                                                showedForm.set(null);
                                                selectedCollection.set(
                                                  collection
                                                );
                                              }}
                                            />
                                          </motion.div>
                                        </motion.div>
                                      </motion.div>
                                    );
                                  })}
                                </StaggeredGrid>
                              </motion.div>
                            );
                          }}
                          loading={
                            <motion.div
                              className="flex justify-center items-center p-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div
                                animate={{
                                  rotate: 360,
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                <CircleLoading />
                              </motion.div>
                            </motion.div>
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </AnimatedCard>
              </motion.div>
            );
          })}
        </motion.div>
      </Scroll>
      <motion.div
        className={tw(
          "-right-full flex flex-col absolute overflow-hidden bg-[--biqpod-primary-background] inset-y-0 w-full transition-[right] duration-500",
          selectedCollection.get && "right-0"
        )}
        initial={{ x: "100%" }}
        animate={{ x: selectedCollection.get ? 0 : "100%" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="flex items-center gap-2 p-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                selectedCollection.set(null);
              }}
            />
          </motion.div>
          <h1 className="font-bold text-2xl">
            {selectedCollection?.get?.name}
          </h1>
        </motion.div>
        <Line />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <OrderIndex />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
