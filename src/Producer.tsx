import { Scroll, Button } from "@biqpod/app/ui/components";
import { setTemp, useColorMerge } from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { Switch, Route, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { userTabs } from "./App";
import { Orders } from "./Links/Orders";
import { Products } from "./Links/Products";
import { Overview } from "./Overview";
import { Integrations } from "./Integrations";
export const Producer = () => {
  const colorMerge = useColorMerge();
  const loc = useLocation();
  const selectedTab = userTabs.find((item) => item.link === loc.pathname);
  useEffect(() => {
    setTemp("selectedTab", selectedTab);
  }, [selectedTab]);
  useEffect(() => {
    return () => {
      setTemp("selectedTab", null);
    };
  }, []);
  return (
    <div className="flex gap-1 h-full">
      <div className="flex items-center h-full">
        <div className="inline-flex flex-col gap-2 bg-[--biqpod-primary-background] p-2 border-[--biqpod-borders] border-y border-r border-solid rounded-se-3xl rounded-ee-3xl">
          {userTabs.map((item, index) => {
            const isSelected = loc.pathname === item.link;
            return (
              <Link to={item.link} key={index}>
                <Button
                  className="rounded-full max-md:w-[50px]max-md:h-[50px] overflow-hidden"
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
                  <img
                    src={item.photo}
                    className="w-[30px] h-[30px] object-cover"
                  />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full overflow-hidden">
        <Scroll>
          <Switch>
            <Route path="/producer/orders">
              <Orders />
            </Route>
            <Route path="/producer/products">
              <Products />
            </Route>
            <Route path="/producer/overview">
              <Overview />
            </Route>
            <Route path="/producer/integrations">
              <Integrations />
            </Route>
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
