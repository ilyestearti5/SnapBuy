import { allIcons, getUserFunction } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Translate,
  Button,
  UserAvatar,
  Line,
  Icon,
} from "@biqpod/app/ui/components";
import {
  useAction,
  showToast,
  isLoading,
  execAction,
  useUser,
} from "@biqpod/app/ui/hooks";
import { motion } from "framer-motion";
import { useState } from "react";
import { googleDriveHref } from "./Store";
import { snapbuyApi } from "../../apis";
export const DriveTransform = () => {
  const [syncMessage, setSyncMessage] = useState("");
  const action = useAction(
    "sync-data",
    async () => {
      setSyncMessage("Syncing products data...");
      await snapbuyApi.syncProductsData();
      setSyncMessage("Syncing brands data...");
      await snapbuyApi.syncBrandsData();
      setSyncMessage("Syncing collections data...");
      await snapbuyApi.syncCollectionsData();
      setSyncMessage("Syncing stores data...");
      await snapbuyApi.syncStoresData();
      setSyncMessage("");
    },
    []
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[60vw] max-md:h-full">
      <CardHeaderForPopup title="Transform Drive" />
      <Line />
      <div className="flex flex-col justify-center items-center gap-12 p-3 h-full">
        <img src={googleDriveHref} className="h-[100px]" />
        {/* Animated Connection Design */}
        <div className="flex justify-center items-center mx-3">
          <motion.div
            className="relative flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Connection Line */}
            <motion.div className="relative">
              <div className="bg-gray-300 rounded-full w-40 h-[4px]" />
              <motion.div
                className="top-0 absolute bg-[--biqpod-primary] rounded-full h-[4px]"
                initial={{ width: 0, left: 0 }}
                animate={{
                  width: ["0%", "100%", "0%"],
                  left: ["0%", "0%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
              />
              {/* Moving data icons */}
              <motion.div
                className="-top-6 absolute"
                animate={{
                  x: [0, 160, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 0,
                }}
              >
                <Icon
                  icon={allIcons.solid.faBox}
                  iconClassName="text-lg text-blue-500"
                />
              </motion.div>
              <motion.div
                className="-top-6 absolute"
                animate={{
                  x: [0, 160, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 1,
                }}
              >
                <Icon
                  icon={allIcons.solid.faTag}
                  iconClassName="text-lg text-green-500"
                />
              </motion.div>
              <motion.div
                className="-top-6 absolute"
                animate={{
                  x: [0, 160, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 2,
                }}
              >
                <Icon
                  icon={allIcons.solid.faFolder}
                  iconClassName="text-lg text-purple-500"
                />
              </motion.div>
            </motion.div>
            {/* Second Connection Dot */}
          </motion.div>
        </div>
      </div>
      <Line />
      <div className="p-3">
        {loading && (
          <div className="mb-3 text-center">
            <Translate
              content={
                syncMessage ||
                `Syncing photos for products/brands/collections/store...`
              }
            />
          </div>
        )}
        <Button
          onClick={async () => {
            execAction("sync-data");
          }}
          disabled={loading}
          rightIcon={allIcons.solid.faArrowRight}
        >
          <Translate content="move" />
        </Button>
      </div>
    </Card>
  );
};
export const DriveConnect = () => {
  const user = useUser();
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[60vw] max-md:h-full">
      <CardHeaderForPopup title="Sync Drive" />
      <Line />
      <div className="flex justify-evenly items-center p-3 h-full">
        <img src={googleDriveHref} className="h-[100px]" />
        {/* Animated Connection Design */}
        <div className="flex justify-center items-center mx-3">
          <motion.div
            className="relative flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Connection Line */}
            <motion.div className="relative">
              <div className="bg-gray-300 rounded-full w-12 h-[5px]" />
              <motion.div
                className="top-0 absolute bg-[--biqpod-primary] rounded-full h-[5px]"
                initial={{ width: 0, left: 0 }}
                animate={{
                  width: ["0%", "100%", "0%"],
                  left: ["0%", "0%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
              />
              {/* Pulsing particles */}
              <motion.div
                className="-top-1 absolute bg-[--biqpod-primary] rounded-full w-1 h-1"
                animate={{
                  x: [0, 160, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
              <motion.div
                className="-top-1 absolute bg-[--biqpod-primary] rounded-full w-1 h-1"
                animate={{
                  x: [48, 0, 48],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.0,
                }}
              />
            </motion.div>
            {/* Second Connection Dot */}
          </motion.div>
        </div>
        <UserAvatar user={user} className="w-[100px] h-[100px]" />
      </div>
      <Line />
      <div className="p-3">
        <Button
          onClick={async () => {
            try {
              const fn = await getUserFunction<{ url: string }>("link-account");
              const response = await fn?.({ name: "google-drive" });
              const url = response?.url;
              if (url) {
                const a = document.createElement("a");
                a.href = url.toString();
                a.click();
              }
              showToast("Success");
            } catch {
              showToast("Error");
            }
          }}
        >
          <Translate content="Connect your Google Drive account" />
        </Button>
      </div>
    </Card>
  );
};
