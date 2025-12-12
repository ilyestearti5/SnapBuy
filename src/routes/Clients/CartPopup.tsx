import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  Action,
  checkFormByFeilds,
  closePopup,
  execAction,
  getFieldValue,
  getTemp,
  isIdle,
  isLoading,
  isSuccess,
  setFieldValue,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
  useUser,
  visibilityTemp,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi, CreateOrderOptions } from "../../apis";
import { useEffect, useMemo } from "react";
import { mapAsync, setFocused, tw } from "@biqpod/app/ui/utils";
import { Biqpod, Nothing, SettingValueType } from "@biqpod/app/ui/types";
import { CartLine } from "./CartLine";
import { Carts } from "./ClientStores";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { isWeb } from "@biqpod/app/ui/app";
import { getAddressFromCoords } from "../../getAddressFromCoords";
import { deleteCart, useCart, useFullCart } from "../../apis/snapbuy";
export interface ProductMore {
  product: Biqpod.Snapbuy.Product;
  count: number;
}
export function useActionStatus(actionName?: string | Action) {
  const loading = isLoading(actionName);
  const success = isSuccess(actionName);
  const error = isSuccess(actionName);
  const idle = isIdle(actionName);
  return {
    isLoading: loading,
    isSuccess: success,
    isError: error,
    isIdle: idle,
  };
}
interface CartPopupProps {
  storeId: string;
  backToCarts?: boolean;
  magicForms?: Record<string, SettingValueType>;
}
export const CartPopup = ({
  storeId,
  magicForms = {},
  backToCarts = false,
}: CartPopupProps) => {
  const fullCart = useFullCart(storeId);
  const counts = getTemp<Record<string, number>>("cart-count-prices");
  const total = useMemo(() => {
    return Object.values(counts || {}).reduce((acc, total) => {
      return acc + total;
    }, 0);
  }, [counts]);
  const clientForm = visibilityTemp.getTemp<boolean>("client-form");
  const carts = useCart(storeId);
  const firstname = getFieldValue("client-firstname");
  const lastname = getFieldValue("client-lastname");
  const phone = getFieldValue("client-phone");
  const address = getFieldValue("client-address");
  const wilaya = getFieldValue("client-wilaya");
  const store = useAsyncMemo(() => {
    return snapbuyApi.store.get(storeId);
  }, []);
  const latitude = useCopyState<Nothing | number>(null);
  const longitude = useCopyState<Nothing | number>(null);
  const orderCreationAction = useAction(
    "create-order",
    async () => {
      if (!carts) {
        showToast("Cart Is Empty!");
        return;
      }
      if (!firstname) {
        setFocused("client-firstname");
        showToast("Enter Your First Name", "info");
        return;
      }
      if (!lastname) {
        setFocused("client-lastname");
        showToast("Enter Your Last Name", "info");
        return;
      }
      if (!phone) {
        setFocused("client-phone");
        showToast("Enter Your Phone Number", "info");
        return;
      }
      if (!address) {
        setFocused("client-address");
        showToast("Enter Your Address", "info");
        return;
      }
      if (!wilaya) {
        setFocused("client-wilaya");
        showToast("Enter Your Wilaya", "info");
        return;
      }
      const { controls } = checkFormByFeilds(["client-phone"]);
      const founded = controls.find((control) => !control.isValide);
      if (founded) {
        switch (founded.fieldName) {
          case "client-phone": {
            showToast("Enter Valid Phone Number", "info");
            break;
          }
          case "client-firstname": {
            showToast("Enter Valid Name", "info");
            break;
          }
          case "client-address": {
            showToast("Enter Valid Address", "info");
            break;
          }
          case "client-wilaya": {
            showToast("Enter Valid Wilaya", "info");
            break;
          }
        }
        return;
      }
      const products: Biqpod.Snapbuy.Order["products"] = {};
      await mapAsync(Object.entries(carts), async ([prodId, value]) => {
        products[prodId] = {
          count: value?.count,
        };
      });
      localStorage.setItem("phone", phone);
      const place: Biqpod.Snapbuy.Order["place"] = {
        address,
        wilaya,
      };
      if (latitude.get) {
        place.latitude = latitude.get;
      }
      if (longitude.get) {
        place.longitude = longitude.get;
      }
      const options: CreateOrderOptions = {
        products,
        client: {
          firstname,
          lastname,
          phone,
          id: crypto.randomUUID(),
        },
        place,
        metaData: magicForms,
      };
      await snapbuyApi.order.create(options);
      closePopup();
      showToast("Order Created", "success");
      visibilityTemp.setTemp("client-form", false);
      deleteCart(storeId);
    },
    [phone, address, latitude.get, longitude.get, wilaya, firstname, storeId]
  );
  const action = useAction(
    "auto-detect-location",
    () => {
      return new Promise(async (resolve, reject) => {
        try {
          if (isWeb) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude: lat, longitude: lon } = position.coords;
                const { fullAddress, wilaya } = await getAddressFromCoords(
                  lat,
                  lon
                );
                latitude.set(lat);
                longitude.set(lon);
                setFieldValue("client-wilaya", wilaya);
                setFieldValue("client-address", fullAddress);
                resolve(true);
              },
              (error) => {
                showToast("Geolocation error: " + error.message, "error");
                reject(new Error("Geolocation error: " + error.message));
              }
            );
          } else {
            let permStatus: PermissionStatus =
              await Geolocation.checkPermissions();
            if (permStatus.location !== "granted") {
              permStatus = await Geolocation.requestPermissions();
              if (permStatus.location !== "granted") {
                showToast("Location permission denied", "error");
                return reject(new Error("Location permission denied"));
              }
            }
            const position = await Geolocation.getCurrentPosition();
            const { latitude: lat, longitude: lon } = position.coords;
            const { fullAddress, wilaya } = await getAddressFromCoords(
              lat,
              lon
            );
            latitude.set(lat);
            longitude.set(lon);
            setFieldValue("client-wilaya", wilaya);
            setFieldValue("client-address", fullAddress);
            resolve(true);
          }
          // Check geolocation permission
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );
  const loading = isLoading(action);
  const loadingOrderCreation = isLoading(orderCreationAction);
  const user = useUser();
  useEffect(() => {
    setFieldValue("client-firstname", user?.firstname || "");
    setFieldValue("client-lastname", user?.lastname || "");
    const phoneNumber = user?.phone || localStorage.getItem("phone") || "";
    setFieldValue("client-phone", phoneNumber);
  }, [user]);
  useEffect(() => {
    setTemp("client-form", false);
  }, []);
  return (
    <Card
      className={tw(
        "relative flex flex-col md:max-h-[93vh] md:min-h-[0vh] transition-[min-height] duration-500 max-md:rounded-none lg:w-1/2 md:w-2/3 max-md:w-full max-md:h-full overflow-hidden",
        clientForm && "md:min-h-[93vh]"
      )}
    >
      <div>
        <div className="flex justify-between items-center px-5 h-[7vh]">
          <div className="flex items-center gap-2">
            {(clientForm || backToCarts) && (
              <div>
                <CircleTip
                  icon={allIcons.solid.faArrowLeft}
                  onClick={() => {
                    if (clientForm)
                      visibilityTemp.setTemp("client-form", false);
                    else if (backToCarts) {
                      showPopup(<Carts />);
                    }
                  }}
                />
              </div>
            )}
            <h1 className="font-bold text-3xl uppercase">
              <Translate content="cart" />
            </h1>
          </div>
          <div>
            <CircleTip
              icon={allIcons.solid.faXmark}
              onClick={() => {
                closePopup();
              }}
            />
          </div>
        </div>
        <Line />
      </div>
      <div className="relative flex flex-col h-full overflow-hidden">
        <Scroll>
          <div className="flex flex-col gap-2">
            {fullCart?.map((record, index) => {
              return <CartLine key={index} data={record} />;
            })}
          </div>
          {fullCart.length === 0 && (
            <div className="flex flex-col justify-center items-center gap-y-5 text-[--biqpod-gray-opacity-2] p-3 h-full">
              <Icon icon={allIcons.solid.faCartShopping} className="text-7xl" />
              <div>
                <h1 className="text-4xl capitalize">
                  <Translate content="empty cart" />
                </h1>
              </div>
            </div>
          )}
        </Scroll>
        <div
          className={tw(
            "absolute inset-0 ease-in-out bg-[--biqpod-primary-background] transition-opacity duration-700 pointer-events-none opacity-0",
            clientForm && "opacity-70"
          )}
        />
        {!!fullCart.length && (
          <EmptyComponent>
            <Line />
            <div className="flex justify-end items-center gap-1 p-2">
              <Button
                onClick={async () => {
                  visibilityTemp.setTemp("client-form", true);
                }}
                className="bg-[--biqpod-success] w-full text-[--biqpod-primary-content]"
                icon={allIcons.solid.faCartPlus}
              >
                <Translate content="complete" /> {total}DA
              </Button>
            </div>
          </EmptyComponent>
        )}
      </div>
      <div
        className={tw(
          "absolute bottom-0 top-[calc(7vh+1px)] flex flex-col justify-between overflow-hidden left-full w-full bg-[--biqpod-primary-background] transition-[left] duration-700",
          clientForm && "left-0"
        )}
      >
        <Scroll className="h-full">
          <div className="flex flex-col gap-2 p-2">
            <label className="capitalize">
              <Translate content="firstname" /> :
            </label>
            <Field
              inputName="client-firstname"
              maxLength={40}
              placeholder="Enter Your Firstname"
            />
          </div>
          <div className="flex flex-col gap-2 p-2">
            <label className="capitalize">
              <Translate content="lastname" /> :
            </label>
            <Field
              inputName="client-lastname"
              maxLength={40}
              placeholder="Enter Your Lastname"
            />
          </div>
          <div className="flex flex-col gap-2 p-2">
            <label className="capitalize">
              <Translate content="phone" /> :
            </label>
            <Field
              maxLength={10}
              controls={{
                "[0-9]{10}": {
                  succ: "valid",
                  err: "invalid",
                },
              }}
              inputMode="numeric"
              inputName="client-phone"
              placeholder="Enter Your Phone Number"
            />
          </div>
          <Line />
          <div className="flex flex-col gap-2 p-2">
            <label className="capitalize">
              <Translate content="address" /> :
            </label>
            <Field
              inputName="client-address"
              multiLines
              maxRows={3}
              rows={3}
              placeholder="Enter Your Address"
            />
          </div>
          <div className="flex flex-col gap-2 p-2">
            <label className="capitalize">
              <Translate content="wilaya" /> :
            </label>
            <Field inputName="client-wilaya" placeholder="Enter Your Wilaya" />
          </div>
          <div className="flex justify-between p-2">
            <span />
            <span className="flex items-center gap-2">
              {Boolean(address && wilaya) && (
                <Button
                  icon={allIcons.solid.faXmark}
                  className="bg-[--biqpod-gray-opacity] px-5 rounded-full text-[--biqpod-text-color]"
                  onClick={() => {
                    setFieldValue("client-wilaya", "");
                    setFieldValue("client-address", "");
                  }}
                >
                  <Translate content="cancel" />
                </Button>
              )}
              <Button
                icon={
                  loading
                    ? allIcons.solid.faCircleNotch
                    : allIcons.solid.faLocationDot
                }
                className="px-5 rounded-full"
                onClick={() => {
                  execAction("auto-detect-location");
                }}
                iconClassName={tw(loading && "animate-spin")}
              >
                <Translate content="auto" />
              </Button>
            </span>
          </div>
        </Scroll>
        {store && (
          <EmptyComponent>
            <Line />
            <div className="flex justify-end items-center gap-1 p-2">
              <Button
                onClick={async () => {
                  execAction("create-order");
                }}
                className="bg-[--biqpod-success] w-full text-[--biqpod-primary-content]"
                icon={allIcons.solid.faCartPlus}
              >
                <Translate content="create order" /> {total}DA{" "}
              </Button>
            </div>
          </EmptyComponent>
        )}
      </div>
      {loadingOrderCreation && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
