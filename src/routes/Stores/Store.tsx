import { Button, CircleLoading, Scroll } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { StoreOverview } from "./StoreOverview";
import { Route, Switch, useLocation, useParams } from "react-router";
import { setTemp, useUser } from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { userTabs } from "../../utils";
import { tw } from "@biqpod/app/ui/utils";
import { Integrations } from "../../Integrations";
import { ProductsAndBrands } from "./components/ProductsAndBrands";
import { OrdersAndCustomers } from "./components/OrdersAndCustomers";
import { StoreConfiguration } from "./components/StoreConfiguration";
import { motion } from "framer-motion";
import { Plans } from "../App/Plans";
import { useUsedBy } from "./Stores";
import pageNotFound from "../../assets/page-not-found.png";

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
