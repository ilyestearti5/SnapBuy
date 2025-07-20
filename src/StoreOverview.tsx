// components/EcommerceOverview.tsx
import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardWait,
  Icon,
  IconProps,
  Line,
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
import { snapbuyApi } from "./apis";
import { range } from "@biqpod/app/ui/utils";
import { Link } from "react-router-dom";
import { useStoreId } from "./App";
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
  return (
    <Scroll>
      <div className="flex flex-wrap gap-4 p-2">
        {overview &&
          Object.entries(overview).map(([name, content]: [string, string]) => {
            const title = titlesOveviews[name];
            const icon = iconsOveviews[name];
            const color = iconsColors[name];
            return (
              <Card
                onClick={() => {
                  if (name === "orders") {
                    document.getElementById("pending-orders")?.click();
                  } else if (name === "totalSales") {
                    if (content == "0") {
                      showToast("No sales yet");
                      return;
                    }
                    document.getElementById("completed-orders")?.click();
                  }
                }}
                key={name}
                className="flex-1 p-3 min-w-[200px] h-[70px] cursor-pointer"
              >
                <div className="flex justify-between items-center gap-4 h-full">
                  <div>
                    <p className="text-gray-500 text-sm">
                      <Translate content={title} />
                    </p>
                    <p className="font-semibold text-xl">{content}</p>
                  </div>
                  <span
                    style={{
                      color,
                    }}
                    className="inline-flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-[40px] h-[40px] text-xl"
                  >
                    <Icon icon={icon} />
                  </span>
                </div>
              </Card>
            );
          })}
        {!overview &&
          range(3).map((index) => {
            return (
              <CardWait
                key={index}
                className="flex-1 rounded-2xl min-w-[200px] h-[70px]"
              />
            );
          })}
      </div>
      <div className="flex max-md:flex-col md:items-center gap-2 p-2">
        {salesData && (
          <Card className="md:w-2/3">
            <div className="p-2">
              <h2 className="font-semibold text-lg capitalize">
                <Translate content="sales this week" />
              </h2>
            </div>
            <Line />
            <div className="p-2">
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
            </div>
          </Card>
        )}
        {!salesData && <CardWait className="rounded-2xl w-full h-[250px]" />}
        {todayOrders === null && (
          <CardWait className="rounded-2xl w-full h-[150px]" />
        )}
        {todayOrders !== null && (
          <Card
            onClick={() => {
              if (todayOrders == 0) {
                showToast("No orders yet");
                return;
              }
              document.getElementById("today-orders")?.click();
            }}
            className="flex flex-col justify-evenly active:bg-[--biqpod-gray-opacity] p-3 md:w-1/3 h-[150px] cursor-pointer"
          >
            <h2 className="mb-2 font-semibold text-lg capitalize">
              <Translate content="today's orders" />
            </h2>
            <p className="font-bold text-[--biqpod-primary] text-5xl">
              {todayOrders}
            </p>
            <p className="mt-2 text-gray-500 text-sm">
              <Translate content="orders placed today" />
            </p>
          </Card>
        )}
      </div>
      <Link
        id="pending-orders"
        to={`/store/${storeId}/orders?time=all&status=pending&phone=none`}
      />
      <Link
        id="today-orders"
        to={`/store/${storeId}/orders?time=today&status=all&phone=none`}
      />
      <Link
        id="completed-orders"
        to={`/store/${storeId}/orders?time=today&status=completed&phone=none`}
      />
    </Scroll>
  );
}
