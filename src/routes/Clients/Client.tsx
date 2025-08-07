import { Scroll } from "@biqpod/app/ui/components";
import { Redirect, Route, Switch } from "react-router";
import { ClientProducts } from "./ClientProducts";
import { ExploreStores } from "./ClientStores";
import { PageNotFound } from "../App/PageNotFound";
import { initCart } from "./AddProductToCart";
import { StoreRouteImport } from "./StoreRouteImport";
import { Test } from "../../Test";
export const Client = () => {
  initCart();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <Switch>
          {/* <Route path="/client/orders" exact>
            <Orders />
          </Route> */}
          <Route path="/client/stores/:storeId/products" exact>
            <ClientProducts />
          </Route>
          <Route path="/client/stores/:storeId" exact>
            <Test />
          </Route>
          <Route path="/client/stores" exact>
            <ExploreStores />
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
