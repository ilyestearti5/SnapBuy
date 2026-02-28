// components/EcommerceOverview.tsx
import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardWait,
  Icon,
  IconProps,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { showToast, useAsyncMemo } from "@biqpod/app/ui/hooks";
import {
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { snapbuyApi } from "../../apis";
import { range } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AnimatedCard,
  AnimatedListItem,
  FadeIn,
} from "../../animations/components";
import { staggerContainer, loadingVariants } from "../../animations/index";
import { useHistory } from "react-router-dom";
const titlesOveviews: Record<string, string> = {
  totalSales: "Total Sales",
  orders: "Orders",
  customers: "Customers",
};
const iconsOveviews: Record<string, IconProps["icon"]> = {
  totalSales: allIcons.solid.faDollarSign,
  orders: allIcons.solid.faShoppingCart,
  customers: allIcons.solid.faUsers,
};
const iconsColors: Record<string, string> = {
  totalSales: "#10B981", // Changed to green
  orders: "#EF4444", // Changed to red
  customers: "#6366F1", // Changed to indigo
};
export function StoreOverview() {
  const storeId = useStoreId();
  const todayOrders = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.todayOrdersCount(storeId);
  }, [storeId]);
  const salesData = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.getSales(storeId);
  }, [storeId]);
  const overview = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.getOverview(storeId);
  }, [storeId]);
  const hist = useHistory();
  return (
    <Scroll>
      <motion.div
        className="flex flex-wrap gap-4 p-2"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="wait">
          {overview && typeof overview === "object"
            ? Object.entries(overview).map(
                ([name, content]: [string, any], index) => {
                  const title = titlesOveviews[name];
                  const icon = iconsOveviews[name];
                  const color = iconsColors[name];
                  // Handle different data types properly
                  let displayContent = content;
                  if (typeof content === "object" && content !== null) {
                    // If it's an object, try to extract a meaningful value
                    if ("value" in content) {
                      displayContent = content.value;
                    } else if ("count" in content) {
                      displayContent = content.count;
                    } else if ("total" in content) {
                      displayContent = content.total;
                    } else {
                      // Fallback to string representation or 0
                      displayContent = "0";
                    }
                  } else if (content === undefined || content === null) {
                    displayContent = "0";
                  } else {
                    displayContent = String(content);
                  }
                  // Format numbers for better display
                  if (!isNaN(Number(displayContent))) {
                    const num = Number(displayContent);
                    if (name === "totalSales") {
                      // Format as currency
                      displayContent =
                        num
                          .toLocaleString("en-DZ", {
                            style: "currency",
                            currency: "DZD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                          .replace("DZD", "")
                          .trim() + " DA";
                    } else {
                      // Format as regular number
                      displayContent = num.toLocaleString();
                    }
                  }
                  // Ensure we have a valid title and icon
                  if (!title || !icon) {
                    return null;
                  }
                  return (
                    <AnimatedListItem
                      className="max-md:w-full md:w-[200px]"
                      key={name}
                      index={index}
                    >
                      <Card
                        onClick={() => {
                          if (name === "orders") {
                            hist.push(
                              `/store/${storeId}/sales?time=all&status=pending&phone=none`
                            );
                          } else if (name === "totalSales") {
                            if (displayContent == "0") {
                              showToast("No sales yet");
                              return;
                            }
                            hist.push(
                              `/store/${storeId}/sales?time=today&status=completed&phone=none`
                            );
                          }
                        }}
                        className="flex-1 p-3 min-w-[200px] h-[70px] cursor-pointer"
                      >
                        <div className="flex justify-between items-center gap-4 h-full">
                          <div>
                            <p className="text-gray-500 text-sm">
                              <Translate content={title} />
                            </p>
                            <motion.p
                              className="font-semibold text-xl"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.2 + 0.3 }}
                            >
                              {displayContent}
                            </motion.p>
                          </div>
                          <motion.span
                            style={{
                              color,
                            }}
                            className="inline-flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-[40px] h-[40px] text-xl"
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{
                              delay: index * 0.2 + 0.1,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            <Icon icon={icon} />
                          </motion.span>
                        </div>
                      </Card>
                    </AnimatedListItem>
                  );
                }
              )
            : range(3).map((index) => {
                return (
                  <motion.div
                    key={index}
                    variants={loadingVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <CardWait className="flex-1 rounded-2xl min-w-[200px] h-[70px]" />
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </motion.div>
      <div className="flex max-md:flex-col md:items-center p-2">
        <AnimatePresence mode="wait">
          {salesData && (
            <FadeIn className="md:w-2/3">
              <AnimatedCard>
                <h2 className="font-semibold text-lg capitalize">
                  <Translate content="sales this week" />
                </h2>
                <motion.div
                  className="p-2 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis
                        width={120}
                        tickFormatter={(value) => {
                          const amount = +value.toString();
                          const result = amount
                            .toLocaleString("en-US", {
                              style: "currency",
                              currency: "DZD",
                            })
                            .replace(/\.[0-9]+/gi, "");
                          return result;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--biqpod-gray-opacity)",
                          border: "var(--biqpod-borders)",
                        }}
                        wrapperClassName="rounded-2xl backdrop-blur-sm"
                      />
                      <RechartsLine
                        type="monotone"
                        dataKey="sales"
                        stroke="var(--biqpod-primary)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatedCard>
            </FadeIn>
          )}
          {!salesData && (
            <motion.div
              variants={loadingVariants}
              initial="initial"
              animate="animate"
              className="p-2 md:w-2/3"
            >
              <CardWait className="rounded-2xl h-[250px]" />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {todayOrders === null && (
            <motion.div
              className="md:w-1/3"
              variants={loadingVariants}
              initial="initial"
              animate="animate"
            >
              <CardWait className="rounded-2xl w-full h-[150px]" />
            </motion.div>
          )}
          {todayOrders !== null && (
            <FadeIn className="md:w-1/3" delay={0.4}>
              <Card
                onClick={() => {
                  if (todayOrders == 0) {
                    showToast("No orders yet");
                    return;
                  }
                  hist.push(
                    `/store/${storeId}/sales?time=today&status=all&phone=none`
                  );
                }}
                className="flex flex-col justify-evenly active:bg-[--biqpod-gray-opacity] p-3 w-full h-[150px] cursor-pointer"
              >
                <h2 className="mb-2 font-semibold text-lg capitalize">
                  <Translate content="today's orders" />
                </h2>
                <motion.p
                  className="font-bold text-[--biqpod-primary] text-5xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {todayOrders}
                </motion.p>
                <p className="mt-2 text-gray-500 text-sm">
                  <Translate content="orders placed today" />
                </p>
              </Card>
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </Scroll>
  );
}
