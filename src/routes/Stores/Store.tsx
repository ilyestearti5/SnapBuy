import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  Icon,
  Line,
  Scroll,
  Translate,
  UserAvatar,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { StoreOverview } from "./StoreOverview";
import { Route, Switch, useLocation, useParams } from "react-router";
import {
  execAction,
  isLoading,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { userTabs, useStoreId } from "../../utils";
import { mapAsync, tw } from "@biqpod/app/ui/utils";
import { Integrations } from "../../Integrations";
import { ProductsAndBrands } from "./components/ProductsAndBrands";
import { OrdersAndCustomers } from "./components/OrdersAndCustomers";
import { StoreConfiguration } from "./components/StoreConfiguration";
import { getUserFunction } from "@biqpod/app/ui/apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion } from "framer-motion";
import { isAccountLinkedWithDrive, snapbuyApi } from "../../apis";
import { useState } from "react";
import { Plans } from "../App/Plans";
import { useUsedBy } from "./Stores";
import pageNotFound from "../../assets/page-not-found.png";
export const DriveTransform = () => {
  const storeId = useStoreId();
  const [currentSync, setCurrentSync] = useState<{
    type: string;
    item: string;
  } | null>(null);
  const action = useAction(
    "sync-photos-in-document",
    async (documentId: string) => {
      if (!storeId) return;
      setCurrentSync({ type: "store", item: "Store" });
      await snapbuyApi.syncPhotosInDocument("store", storeId, documentId);
      const products = await snapbuyApi.getProductsOf(storeId);
      await mapAsync(products || [], async (product) => {
        setCurrentSync({ type: "product", item: product.name || product.id! });
        await snapbuyApi.syncPhotosInDocument(
          "product",
          product.id!,
          documentId
        );
      });
      const brands = await snapbuyApi.getAllBrands(storeId);
      await mapAsync(brands || [], async (brand) => {
        setCurrentSync({ type: "brand", item: brand.name || brand.id! });
        await snapbuyApi.syncPhotosInDocument("brand", brand.id!, documentId);
      });
      const collections = await snapbuyApi.getCollections(storeId);
      await mapAsync(collections || [], async (collection) => {
        setCurrentSync({
          type: "collection",
          item: collection.name || collection.id!,
        });
        await snapbuyApi.syncPhotosInDocument(
          "collection",
          collection.id!,
          documentId
        );
      });
      setCurrentSync(null);
      showToast(
        "Sync started in background" +
          (products?.length ? ` for ${products.length} products` : "")
      );
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
        {loading && currentSync && (
          <div className="mb-3 text-center">
            <Translate
              content={`Syncing photos for ${currentSync.type}: ${currentSync.item}`}
            />
          </div>
        )}
        <Button
          onClick={async () => {
            execAction("sync-photos-in-document");
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
export const googleDriveHref =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png";
export const Store = () => {
  const loc = useLocation();
  const storeId = useParams<{ storeId: string }>().storeId;
  const selectedTab = userTabs.find(
    (item) => item.link.replaceAll(`{storeId}`, storeId) === loc.pathname
  );
  // Find current tab index
  useEffect(() => {
    setTemp("selectedTab", selectedTab);
  }, [selectedTab]);
  useEffect(() => {
    return () => {
      setTemp("selectedTab", null);
    };
  }, []);
  const createRoute = (...path: string[]) => {
    const result = ["store", ":storeId", ...path].join("/");
    return "/" + result;
  };
  const user = useUser();
  const usedBy = useUsedBy(user);

  useAsyncEffect(async () => {
    if (!usedBy) {
      return;
    }
    if (usedBy != "owned") {
      return;
    }
    const isLinked = await isAccountLinkedWithDrive();
    if (!isLinked) showPopup(<DriveConnect />);
    // else showPopup(<DriveTransform />);
  }, [user, usedBy]);

  if (!usedBy) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full">
        <CircleLoading />
      </div>
    );
  }

  if (usedBy === "random") {
    return (
      <motion.div
        className="flex justify-center items-center w-full h-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <img
          src={pageNotFound}
          draggable={false}
          alt="404 - Page Not Found"
          className="max-w-full max-h-full object-contain"
        />
      </motion.div>
    );
  }

  return (
    <div className="flex gap-1 h-full">
      <div className="flex items-center h-full">
        <div className="inline-flex flex-col gap-2 bg-[--biqpod-primary-background] p-2 border-[--biqpod-borders] border-y border-r border-solid rounded-se-3xl rounded-ee-3xl">
          {userTabs.map((item, index) => {
            const link = item.link.replaceAll(`{storeId}`, storeId);
            const isSelected = loc.pathname === link;
            return (
              <Link to={link} key={index}>
                <Button
                  className={tw(
                    "rounded-full  w-[50px] h-[50px]",
                    !isSelected &&
                      "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                  )}
                  iconClassName="text-xl"
                >
                  <img src={item.photo} className="w-full" />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="relative bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full h-full overflow-hidden">
        <Scroll>
          <Switch>
            <Route path={createRoute("sales")}>
              <OrdersAndCustomers />
            </Route>
            <Route path={createRoute("catalog")}>
              <ProductsAndBrands />
            </Route>
            <Route path={createRoute("dashboard")}>
              <StoreOverview />
            </Route>
            <Route path={createRoute("configuration")}>
              <StoreConfiguration />
            </Route>
            <Route path={createRoute("integrations")}>
              <Integrations />
            </Route>
            <Route path={createRoute("plans")}>
              <Plans />
            </Route>
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
