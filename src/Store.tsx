import { Scroll, Button } from "@biqpod/app/ui/components";
import { setTemp, useColorMerge } from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { Switch, Route, useLocation, useParams } from "react-router";
import { Link } from "react-router-dom";
import { userTabs } from "./App";
import { Orders } from "./Links/Orders";
import { Products } from "./Links/Products";
import { Overview } from "./Overview";
import { Stores } from "./Stores";
export const Store = () => {
  const colorMerge = useColorMerge();
  const loc = useLocation();
  const storeId = useParams<{ storeId: string }>().storeId;
  const selectedTab = userTabs.find(
    (item) => item.link.replaceAll(`{storeId}`, storeId) === loc.pathname
  );
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
                  className="rounded-full w-[50px] h-[50px]"
                  iconClassName="text-xl"
                  style={{
                    ...colorMerge(
                      !isSelected && "gray.opacity",
                      !isSelected && {
                        color: "text.color",
                      }
                    ),
                  }}
                >
                  <img src={item.photo} className="w-full" />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full overflow-hidden">
        <Scroll>
          <Switch>
            <Route path={createRoute("orders")}>
              <Orders />
            </Route>
            <Route path={createRoute("products")}>
              <Products />
            </Route>
            <Route path={createRoute("overview")}>
              <Overview />
            </Route>
            {/* <Route path={createRoute("settings")}>
              <SettingsPage />
            </Route> */}
            <Route path={createRoute("stores")}>
              <Stores />
            </Route>
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
