import {
  BallLoading,
  Button,
  Card,
  CircleLoading,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { StoreOverview } from "./StoreOverview";
import photoStore3d from "../../assets/3d-store-icon.png";
import {
  Route,
  Switch,
  useLocation,
  useHistory,
  useParams,
} from "react-router";
import {
  setTemp,
  useUser,
  setFieldValue,
  execAction,
  showToast,
  useAction,
} from "@biqpod/app/ui/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DAYS_LEFT, userTabs } from "../../utils";
import { tw } from "@biqpod/app/ui/utils";
import { Integrations } from "../../Integrations";
import { ProductsAndBrands } from "./components/ProductsAndBrands";
import { OrdersAndCustomers } from "./components/OrdersAndCustomers";
import { StoreConfiguration } from "./components/StoreConfiguration";
import { motion, AnimatePresence } from "framer-motion";
import { Plans } from "../App/Plans";
import { useUsedBy } from "./Stores";
import pageNotFound from "../../assets/page-not-found.png";
import { Templates } from "./Templates";
import { getTextSide, useCurrentPayments } from "../../hooks/usePayments";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { useStoreVisit } from "../../hooks/useStoreVisit";
import { Agres } from "./Agres";
import { Biqpod } from "@biqpod/app/ui/types";
import { useEffectDelay } from "@biqpod/app/ui/shared";
const TellSupport = () => {
  const user = useUser();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  return (
    <div
      hidden
      className="bottom-6 left-6 z-[1000000000000000000] absolute max-w-[360px]"
    >
      <Card>
        <div className="p-2">
          <h3 className="font-semibold text-2xl capitalize">
            <Translate content="tell support" />
          </h3>
        </div>
        <Line />
        <div className="p-2">
          <p className="text-[--biqpod-gray-opacity-2] text-sm">
            <Translate content="which platform did you hear about snapbuy?" />
          </p>
        </div>
        <Line />
        <div className="flex flex-wrap justify-center gap-2 p-2">
          {[
            {
              id: "facebook",
              label: "Facebook",
              icon: allIcons.brands.faFacebook,
            },
            {
              id: "youtube",
              label: "YouTube",
              icon: allIcons.brands.faYoutube,
            },
            {
              id: "tiktok",
              label: "TikTok",
              icon: allIcons.brands.faTiktok,
            },
            {
              id: "instagram",
              label: "Instagram",
              icon: allIcons.brands.faInstagram,
            },
            {
              id: "messenger",
              label: "Messenger",
              icon: allIcons.brands.faFacebookMessenger,
            },
            {
              id: "twitter",
              label: "Twitter",
              icon: allIcons.brands.faTwitter,
            },
            {
              id: "search",
              label: "search",
              icon: allIcons.solid.faMagnifyingGlass,
            },
            {
              id: "other",
              label: "Other",
              icon: allIcons.solid.faQuestion,
            },
          ].map((p) => (
            <Button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={tw(
                "rounded-full w-fit px-3 py-1 text-sm",
                selectedPlatform !== p.id &&
                  "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]",
                selectedPlatform === p.id &&
                  "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
              )}
              icon={p.icon}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Line />
        {selectedPlatform === "other" && (
          <EmptyComponent>
            <div className="p-2">
              <Field
                inputName="support-other"
                className="rounded-xl"
                placeholder="Enter Link Or Name"
              />
            </div>
            <Line />
          </EmptyComponent>
        )}
        <div className="p-2">
          <Button
            onClick={async () => {
              if (!user?.uid) {
                showToast("Please login to send this to support");
                return;
              }
              if (!selectedPlatform) {
                showToast("Please select a platform first");
                return;
              }
              const message = `I heard about SnapBuy from ${selectedPlatform}`;
              setFieldValue("feedback-message", message);
              try {
                await execAction("send-feedback");
                showToast("Sent to support. Thank you!");
                setSelectedPlatform(null);
              } catch (err) {
                showToast("Failed to send. Please try again later.");
              }
            }}
            icon={allIcons.solid.faPaperPlane}
            className="rounded-full"
          >
            <Translate content="send" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
export const Store = () => {
  const loc = useLocation();
  const storeId = useParams<{ storeId: string }>().storeId;
  const user = useUser();
  // Get store data for tracking
  const [storeData, setUserData] = useState<
    Biqpod.Snapbuy.Store | false | null
  >(null);
  useAction(
    "get-current-store",
    async () => {
      if (!storeId) {
        setUserData(false);
        return;
      }
      const data = await snapbuyApi.store.get(storeId);
      setUserData(data || false);
    },
    [storeId]
  );
  useEffectDelay(
    () => {
      execAction("get-current-store");
    },
    [],
    300
  );
  // Track store visit
  useStoreVisit(storeId, storeData || null, user?.uid);
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
  const createRoute = useCallback(
    (...path: string[]) => {
      const result = ["store", storeId, ...path].join("/");
      return "/" + result;
    },
    [storeId]
  );
  const usedBy = useUsedBy(user);
  const currentPayments = useCurrentPayments();
  // Get all active subscriptions
  const paymentsWillExpired = useMemo(() => {
    if (!user) {
      return null;
    }
    if (currentPayments === null) {
      return null;
    }
    const active = [];
    const now = Date.now();
    if (currentPayments && Array.isArray(currentPayments)) {
      for (const payment of currentPayments) {
        if (payment.meta?.endAt) {
          const endTime = Number(payment.meta.endAt);
          const remaining = Math.max(0, endTime - now);
          const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
          if (daysLeft < DAYS_LEFT) {
            active.push({
              daysLeft,
              endDate: new Date(endTime),
              isExpiringSoon: daysLeft <= DAYS_LEFT,
            });
          }
        }
      }
    }
    return active;
  }, [currentPayments, user]);
  const free = useAsyncMemo(async () => {
    return snapbuyApi.getFree();
  }, [storeId]);
  // Calculate limits for all data types
  const limits = useMemo(() => {
    const allLimits: Partial<Record<DataTypes, number>> = {};
    free?.forEach((item) => {
      allLimits[item.type] = item.count;
    });
    if (Array.isArray(currentPayments)) {
      currentPayments.forEach((payment) => {
        if (payment?.meta) {
          (Object.keys(payment.meta) as DataTypes[]).forEach((type) => {
            if (typeof payment.meta?.[type] === "number") {
              allLimits[type] = (allLimits[type] || 0) + payment.meta?.[type];
            }
          });
        }
      });
    }
    return allLimits;
  }, [currentPayments, free]);
  // Get usages for all data types
  const usages = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.get(storeId);
    } else {
      return null;
    }
  }, [storeId, user]);
  const exceededLimits = useMemo(() => {
    const exceeded: { type: DataTypes; usage: number; limit: number }[] = [];
    if (usages && limits) {
      (Object.keys(usages) as DataTypes[]).forEach((type) => {
        const usage = usages[type];
        const limit = limits[type] || 0;
        if (usage !== undefined && usage > limit) {
          exceeded.push({ type, usage, limit });
        }
      });
    }
    return exceeded;
  }, [usages, limits]);
  const showLimitWarning = exceededLimits.length > 0;
  const hist = useHistory();
  const isWillExpired = paymentsWillExpired
    ? paymentsWillExpired.length > 0
    : null;
  const isPlans = useMemo(
    () => loc.pathname === createRoute("plans"),
    [createRoute, loc]
  );
  const showLoading = useMemo(() => {
    return (
      isWillExpired === null ||
      usages === null ||
      limits === null ||
      free === null
    );
  }, [isWillExpired, usages, limits, free]);
  const sideText = getTextSide();
  if (storeData === false) {
    return (
      <motion.div
        className="flex flex-col justify-center items-center gap-6 p-8 w-full h-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="max-w-md text-center">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeInOut",
              }}
            >
              <img src={photoStore3d} />
            </motion.div>
            <Line />
            <div className="flex flex-col gap-2 p-3">
              <h1 className="font-bold text-3xl capitalize">
                <Translate content="store not found" />
              </h1>
              <p className="text-[--biqpod-gray-opacity-2]">
                <Translate content="the store you're looking for doesn't exist or has been removed" />
              </p>
            </div>
            <Line />
            <div className="p-3">
              <Button
                onClick={() => {
                  hist.push("/store");
                }}
                icon={allIcons.solid.faArrowLeft}
                className="rounded-full w-full"
              >
                <Translate content="back to stores" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }
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
  const isAgres = storeData && storeData.agres;
  return (
    <div className="flex gap-1 h-full">
      {isAgres && (
        <EmptyComponent>
          {!showLoading && (
            <div className="flex flex-col justify-center items-center h-full">
              <AnimatePresence>
                <div
                  key="side-text"
                  className="flex justify-center items-center h-full"
                >
                  {sideText && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                        height: 0,
                        rotate: 180,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        height: "auto",
                        rotate: 180,
                      }}
                      exit={{ opacity: 0, scale: 0.8, height: 0, rotate: 180 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex flex-col items-center gap-3 bg-[--biqpod-primary] px-2 py-4 rounded-full text-[--biqpod-primary-content] text-nowrap transform"
                    >
                      <Icon
                        className="animate-spin"
                        icon={allIcons.solid.faSpinner}
                      />
                      <p
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "revert",
                        }}
                      >
                        <Translate content={sideText} />
                      </p>
                    </motion.div>
                  )}
                </div>
                <motion.div
                  key="user-tabs"
                  className="inline-flex flex-col gap-2 bg-[--biqpod-primary-background] p-2 border-[--biqpod-borders] border-y border-r border-solid rounded-se-3xl rounded-ee-3xl"
                >
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
                </motion.div>
                <div className="h-full" />
              </AnimatePresence>
            </div>
          )}
          <div className="relative flex flex-col bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full h-full overflow-hidden">
            <AnimatePresence>
              {!showLoading && isWillExpired && !isPlans && (
                <EmptyComponent key="expired-warning">
                  <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      height: { duration: 0.3 },
                    }}
                    className="overflow-hidden"
                  >
                    <div
                      className="relative bg-yellow-400/15 px-4 py-3 border text-yellow-600"
                      role="alert"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex justify-between items-center"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="block sm:inline font-medium capitalize">
                            <Translate content="there are some active subscriptions will expire soon" />
                          </span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        >
                          <Link to={createRoute("plans")}>
                            <Button className="bg-yellow-600">
                              <Translate content="manage" />
                            </Button>
                          </Link>
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                  <Line />
                </EmptyComponent>
              )}
            </AnimatePresence>
            {showLoading && (
              <div className="flex justify-center items-center gap-2 w-full h-full">
                <span className="text-2xl capitalize">
                  <Translate content="checking subscription" />
                </span>
                <BallLoading ballClassName="w-[15px] h-[15px]" />
              </div>
            )}
            {!showLoading && (
              <EmptyComponent>
                {(!showLimitWarning || isPlans) && (
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
                      <Route path={createRoute("templates")}>
                        <Templates />
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
                )}
                {!isPlans && showLimitWarning && (
                  <div className="flex flex-col justify-center items-center h-full">
                    <Card className="max-w-[80%]">
                      <h1 className="p-4 text-2xl capitalize">
                        <Translate content="subscription limit exceeded" />
                      </h1>
                      <Line />
                      <p className="p-4">
                        Your store has exceeded limits for:{" "}
                        {exceededLimits
                          .map((e) => `${e.type} (${e.usage}/${e.limit})`)
                          .join(", ")}
                        . Please choose an action.
                      </p>
                      <Line />
                      <div className="flex gap-2 p-4">
                        <Button
                          onClick={() => {
                            hist.push(createRoute("plans"));
                          }}
                          icon={allIcons.solid.faRotate}
                        >
                          <Translate content="renew subscription" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </EmptyComponent>
            )}
          </div>
        </EmptyComponent>
      )}
      {!isAgres && <Agres />}
      {/* Support quick feedback: where did you hear about SnapBuy? */}
      {!showLoading && <TellSupport />}
    </div>
  );
};
