import { Button, Scroll } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { Orders } from "../../Links/Orders";
import { StoreOverview } from "./StoreOverview";
import { Products } from "../../Links/Products";
import { Brands } from "../../Links/Brands";
import { Route, Switch, useLocation, useParams } from "react-router";
import { setTemp } from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { userTabs } from "../../utils";
import { tw } from "@biqpod/app/ui/utils";
import { Forms } from "../../Forms/Forms";
import { Stores } from "./Stores";
import { NotificationSettings } from "../../components/NotificationSettings";
import { Integrations } from "../../Integrations";
import { Varients } from "./Varients";

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
      <div className="relative bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full overflow-hidden">
        <Scroll>
          <Switch>
            <Route path={createRoute("varients")}>
              <Varients />
            </Route>
            <Route path={createRoute("orders")}>
              <Orders />
            </Route>
            <Route path={createRoute("products")}>
              <Products />
            </Route>
            <Route path={createRoute("brands")}>
              <Brands />
            </Route>
            <Route path={createRoute("overview")}>
              <StoreOverview />
            </Route>
            <Route path={createRoute("forms")}>
              <Forms />
            </Route>
            <Route path={createRoute("settings")}>
              <div className="p-6">
                <NotificationSettings />
              </div>
            </Route>
            <Route path={createRoute("stores")}>
              <Stores />
            </Route>
            <Route path={createRoute("integrations")}>
              <Integrations />
            </Route>
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
