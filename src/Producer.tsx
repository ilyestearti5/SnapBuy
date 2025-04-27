import { Scroll, Line, Button, Translate } from "biqpod/ui/components";
import { setTemp, useColorMerge } from "biqpod/ui/hooks";
import { useEffect } from "react";
import { Switch, Route, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { tabs } from "./App";
import { Accounts } from "./Links/Accounts";
import { Clients } from "./Links/Clients";
import { Orders } from "./Links/Orders";
import { Products } from "./Links/Products";
export const Producer = () => {
  const colorMerge = useColorMerge();
  const loc = useLocation();
  const selectedTab = tabs.find((item) => item.link === loc.pathname);
  useEffect(() => {
    setTemp("selectedTab", selectedTab);
  }, [selectedTab]);
  useEffect(() => {
    return () => {
      setTemp("selectedTab", null);
    };
  }, []);
  return (
    <div className="flex flex-col justify-between h-full">
      <Scroll>
        <Switch>
          <Route path="/producer/products">
            <Products />
          </Route>
          <Route path="/producer/orders">
            <Orders />
          </Route>
          <Route path="/producer/accounts">
            <Accounts />
          </Route>
          <Route path="/producer/clients">
            <Clients />
          </Route>
        </Switch>
      </Scroll>
      <Line />
      <div className="flex justify-evenly gap-2 bg-[--biqpod-primary-background] p-2">
        {tabs.map((item, index) => {
          const isSelected = loc.pathname === item.link;
          return (
            <Link to={item.link} key={index}>
              <Button
                className="rounded-full max-md:w-[50px] max-md:h-[50px] overflow-hidden"
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
                <img src={item.photo} className="w-[60px]" />
                <span className="max-md:hidden">
                  <Translate content={item.name} />
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
