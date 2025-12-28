import { allIcons } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  EmptyComponent,
  Field,
  Image,
  Line,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  setFieldValue,
  showToast,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { snapbuyApi } from "../apis";
import { motion } from "framer-motion";
import { delay, tw } from "@biqpod/app/ui/utils";
export const Tracking = () => {
  const loc = useLocation();
  const trackingId = useMemo(() => {
    const trackingId = new URLSearchParams(loc.search).get("id");
    return trackingId;
  }, [loc.search]);
  useEffect(() => {
    const id = trackingId?.replaceAll(/ +/gi, "-");
    setFieldValue("tracking-value", id || "");
  }, [trackingId]);
  const trackingValue = getFieldValue("tracking-value");
  const order = useCopyState<Biqpod.Snapbuy.Order | null>(null);
  const gettingOrderLoading = useCopyState(false);
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Card className="w-[80vw]">
        <div className="flex justify-between items-center p-3">
          <h1 className="font-bold text-3xl capitalize">
            <Translate content="tracking" />
          </h1>
        </div>
        <Line />
        <div className="p-3">
          <Field
            className="rounded-xl font-bold text-2xl text-center"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            inputName="tracking-value"
            inputMode="numeric"
          />
        </div>
        <Line />
        <div className="p-3">
          <Button
            className="p-3 rounded-2xl"
            rightIcon={
              gettingOrderLoading.get
                ? allIcons.solid.faSpinner
                : allIcons.solid.faShippingFast
            }
            onClick={async () => {
              if (!trackingValue) {
                return;
              }
              order.set(null);
              gettingOrderLoading.set(true);
              try {
                await delay(500);
                const orderData = await snapbuyApi.order.get(
                  trackingValue.replaceAll("-", "")
                );
                if (orderData) {
                  order.set(orderData);
                } else {
                  showToast("No order found with this tracking ID.", "error");
                }
              } catch {}
              gettingOrderLoading.set(false);
            }}
            iconClassName={tw(gettingOrderLoading.get && "animate-spin")}
          >
            <Translate
              content={gettingOrderLoading.get ? "Loading..." : "Track Order"}
            />
          </Button>
        </div>
        {order.get && (
          <EmptyComponent>
            <Line />
            <Scroll className="h-fit max-h-[50vh]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="bg-[--biqpod-primary-background] p-3 font-bold text-xl">
                  <Translate content="Order Details" />
                </h2>
                <Line />
                <div className="space-y-3 p-3">
                  <motion.div
                    className="flex justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <span className="font-medium">
                      <Translate content="Order ID" />:
                    </span>
                    <span>{order.get.id}</span>
                  </motion.div>
                  <motion.div
                    className="flex justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <span className="font-medium">
                      <Translate content="Status" />:
                    </span>
                    <span className="capitalize">
                      {order.get.status || "Pending"}
                    </span>
                  </motion.div>
                  {order.get.client && (
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <span className="font-medium">
                        <Translate content="Client" />:
                      </span>
                      <span>
                        {order.get.client?.firstname}{" "}
                        {order.get.client?.lastname}
                      </span>
                    </motion.div>
                  )}
                  {order.get.client?.phone && (
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <span className="font-medium">
                        <Translate content="Phone" />:
                      </span>
                      <span>{order.get.client?.phone}</span>
                    </motion.div>
                  )}
                  {order.get.place && (
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <span className="font-medium">
                        <Translate content="Address" />:
                      </span>
                      <span>{order.get.place.address}</span>
                    </motion.div>
                  )}
                  {order.get.products && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <span className="font-medium">
                        <Translate content="Products" />:
                      </span>
                      <div className="bg-[--biqpod-primary-background] mt-3 border border-[--biqpod-borders] border-solid rounded-xl overflow-hidden">
                        {Object.entries(order.get.products).map(
                          ([productId, product], index) => (
                            <motion.div
                              key={productId}
                              className={tw(
                                "flex justify-between items-center odd:bg-[--biqpod-secondary-background] p-2 rounded",
                                index &&
                                  "border-t border-[--biqpod-borders] border-solid"
                              )}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: 0.7 + index * 0.1,
                              }}
                            >
                              <AsyncComponent
                                render={async () => {
                                  const product = await snapbuyApi.product.get(
                                    productId
                                  );
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Image
                                        className="bg-[--biqpod-gray-opacity] w-[40px] h-[40px]"
                                        src={product?.files?.at(0)?.url}
                                        alt={
                                          <EmptyComponent>
                                            {product?.name
                                              ?.at(0)
                                              ?.toUpperCase()}
                                          </EmptyComponent>
                                        }
                                      />
                                      <span>{product?.name}</span>
                                    </div>
                                  );
                                }}
                                loading={
                                  <CardWait className="w-[120px] h-[40px]" />
                                }
                              />
                              <span>Qty: {product?.count}</span>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                  {order.get.note && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <h1 className="font-medium">
                        <Translate content="Note" />:
                      </h1>
                      <div>
                        <MarkDown value={order.get.note} />
                      </div>
                    </motion.div>
                  )}
                  {order.get.createdAt && (
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                    >
                      <span className="font-medium">
                        <Translate content="Created At" />:
                      </span>
                      <span>
                        {new Date(order.get.createdAt).toLocaleString()}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </Scroll>
          </EmptyComponent>
        )}
      </Card>
    </div>
  );
};
