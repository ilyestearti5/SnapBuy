import { allIcons } from "@biqpod/app/ui/apis";
import { Scroll } from "@biqpod/app/ui/components";
import { Redirect, Route, Switch } from "react-router";
import { ClientProducts } from "./ClientProducts";
import { Users } from "./Users";
import { PageNotFound } from "./PageNotFound";
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
