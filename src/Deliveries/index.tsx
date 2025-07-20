import React from "react";
import {
  Button,
  Card,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  ImageField,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { Link, Route, Switch, Redirect, useLocation } from "react-router-dom";
import { Accounts } from "./Accounts";
import { DeliveryOrders } from "./DeliveryOrders";
import overviewPhotos from "../assets/overview.png";
import accountsPhotos from "../assets/accounts.png";
import deliveryPhoto from "../assets/delivery.png";
import { delay, tw } from "@biqpod/app/ui/utils";
import { images } from "../utils";
import { DeliveriesPricing } from "./DeliveriesPricing";
import { DeliveryOverview } from "./DeliveryOverview";
import { DeliveriesSettings } from "./DeliveriesSettings";
import { useEffect } from "react";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import {
  allIcons,
  getDoc,
  getDownloadURL,
  setDoc,
  updateFile,
} from "@biqpod/app/ui/apis";
import { Nothing } from "@biqpod/app/ui/types";
import { motion } from "framer-motion";
import { DeliveryUser } from "../Links/UpsertDelivery";
export const UpsertDeliverySettings = () => {
  const user = useUser();
  const photo = useCopyState<string | Nothing>(undefined);
  const name = getFieldValue("deliveries.name");
  // New state to store original fetched info
  const [originalInfo, setOriginalInfo] = React.useState<{
    name?: string;
    photo?: string;
  }>({});
  const action = useAction(
    "modify-deliveries-settings",
    async () => {
      if (!user?.uid) {
        return;
      }
      if (!name) {
        showToast("Please enter a brand name", "error");
        throw new Error("Brand name is required");
      }
      const response = await confirm({
        message: "Are you sure you want to save these settings?",
        title: "Confirm Settings",
        type: "warning",
      });
      if (!response) {
        showToast("Settings not saved", "info");
        return;
      }
      closePopup();
      var currentPhoto = photo.get?.toString();
      setTemp("loading-text", "Fetching photo...");
      if (currentPhoto?.startsWith("data")) {
        const blob = await fetch(currentPhoto).then((res) => res.blob());
        await updateFile(
          [
            "projects",
            import.meta.env.VITE_PROJECT_ID,
            "deliveries",
            user.uid,
            "photo",
          ],
          blob
        );
        const uri = await getDownloadURL([
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "deliveries",
          user.uid,
          "photo",
        ]);
        if (uri) {
          currentPhoto = uri;
        }
      }
      setTemp("loading-text", "Saving settings...");
      const options: DeliveryUser = {
        name,
        uid: user.uid,
      };
      if (currentPhoto) {
        options.photo = currentPhoto;
      }
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "deliveries", user.uid],
        options
      );
      setTemp("loading-text", "Settings saved successfully!");
      await delay(1000);
      setTemp("loading-text", "");
      showToast("Settings saved successfully", "success");
    },
    [photo.get, user?.uid, name]
  );
  const fetchAction = useAction(
    "fetch-deliverie-info",
    async () => {
      if (!user?.uid) {
        return;
      }
      const info = await getDoc<{ name?: string; photo?: string }>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "deliveries",
        user.uid,
      ]);
      setFieldValue("deliveries.name", info?.name || "");
      if (info?.photo) {
        photo.set(info.photo);
      } else {
        photo.set(undefined);
      }
      // Store original info for comparison
      setOriginalInfo({ name: info?.name || "", photo: info?.photo });
    },
    [user?.uid]
  );
  useEffect(() => {
    execAction("fetch-deliverie-info");
  }, []);
  const fetchActionLoading = isLoading(fetchAction);
  const loading = isLoading(action);
  // Compare current and original values
  const isChanged =
    name !== originalInfo.name || photo.get !== originalInfo.photo;
  return (
    <EmptyComponent>
      {!fetchActionLoading && (
        <EmptyComponent>
          <Scroll>
            <div className="p-4">
              <ImageField state={photo} config={{}} id="deliveries.photo" />
            </div>
            <Line />
            <div className="flex max-md:flex-col items-center gap-3 p-3">
              <label
                htmlFor="deliveries.name"
                className="block w-full md:text-right capitalize"
              >
                <Translate content="brand name" /> :
              </label>
              <Field
                inputName="deliveries.name"
                placeholder="Enter Brand Name..."
              />
            </div>
          </Scroll>
          {!loading && isChanged && (
            <EmptyComponent>
              <Line />
              <motion.div
                className="p-3"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              >
                <Button
                  icon={allIcons.solid.faPen}
                  className="rounded-full"
                  onClick={() => {
                    execAction("modify-deliveries-settings");
                  }}
                >
                  <Translate content="modify" />
                </Button>
              </motion.div>
            </EmptyComponent>
          )}
        </EmptyComponent>
      )}
      {fetchActionLoading && (
        <div className="flex justify-center items-center w-full h-full">
          <CircleLoading />
        </div>
      )}
    </EmptyComponent>
  );
};
const deliveriesTabs = [
  {
    name: "overview",
    photo: overviewPhotos,
  },
  {
    name: "orders",
    photo: deliveryPhoto,
  },
  {
    name: "accounts",
    photo: accountsPhotos,
  },
  {
    name: "pricing",
    photo: images.pricing, // Assuming you have a pricing image in your assets
  },
  {
    name: "settings",
    photo: images.settings, // Assuming you have a settings image in your assets
  },
];
export const Deliveries = () => {
  const loc = useLocation();
  const user = useUser();
  useAsyncEffect(async () => {
    if (!user?.uid) {
      return;
    }
    // This is to ensure that the user has a delivery account created
    // If not, we redirect them to the settings page to create one
    const doc = await getDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "deliveries",
      user.uid,
    ]);
    if (!doc) {
      showPopup(
        <Card className="max-md:w-11/12 md:w-1/2 md:max-h-[90vh] overflow-hidden">
          <div className="flex items-center gap-2 p-3">
            <div>
              <CircleTip
                icon={allIcons.solid.faChevronLeft}
                onClick={() => {
                  closePopup();
                  history.back();
                }}
              />
            </div>
            <h1 className="font-bold text-2xl capitalize">
              <Translate content="delivery company" />
            </h1>
          </div>
          <Line />
          <UpsertDeliverySettings />
        </Card>
      );
    }
  }, [user?.uid]);
  return (
    <div className="flex gap-1 h-full">
      <div className="flex items-center h-full">
        <div className="inline-flex flex-col gap-2 bg-[--biqpod-primary-background] p-2 border-[--biqpod-borders] border-y border-r border-solid rounded-se-3xl rounded-ee-3xl">
          {deliveriesTabs.map((item, index) => {
            const isSelected = loc.pathname === `/deliveries/${item.name}`;
            return (
              <Link to={`/deliveries/${item.name}`} key={index}>
                <Button
                  className={tw(
                    "rounded-full w-[50px] h-[50px]",
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
            <Route path="/deliveries/overview">
              <DeliveryOverview />
            </Route>
            <Route path="/deliveries/orders">
              <DeliveryOrders />
            </Route>
            <Route path="/deliveries/accounts">
              <Accounts />
            </Route>
            <Route path="/deliveries" exact>
              <Redirect to="/deliveries/overview" />
            </Route>
            <Route path="/deliveries/pricing">
              <DeliveriesPricing />
            </Route>
            <Route path="/deliveries/settings">
              <DeliveriesSettings />
            </Route>
          </Switch>
        </Scroll>
      </div>
    </div>
  );
};
