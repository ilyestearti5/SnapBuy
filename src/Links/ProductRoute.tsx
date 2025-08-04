import { allIcons } from "@biqpod/app/ui/apis";
import {
  BooleanField,
  Button,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Line,
  MagicField,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  checkFormByFeilds,
  execAction,
  getFieldValue,
  getTemp,
  isLoading,
  setDarkColor,
  setDefaultColor,
  setFieldValue,
  setLightColor,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { setFocused, tw } from "@biqpod/app/ui/utils";
import { useParams } from "react-router";
import { CreateOrderOptions, snapbuyApi } from "../apis";
import { useSearchParams } from "../routes/Clients/AddProductToCart";
import { ImageSlider } from "./ImageSlider";
import { FormSection } from "./FormSection";
import { useEffect, useMemo } from "react";
import { colorsInListWithNames } from "../utils";
import { Nothing } from "@biqpod/app/ui/types";
import { isWeb } from "@biqpod/app/ui/app";
import { getAddressFromCoords } from "../getAddressFromCoords";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { getPrice } from "../utils";
import { initPixels } from "./pixles";
export const ProductRoute = () => {
  const prodId = useParams<{ prodId: string }>().prodId;
  const product = useAsyncMemo(async () => {
    return await snapbuyApi.getProduct(prodId);
  }, [prodId]);
  const { getColor } = useSearchParams();
  useEffect(() => {
    for (const colorItem of colorsInListWithNames) {
      const colorId = colorItem.colorId;
      const color = getColor(colorId);
      if (color) {
        setDarkColor(colorId, color);
        setLightColor(colorId, color);
        setDefaultColor(colorId, color);
      }
    }
  }, [getColor]);
  const latitude = useCopyState<Nothing | number>(null);
  const longitude = useCopyState<Nothing | number>(null);
  const store = useAsyncMemo(async () => {
    if (!product?.storeId) return undefined;
    return snapbuyApi.getStore(product?.storeId!);
  }, [product]);
  const price = useMemo(() => {
    return getPrice(product, 1).total;
  }, [product]);
  const pixels = initPixels(store);
  const action = useAction(
    "auto-detect-location-in-product",
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
  const formStructor = useAsyncMemo(async () => {
    if (!product?.formCollectionId) return [];
    return snapbuyApi.forms.getCollectionPropertys(
      product.formCollectionId || "order.default"
    );
  }, [product?.storeId]);
  const user = useUser();
  const count = useCopyState(1);
  useEffect(() => {
    pixels?.view(product);
  }, [pixels, product]);
  useEffect(() => {
    setFieldValue("client-firstname", user?.firstname || "");
    setFieldValue("client-lastname", user?.lastname || "");
    const phoneNumber = user?.phone || localStorage.getItem("phone") || "";
    setFieldValue("client-phone", phoneNumber);
  }, [user]);
  const deliveryState = useCopyState<boolean | null>(false);
  const firstname = getFieldValue("client-firstname");
  const lastname = getFieldValue("client-lastname");
  const phone = getFieldValue("client-phone");
  const address = getFieldValue("client-address");
  const wilaya = getFieldValue("client-wilaya");
  const magic = getTemp<Record<string, any>>("magic-fields");
  const createOrderAction = useAction(
    "create-order-in-product",
    async () => {
      if (!product) {
        showToast("Product not found", "error");
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
      const products: SnapBuy.Order["products"] = {
        [product?.id!]: {
          count: count.get || 1,
        },
      };
      localStorage.setItem("phone", phone);
      const place: SnapBuy.Client["place"] = {
        address,
        wilaya,
      };
      if (latitude.get) {
        place.latitude = latitude.get;
      }
      if (longitude.get) {
        place.longitude = longitude.get;
      }
      const metaData: Record<string, any> = {};
      formStructor?.forEach((formId) => {
        metaData[formId.id] = magic?.[formId.id];
      });
      const options: CreateOrderOptions = {
        products,
        client: {
          firstname,
          lastname,
          phone,
          id: crypto.randomUUID(),
          place,
        },
        delivery: deliveryState.get || false,
        metaData,
      };
      const orderInfo = await snapbuyApi.createOrder(options);
      if (!orderInfo?.id) {
        throw "Order Info Incorrect";
      }
      const order = await snapbuyApi.getOrder(orderInfo.id);
      if (order) {
        pixels?.purchase(order);
      }
      showToast("Order Created", "success");
    },
    [
      product,
      firstname,
      lastname,
      phone,
      address,
      wilaya,
      deliveryState.get,
      latitude.get,
      longitude.get,
      formStructor,
      count.get,
      magic,
    ]
  );
  const loadingAction = isLoading(createOrderAction);
  useEffect(() => {
    setFieldValue(
      "product-quantity",
      count.get === 0 ? "" : count.get.toString()
    );
  }, [count.get]);
  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      {product && (
        <EmptyComponent>
          <Scroll>
            <div className="h-[50vh]">
              <ImageSlider viewImages zoom photos={product?.photos || []} />
            </div>
            <EmptyComponent>
              <FormSection title="form : " />
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
              <div className="flex justify-center items-center gap-2 p-2">
                <label className="capitalize">
                  <Translate content="delivery" /> :
                </label>
                <BooleanField config={{}} id="delivery" state={deliveryState} />
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
                <Field
                  inputName="client-wilaya"
                  placeholder="Enter Your Wilaya"
                />
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
                      execAction("auto-detect-location-in-product");
                    }}
                    iconClassName={tw(loading && "animate-spin")}
                  >
                    <Translate content="auto" />
                  </Button>
                </span>
              </div>
              {!!formStructor?.length && (
                <EmptyComponent>
                  <Line />
                  {formStructor?.map((form) => {
                    return (
                      <div key={form.id} className="flex flex-col gap-2 p-2">
                        <label htmlFor={form.id} className="block w-full">
                          {form.name} :{" "}
                        </label>
                        <div className="w-full">
                          <MagicField
                            fieldId={form.id}
                            config={form.config}
                            type={form.type!}
                          />
                        </div>
                      </div>
                    );
                  })}
                </EmptyComponent>
              )}
              <Line />
              <div className="flex justify-center items-center gap-2 p-4">
                <div>
                  <CircleTip
                    className="inline-flex justify-center items-center rounded-full w-[40px] h-[40px] bg-[--biqpod-text-color] text-[--biqpod-primary-background] hover:bg-[--biqpod-text-color] active:hover:bg-[--biqpod-text-color] cursor-pointer"
                    onClick={() => count.set(Math.max(1, (count.get || 1) - 1))}
                    icon={allIcons.solid.faMinus}
                  />
                </div>
                <div className="w-[100px]">
                  <Field
                    inputName="product-quantity"
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for easier editing
                      if (value === "") {
                        count.set(0);
                        return;
                      }
                      const numValue = parseInt(value);
                      if (isNaN(numValue) || numValue < 1) {
                        count.set(0);
                        return;
                      }
                      const newValue = Math.min(500, numValue);
                      count.set(newValue);
                      e.currentTarget.value = newValue.toString();
                    }}
                    onBlur={() => {
                      // If field is empty when user leaves it, set to 1
                      if (count.get === 0) {
                        count.set(1);
                      }
                    }}
                    placeholder="Q"
                    className="focus:border-[--biqpod-primary] border-transparent rounded-full outline-none text-3xl text-center"
                    style={{ background: "transparent" }}
                  />
                </div>
                <div>
                  <CircleTip
                    className="inline-flex justify-center items-center rounded-full w-[40px] h-[40px] bg-[--biqpod-text-color] text-[--biqpod-primary-background] hover:bg-[--biqpod-text-color] active:hover:bg-[--biqpod-text-color] cursor-pointer"
                    onClick={() =>
                      count.set(Math.min(500, (count.get || 0) + 1))
                    }
                    icon={allIcons.solid.faPlus}
                  />
                </div>
              </div>
            </EmptyComponent>
            <FormSection title="description : " />
            <div className="p-4">
              <MarkDown
                value={product?.description || "No Description Found"}
              />
            </div>
          </Scroll>
          <Line />
          <div className="flex gap-2 p-3">
            <Button
              className="rounded-full"
              onClick={() => {
                execAction("create-order-in-product");
              }}
              rightIcon={allIcons.solid.faChevronRight}
            >
              <Translate content="create order" /> ({price})DA
            </Button>
          </div>
          {loadingAction && (
            <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
              <CircleLoading />
            </div>
          )}
        </EmptyComponent>
      )}
      {!product && <CardWait className="w-full h-full" />}
    </div>
  );
};
