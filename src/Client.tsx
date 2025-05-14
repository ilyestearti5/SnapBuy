import { allIcons } from "@biqpod/app/ui/apis";
import { Button, Line, Scroll, Translate } from "@biqpod/app/ui/components";
import { useColorMerge } from "@biqpod/app/ui/hooks";
import { Redirect, Route, Switch, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { Orders } from "./Clients/Orders";
import { ClientProducts } from "./ClientProducts";
import { Users } from "./Users";
import { tw } from "@biqpod/app/ui/utils";
import { PageNotFound } from "./PageNotFound";
import { ProductRoute } from "./Links/ProductRoute";
export const clientTabs: Tab[] = [
  {
    name: "orders",
    icon: allIcons.solid.faShoppingCart,
    link: "/client/orders",
  },
  {
    name: "products",
    icon: allIcons.solid.faBox,
    link: "/client/stores",
  },
];
export const Client = () => {
  const colorMerge = useColorMerge();
  const loc = useLocation();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <Switch>
          {/* <Route path="/client/orders" exact>
            <Orders />
          </Route> */}
          <Route path="/client/stores/:uid" exact>
            <ClientProducts />
          </Route>
          <Route path="/client/stores" exact>
            <Users />
          </Route>
          <Route path="/client" exact>
            <Redirect to="/client/stores" />
          </Route>
          <Route path="*">
            <PageNotFound />
          </Route>
        </Switch>
      </Scroll>
      {/* <Line />
      <div className="flex justify-evenly gap-2 bg-[--biqpod-primary-background] p-2">
        {clientTabs.map((item, index) => {
          const isSelected = loc.pathname.startsWith(item.link);
          return (
            <Link to={item.link} key={index}>
              <Button
                className={tw(
                  "rounded-full max-md:w-[50px] max-md:h-[50px]",
                  !isSelected &&
                    "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                )}
                icon={item.icon}
                iconClassName="text-xl"
              >
                <span className="max-md:hidden">
                  <Translate content={item.name} />
                </span>
              </Button>
            </Link>
          );
        })}
      </div> */}
    </div>
  );
};
