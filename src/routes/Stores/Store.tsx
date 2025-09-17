import { Button, Scroll } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { StoreOverview } from "./StoreOverview";
import { Route, Switch, useLocation, useParams } from "react-router";
import { setTemp } from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { userTabs } from "../../utils";
import { tw } from "@biqpod/app/ui/utils";
import { Integrations } from "../../Integrations";
import { ProductsAndBrands } from "./components/ProductsAndBrands";
import { OrdersAndCustomers } from "./components/OrdersAndCustomers";

import { StoreConfiguration } from "./components/StoreConfiguration";

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

  // const user = useUser();

  // useEffect(() => {
  //   if (user)
  //     showPopup(
  //       <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
  //         <CardHeaderForPopup title="Sync Drive" />
  //         <Line />
  //         <div className="flex justify-evenly items-center p-3 h-full">
  //           <img src={googleDriveHref} className="h-[100px]" />

  //           {/* Animated Connection Design */}
  //           <div className="flex justify-center items-center mx-3">
  //             <motion.div
  //               className="relative flex items-center"
  //               initial={{ opacity: 0 }}
  //               animate={{ opacity: 1 }}
  //               transition={{ duration: 0.5 }}
  //             >
  //               {/* Animated Connection Line */}
  //               <motion.div className="relative">
  //                 <div className="bg-gray-300 rounded-full w-12 h-[5px]" />
  //                 <motion.div
  //                   className="top-0 absolute bg-[--biqpod-primary] rounded-full h-[5px]"
  //                   initial={{ width: 0, left: 0 }}
  //                   animate={{
  //                     width: ["0%", "100%", "0%"],
  //                     left: ["0%", "0%", "100%"],
  //                   }}
  //                   transition={{
  //                     duration: 2,
  //                     repeat: Infinity,
  //                     ease: "easeInOut",
  //                     times: [0, 0.5, 1],
  //                   }}
  //                 />

  //                 {/* Pulsing particles */}
  //                 <motion.div
  //                   className="-top-1 absolute bg-[--biqpod-primary] rounded-full w-1 h-1"
  //                   animate={{
  //                     x: [0, 48, 0],
  //                     opacity: [0, 1, 0],
  //                     scale: [0.5, 1, 0.5],
  //                   }}
  //                   transition={{
  //                     duration: 2,
  //                     repeat: Infinity,
  //                     ease: "easeInOut",
  //                     delay: 0.3,
  //                   }}
  //                 />
  //               </motion.div>

  //               {/* Second Connection Dot */}
  //             </motion.div>
  //           </div>

  //           <UserAvatar user={user} className="w-[100px] h-[100px]" />
  //         </div>
  //         <Line />
  //         <div className="p-3">
  //           <Button
  //             onClick={async () => {
  //               const fn = await getUserFunction<{ url: string }>(
  //                 "link-account"
  //               );
  //               const response = await fn?.({ name: "google-drive" });
  //               const url = response?.url;
  //               if (url) {
  //                 window.open(url, "_blank");
  //               } else {
  //                 showToast("Failed to get the link URL", "error");
  //               }
  //             }}
  //           >
  //             <Translate content="Connect your Google Drive account" />
  //           </Button>
  //         </div>
  //       </Card>
  //     );
  // }, [user]);

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
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
