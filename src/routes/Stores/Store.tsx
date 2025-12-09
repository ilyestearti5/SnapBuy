import {
  BallLoading,
  Button,
  Card,
  CircleLoading,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { StoreOverview } from "./StoreOverview";
import {
  Route,
  Switch,
  useLocation,
  useHistory,
  useParams,
} from "react-router";
import { setTemp, useUser } from "@biqpod/app/ui/hooks";
import { useCallback, useEffect, useMemo } from "react";
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
import { useCurrentPayments } from "../../hooks/usePayments";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import type { DataTypes } from "../../apis";
import { useStoreVisit } from "../../hooks/useStoreVisit";
export const Store = () => {
  const loc = useLocation();
  const storeId = useParams<{ storeId: string }>().storeId;
  const user = useUser();
  // Get store data for tracking
  const storeData = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.store.get(storeId);
  }, [storeId]);
  // Track store visit
  useStoreVisit(storeId, storeData, user?.uid);
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
              isExpiringSoon: daysLeft <= 30,
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
        console.log({
          type,
          limit,
          usage,
        });
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
      {!showLoading && (
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
      )}
      <div className="relative flex flex-col bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full h-full overflow-hidden">
        <AnimatePresence>
          {!showLoading && isWillExpired && !isPlans && (
            <EmptyComponent>
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
    </div>
  );
};
