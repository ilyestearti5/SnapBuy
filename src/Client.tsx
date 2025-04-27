import { allIcons } from "biqpod/ui/apis";
import { Button, Line, Scroll, Translate } from "biqpod/ui/components";
import { useColorMerge, useTemp } from "biqpod/ui/hooks";
import { Route, Switch, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { Orders } from "./Clients/Orders";
import { api, listenClient, useCurrentClient } from "./apis";
import { useEffect } from "react";
import { ChangeClient } from "./ChangeClient";
import { ClientProducts } from "./ClientProducts";
const clientTabs: Tab[] = [
  {
    name: "orders",
    icon: allIcons.solid.faShoppingCart,
    link: "/client/orders",
  },
  {
    name: "products",
    icon: allIcons.solid.faBox,
    link: "/client/products",
  },
  {
    name: "change",
    icon: allIcons.solid.faRotateLeft,
    link: "/client/change",
  },
];
export const Client = () => {
  const colorMerge = useColorMerge();
  const loc = useLocation();
  listenClient();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <Switch>
          <Route path="/client/orders" exact>
            <Orders />
          </Route>
          <Route path="/client/change" exact>
            <ChangeClient />
          </Route>
          <Route path="/client/products" exact>
            <ClientProducts />
          </Route>
        </Switch>
      </Scroll>
      <Line />
      <div className="flex justify-evenly gap-2 bg-[--biqpod-primary-background] p-2">
        {clientTabs.map((item, index) => {
          const isSelected = loc.pathname === item.link;
          return (
            <Link to={item.link} key={index}>
              <Button
                className="rounded-full max-md:w-[50px] max-md:h-[50px]"
                icon={item.icon}
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
