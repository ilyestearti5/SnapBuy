import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  IconProps,
  Line,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  checkFormByFeilds,
  execAction,
  getFieldValue,
  getTemp,
  getTempFromStore,
  isLoading,
  setDarkColor,
  setDefaultColor,
  setFieldValue,
  setLightColor,
  setTemp,
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
import { FilesSlider } from "./FilesSlider";
import { FormSection } from "./FormSection";
import { useEffect, useMemo } from "react";
import { colorsInListWithNames } from "../utils";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { isWeb } from "@biqpod/app/ui/app";
import { getAddressFromCoords } from "../getAddressFromCoords";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { getPrice } from "../utils";
import { initPixels } from "./pixles";
import { motion } from "framer-motion";
import { useHistory } from "react-router";
export const ProductRoute = () => {
  const prodId = useParams<{ prodId: string }>().prodId;
  const product = useAsyncMemo(async () => {
    return await snapbuyApi.product.get(prodId);
  }, [prodId]);
  const { getColor } = useSearchParams();
  const hist = useHistory();
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
    return snapbuyApi.store.get(product?.storeId!);
  }, [product]);
  const price = useMemo(() => {
    return getPrice(product, 1).total;
  }, [product]);
  const pixels = initPixels(store);
  const deliveryOptions = useAsyncMemo(async () => {
    if (product?.storeId) {
      const options = await snapbuyApi.deliveryPrice.options.getAll(
        product.storeId
      );
      return options;
    }
  }, [product]);
  const selectDeliveryOption = useCopyState<
    Nothing | Biqpod.Snapbuy.DeliveryOptions
  >(null);
  const deliveryPlaces = useAsyncMemo(async () => {
    if (!selectDeliveryOption.get) {
      return;
    }
    const prices = getTempFromStore<Biqpod.Snapbuy.DeliveryPrice[]>(
      "client-delivery-prices." + selectDeliveryOption.get.id
    );
    if (prices) {
      return prices.filter(
        (price) =>
          selectDeliveryOption.get &&
          price.deliveryOptionId === selectDeliveryOption.get.id
      );
    }
    if (!selectDeliveryOption.get.storeId) {
      return;
    }
    const fetchedPrices = await snapbuyApi.deliveryPrice.getAll(
      selectDeliveryOption.get.storeId
    );
    const places = fetchedPrices.filter(
      (price) =>
        selectDeliveryOption.get &&
        price.deliveryOptionId === selectDeliveryOption.get.id
    );
    if (places) {
      setTemp(
        "client-delivery-prices." + selectDeliveryOption.get.id,
        fetchedPrices
      );
    }
    return places;
  }, [selectDeliveryOption.get]);
  const selectDeliveryPriceId = useCopyState<Nothing | string>(null);
  const action = useAction(
    "auto-detect-location-in-product",
    () => {
      return new Promise(async (resolve, reject) => {
        try {
          if (isWeb) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude: lat, longitude: lon } = position.coords;
                const { wilaya } = await getAddressFromCoords(lat, lon);
                latitude.set(lat);
                longitude.set(lon);
                const id = deliveryPlaces?.find(
                  (option) => option.name.toLowerCase() === wilaya.toLowerCase()
                )?.id;
                if (id) {
                  selectDeliveryPriceId.set(id);
                }
                resolve(true);
              },
              (error) => {
                showToast("geolocation error" + ": " + error.message, "error");
                reject(new Error("Geolocation error: " + error.message));
              }
            );
          } else {
            let permStatus: PermissionStatus =
              await Geolocation.checkPermissions();
            if (permStatus.location !== "granted") {
              permStatus = await Geolocation.requestPermissions();
              if (permStatus.location !== "granted") {
                showToast("location permission denied", "error");
                return reject(new Error("Location permission denied"));
              }
            }
            const position = await Geolocation.getCurrentPosition();
            const { latitude: lat, longitude: lon } = position.coords;
            const { wilaya } = await getAddressFromCoords(lat, lon);
            latitude.set(lat);
            longitude.set(lon);
            const id = deliveryPlaces?.find(
              (option) => option.name.toLowerCase() === wilaya.toLowerCase()
            )?.id;
            if (id) {
              selectDeliveryPriceId.set(id);
            }
            resolve(true);
          }
          // Check geolocation permission
        } catch (err) {
          reject(err);
        }
      });
    },
    [deliveryPlaces]
  );
  const loading = isLoading(action);
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
  const firstname = getFieldValue("client-firstname");
  const lastname = getFieldValue("client-lastname");
  const phone = getFieldValue("client-phone");
  const note = getFieldValue("client-note");
  const magic = getTemp<Record<string, any>>("magic-fields");
  const createOrderAction = useAction(
    "create-order-in-product",
    async () => {
      if (!product) {
        showToast("product not found", "error");
        return;
      }
      if (!firstname) {
        setFocused("client-firstname");
        showToast("enter your first name", "info");
        return;
      }
      if (!lastname) {
        setFocused("client-lastname");
        showToast("enter your last name", "info");
        return;
      }
      if (!phone) {
        setFocused("client-phone");
        showToast("enter your phone number", "info");
        return;
      }
      const { controls } = checkFormByFeilds(["client-phone"]);
      const founded = controls.find((control) => !control.isValide);
      const wilaya = "";
      if (founded) {
        switch (founded.fieldName) {
          case "client-phone": {
            showToast("enter valid phone number", "info");
            break;
          }
          case "client-firstname": {
            showToast("enter valid name", "info");
            break;
          }
          case "client-address": {
            showToast("enter valid address", "info");
            break;
          }
          case "client-wilaya": {
            showToast("enter valid wilaya", "info");
            break;
          }
        }
        return;
      }
      const products: Biqpod.Snapbuy.Order["products"] = {
        [product?.id!]: {
          count: count.get || 1,
        },
      };
      localStorage.setItem("phone", phone);
      const place: Biqpod.Snapbuy.Order["place"] = {
        wilaya,
        address: "",
      };
      if (latitude.get) {
        place.latitude = latitude.get;
      }
      if (longitude.get) {
        place.longitude = longitude.get;
      }
      const options: CreateOrderOptions = {
        storeId: product.storeId,
        products,
        client: {
          firstname,
          lastname,
          phone,
          id: crypto.randomUUID(),
        },
        place,
        note,
        deliveryPriceId: selectDeliveryPriceId.get || undefined,
      };
      const orderInfo = await snapbuyApi.order.create(options);
      if (!orderInfo?.order.id) {
        throw "Order Info Incorrect";
      }
      pixels?.purchase(orderInfo.order);
      orderId.set(orderInfo.order.id);
      orderSuccess.set(true);
      showToast("order created", "success");
    },
    [
      product,
      firstname,
      lastname,
      phone,
      note,
      latitude.get,
      longitude.get,
      count.get,
      magic,
      selectDeliveryPriceId.get,
    ]
  );
  const loadingAction = isLoading(createOrderAction);
  useEffect(() => {
    setFieldValue(
      "product-quantity",
      count.get === 0 ? "" : count.get.toString()
    );
  }, [count.get]);
  const orderSuccess = useCopyState(false);
  const orderId = useCopyState<string | null>(null);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const metadata = useMemo(() => {
    return Object.entries(product?.metaData || {}).map(([key, value]) => {
      return {
        key,
        value,
      };
    });
  }, [product]);
  const DescriptionPart = () => {
    return (
      <EmptyComponent>
        {metadata.length > 0 && (
          <EmptyComponent>
            <Line />
            <FormSection title="metadata" />
            <Line />
            <div className="p-4">
              <Card>
                <div className="flex flex-col gap-2">
                  {metadata.map((data, index) => {
                    const value = data.value?.value;
                    return (
                      <div
                        key={data.key}
                        className={tw(
                          "flex justify-between items-center p-3 border-[--biqpod-borders] border-solid",
                          index && "border-b"
                        )}
                      >
                        <span className="font-semibold capitalize">
                          {data.key}
                        </span>
                        <span>
                          {typeof value === "string" ? (
                            value
                          ) : typeof value === "number" ? (
                            value
                          ) : typeof value === "boolean" ? (
                            <Icon
                              className={tw(
                                value
                                  ? "text-[--biqpod-success]"
                                  : "text-[--biqpod-error]"
                              )}
                              icon={
                                value
                                  ? allIcons.solid.faCheckCircle
                                  : allIcons.solid.faTimesCircle
                              }
                            />
                          ) : (
                            JSON.stringify(value)
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </EmptyComponent>
        )}
        <Line />
        <FormSection title="description" />
        <Line />
        <div className="p-4">
          <Card className="p-3">
            <MarkDown value={product?.description || "no description found"} />
          </Card>
        </div>
      </EmptyComponent>
    );
  };
  const StoreInfo = () => {
    if (!store) return null;
    return (
      <EmptyComponent>
        <FormSection title="store information" />
        <Line />
        <div className="p-4">
          <Card>
            <div className="flex items-center gap-4 p-2">
              {store.photo && (
                <img
                  src={store.photo}
                  alt={store.name}
                  className="rounded-full w-16 h-16 object-cover"
                />
              )}
              <div>
                <h3 className="font-bold text-lg">{store.name}</h3>
                {store.phone && (
                  <p className="text-sm">
                    <Translate content="phone label" />
                    {store.phone}
                  </p>
                )}
                {store.email && (
                  <p className="text-sm">
                    <Translate content="email label" />
                    <a href={`mailto:${store.email}`} className="text-blue-500">
                      {store.email}
                    </a>
                  </p>
                )}
              </div>
            </div>
            {store.address && (
              <EmptyComponent>
                <Line />
                <p className="p-2 text-sm">
                  <Translate content="location label" />
                  {store.address.latitude.toFixed(4)},{" "}
                  {store.address.longitude.toFixed(4)}
                </p>
              </EmptyComponent>
            )}
            {store.platforms && Object.keys(store.platforms).length > 0 && (
              <EmptyComponent>
                <Line />
                <div className="flex gap-2 p-2">
                  {Object.entries(store.platforms).map(([key, value]) => {
                    if (!value) return null;
                    const iconName = `fa${
                      key.charAt(0).toUpperCase() + key.slice(1)
                    }`;
                    const icon =
                      allIcons.brands[iconName as keyof typeof allIcons.brands];
                    if (!icon) return null;
                    return (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Icon icon={icon as IconProps["icon"]} />
                      </a>
                    );
                  })}
                </div>
              </EmptyComponent>
            )}
          </Card>
        </div>
      </EmptyComponent>
    );
  };
  return (
    <motion.div
      className="relative flex flex-col w-full h-full overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {!orderSuccess.get && product && (
        <EmptyComponent>
          <Scroll className="flex max-md:flex-col">
            {!!product.files?.length && (
              <motion.div className="w-full h-[50vh]" variants={itemVariants}>
                <FilesSlider viewContent zoom files={product?.files || []} />
                <div className="max-md:hidden">
                  <DescriptionPart />
                  <Line />
                  <StoreInfo />
                </div>
              </motion.div>
            )}
            <div className="max-md:hidden h-full">
              <div className="bg-[--biqpod-borders] w-[1px] h-full" />
            </div>
            <div className="w-full">
              <motion.div variants={itemVariants}>
                <Line />
                <h1 className="p-4 text-3xl capitalize">
                  {product.name || <Translate content="unnamed product" />}
                </h1>
                <Line />
                <FormSection title="form : " />
                <Line />
                <div className="p-4">
                  <Card className="bg-[--biqpod-gray-secondary-background]">
                    <div className="flex flex-col gap-2 p-2">
                      <label className="capitalize">
                        <Translate content="first name" /> :
                      </label>
                      <div className="flex items-center gap-2 bg-[--biqpod-field-background] px-3 border border-[--biqpod-borders] border-solid rounded-xl">
                        <span className="inline-flex justify-center items-center w-[18px]">
                          <Icon icon={allIcons.solid.faPersonBurst} />
                        </span>
                        <Field
                          className="bg-transparent border-none rounded-none"
                          inputName="client-firstname"
                          maxLength={40}
                          placeholder="enter your firstname"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                      <label className="capitalize">
                        <Translate content="last name" /> :
                      </label>
                      <div className="flex items-center gap-2 bg-[--biqpod-field-background] px-3 border border-[--biqpod-borders] border-solid rounded-xl">
                        <span className="inline-flex justify-center items-center w-[18px]">
                          <Icon icon={allIcons.solid.faPerson} />
                        </span>
                        <Field
                          className="bg-transparent border-none rounded-none"
                          inputName="client-lastname"
                          maxLength={40}
                          placeholder="enter your lastname"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                      <label className="capitalize">
                        <Translate content="phone" /> :
                      </label>
                      <div className="flex items-center gap-2 bg-[--biqpod-field-background] px-3 border border-[--biqpod-borders] border-solid rounded-xl">
                        <span className="inline-flex justify-center items-center w-[18px]">
                          <Icon icon={allIcons.solid.faPhone} />
                        </span>
                        <Field
                          className="bg-transparent border-none rounded-none"
                          maxLength={10}
                          controls={{
                            "[0-9]{10}": {
                              succ: "valid",
                              err: "invalid",
                            },
                          }}
                          inputMode="numeric"
                          inputName="client-phone"
                          placeholder="enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                      <label className="capitalize">
                        <Translate content="note" /> :
                      </label>
                      <Field
                        className="rounded-xl"
                        inputName="client-note"
                        multiLines
                        maxRows={3}
                        rows={3}
                        placeholder="enter your note optional"
                      />
                    </div>
                  </Card>
                </div>
                <Line />
                <div className="p-4">
                  <Card>
                    <div className="flex justify-center items-center gap-2 p-4">
                      <div className="w-full">
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
                          placeholder="quantity"
                          className="bg-[--biqpod-primary-background] focus:border-[--biqpod-primary] rounded-full outline-none text-3xl text-center"
                          style={{ background: "transparent" }}
                        />
                      </div>
                      <div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <CircleTip
                            className="inline-flex justify-center items-center rounded-full w-[40px] h-[40px] bg-[--biqpod-text-color] text-[--biqpod-primary-background] hover:bg-[--biqpod-text-color] active:hover:bg-[--biqpod-text-color] cursor-pointer"
                            onClick={() =>
                              count.set(Math.max(1, (count.get || 1) - 1))
                            }
                            icon={allIcons.solid.faMinus}
                          />
                        </motion.div>
                      </div>
                      <div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <CircleTip
                            className="inline-flex justify-center items-center rounded-full w-[40px] h-[40px] bg-[--biqpod-text-color] text-[--biqpod-primary-background] hover:bg-[--biqpod-text-color] active:hover:bg-[--biqpod-text-color] cursor-pointer"
                            onClick={() =>
                              count.set(Math.min(500, (count.get || 0) + 1))
                            }
                            icon={allIcons.solid.faPlus}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </div>
                <Line />
                {!!deliveryOptions?.length && (
                  <EmptyComponent>
                    <FormSection title="delivery" />
                    <div className="p-4">
                      <Card>
                        <div className="flex gap-2 p-4">
                          {deliveryOptions?.map((data) => {
                            const isSelected =
                              selectDeliveryOption.get &&
                              data.id === selectDeliveryOption.get?.id;
                            const icons: Record<string, IconProps["icon"]> = {
                              domicile: allIcons.solid.faHouse,
                              office: allIcons.solid.faBuilding,
                              store: allIcons.solid.faStore,
                            };
                            return (
                              <motion.div
                                key={data.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Card
                                  onClick={() => {
                                    selectDeliveryOption.set(data);
                                  }}
                                  className={tw(
                                    "w-full capitalize cursor-pointer",
                                    isSelected &&
                                      "border-[--biqpod-primary] bg-[--biqpod-secondary] text-[--biqpod-secondary-content]"
                                  )}
                                >
                                  <div className="flex justify-between items-center gap-2 p-5">
                                    <div className="flex items-center gap-2">
                                      {data.type && (
                                        <Icon icon={icons[data.type]} />
                                      )}
                                      <span>{data.type}</span>
                                    </div>
                                    {isSelected && (
                                      <Icon icon={allIcons.solid.faCheck} />
                                    )}
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                        {!!deliveryPlaces?.length && (
                          <EmptyComponent>
                            <Line />
                            <div className="p-4">
                              <EnumField
                                state={selectDeliveryPriceId}
                                config={{
                                  list: deliveryPlaces.map((d) => {
                                    return {
                                      value: d.id!,
                                      content: d.name,
                                    };
                                  }),
                                  search: true,
                                  placeholder: "Choos Wilaya On Click On Auto",
                                }}
                                id="delivery-pricing"
                              />
                            </div>
                          </EmptyComponent>
                        )}
                        <Line />
                        <div className="flex justify-between p-4">
                          <span />
                          <span className="flex items-center gap-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Button
                                icon={
                                  loading
                                    ? allIcons.solid.faCircleNotch
                                    : allIcons.solid.faLocationDot
                                }
                                className="p-4 rounded-full"
                                onClick={() => {
                                  execAction("auto-detect-location-in-product");
                                }}
                                iconClassName={tw(loading && "animate-spin")}
                              >
                                <Translate content="auto" />
                              </Button>
                            </motion.div>
                          </span>
                        </div>
                      </Card>
                    </div>
                    <Line />
                  </EmptyComponent>
                )}
                <div className="md:hidden">
                  <DescriptionPart />
                  <Line />
                  <StoreInfo />
                </div>
              </motion.div>
            </div>
          </Scroll>
          <Line />
          <motion.div className="flex gap-2 p-3" variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-full"
            >
              <Button
                className="p-3 rounded-xl text-lg"
                onClick={() => {
                  execAction("create-order-in-product");
                }}
                rightIcon={allIcons.solid.faChevronRight}
              >
                <Translate content="create order" />{" "}
                {(price * (count.get || 1)).toFixed(2)}DA
              </Button>
            </motion.div>
          </motion.div>
          {loadingAction && (
            <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
              <CircleLoading />
            </div>
          )}
        </EmptyComponent>
      )}
      {orderSuccess.get && (
        <motion.div
          className="flex flex-col justify-center items-center p-8 w-full h-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 max-w-md text-center">
            <Icon
              icon={allIcons.solid.faCheckCircle}
              className="mb-4 text-green-500 text-6xl"
            />
            <h2 className="mb-4 font-bold text-2xl">
              <Translate content="congratulations" />
            </h2>
            <p className="mb-6">
              <Translate content="order created successfully" />
            </p>
            <div className="flex flex-col gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  className="p-4 rounded-xl w-full text-lg"
                  onClick={() => {
                    if (orderId.get) {
                      hist.push(`/tracking?id=${orderId.get}`);
                    }
                  }}
                  icon={allIcons.solid.faTruck}
                >
                  <Translate content="track order" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  className="bg-[--biqpod-gray-opacity] p-4 rounded-xl w-full text-[--biqpod-text-color] text-lg"
                  onClick={() => {
                    orderSuccess.set(false);
                    orderId.set(null);
                  }}
                  icon={allIcons.solid.faArrowLeft}
                >
                  <Translate content="back to product" />
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}
      {!product && <CardWait className="w-full h-full" />}
    </motion.div>
  );
};
