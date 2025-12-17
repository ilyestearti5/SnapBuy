import { allIcons } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  EmptyComponent,
  Field,
  Line,
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
          />
        </div>
        <Line />
        <div className="p-3">
          <Button
            className="p-4 rounded-2xl"
            rightIcon={allIcons.solid.faChevronRight}
            onClick={async () => {
              if (!trackingValue) {
                return;
              }
              order.set(null);

              const orderData = await snapbuyApi.order.get(
                trackingValue.replaceAll("-", "")
              );

              if (orderData) {
                order.set(orderData);
              } else {
                showToast("No order found with this tracking ID.", "error");
              }
            }}
          >
            <Translate content="track" />
          </Button>
        </div>
        {order.get && (
          <EmptyComponent>
            <Line />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="p-3 font-bold text-xl">
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
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <span className="font-medium">
                    <Translate content="Customer" />:
                  </span>
                  <span>
                    {order.get.client?.firstname} {order.get.client?.lastname}
                  </span>
                </motion.div>
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
                    <div className="bg-[--biqpod-primary-background] mt-3 border border-[--biqpod-borders] border-solid rounded-xl">
                      {Object.entries(order.get.products).map(
                        ([productId, product], index) => (
                          <motion.div
                            key={productId}
                            className="flex justify-between p-2 rounded"
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
                                return <span>{product?.name}</span>;
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
                    className="flex justify-between"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <span className="font-medium">
                      <Translate content="Note" />:
                    </span>
                    <span>{order.get.note}</span>
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
          </EmptyComponent>
        )}
      </Card>
    </div>
  );
};
