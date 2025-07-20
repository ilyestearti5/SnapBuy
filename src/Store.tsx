import { Button, Scroll } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { Orders } from "./Links/Orders";
import { StoreOverview } from "./StoreOverview";
import { Products } from "./Links/Products";
import { Route, Switch, useLocation, useParams } from "react-router";
import { setTemp } from "@biqpod/app/ui/hooks";
import { Stores } from "./Stores";
import { useEffect } from "react";
import { userTabs } from "./utils";
import { tw } from "@biqpod/app/ui/utils";
import { Forms } from "./Forms/Forms";
// function Page() {
//   return (
//     <div className="flex justify-center items-center p-2 h-full">
//       <Card>
//         <div className="flex flex-col justify-center items-center gap-3 p-8">
//           <h1 className="bg-clip-text bg-gradient-to-r from-red-500 to-blue-400 drop-shadow-md font-extrabold text-transparent text-2xl text-center capitalize">
//             <Translate content="This feature will be available soon" />
//           </h1>
//           <span className="text-[--biqpod-gray-opacity-2] text-base">
//             <Translate content="We are working hard to provide this feature for you. Stay tuned!" />
//           </span>
//         </div>
//       </Card>
//     </div>
//   );
// }
export const Store = () => {
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
              <StoreOverview />
            </Route>
            <Route path={createRoute("forms")}>
              <Forms />
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
