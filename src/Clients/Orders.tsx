import { allIcons } from "biqpod/ui/apis";
import {
  Card,
  CardWait,
  CircleTip,
  Field,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  closePopup,
  getFieldValue,
  openMenu,
  showPopup,
  useAsyncMemo,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { include, range, tw } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
import { onCollectionSnapshot } from "../server";
import { api, useCurrentClient } from "../apis";
import { colors, icons } from "../Links/Orders";
export interface OrderView {
  order: SnapBuy.Order;
}
export const OrderView = ({ order }: OrderView) => {
  const time = new Date(order.createdAt!);
  const productsLengths = Object.keys(order.products || {}).length;
  const currentClient = useCurrentClient();
  const list = useAsyncMemo(async () => {
    return api.getOrderProducts(order.id);
  }, [currentClient]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full">
      <div className="flex justify-between items-center p-2">
        <h1 className="md:text-xl text-2xl">{time.toLocaleString()}</h1>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {list?.map((product, index) => {
          const photos = product.photos || [];
          const photo = photos.at(0);
          const total = (product.price || 0) * product.count;
          return (
            <div
              key={product.id}
              className="odd:bg-[--biqpod-primary-background] mx-3 my-1 rounded-xl"
            >
              <div className="flex items-center gap-4 p-2 h-[120px]">
                <div>
                  <Image
                    src={photo}
                    className="bg-[--biqpod-gray-opacity] rounded-2xl w-[60px] h-[60px] cursor-pointer"
                    alt={<Icon icon={allIcons.solid.faImage} />}
                    onClick={() => {
                      // show image gareile
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p>{product.name}</p>
                  <div
                    className={tw(
                      "flex justify-between items-center  bg-[--biqpod-gray-opacity] px-4 py-1 rounded-xl"
                    )}
                  >
                    <span className="font-bold text-[--biqpod-success] text-right">
                      {product.price}
                    </span>
                    <div className="bg-[--biqpod-secondary-background] px-2 rounded-md">
                      {product.count}
                    </div>
                    <span className="font-bold text-[--biqpod-success] text-right">
                      {total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {list?.length === 0 && (
          <div className="flex flex-col justify-center items-center gap-3 p-5 h-full">
            <Icon iconClassName="text-8xl" icon={allIcons.solid.faStore} />
            <span>
              <Translate content="Empty Order !" />
            </span>
          </div>
        )}
        {!list &&
          range(productsLengths).map((index) => {
            return (
              <div
                className="odd:bg-[--biqpod-primary-background] mx-3 my-1 rounded-xl h-[120px]"
                key={index}
              >
                <CardWait className="rounded-2xl w-full" />
              </div>
            );
          })}
      </Scroll>
    </Card>
  );
};
export const Orders = () => {
  const searchOrder = getFieldValue("search-order");
  const isFocused = useCopyState(false);
  useEffect(() => {
    return () => {
      isFocused.set(false);
    };
  }, []);
  const currentTime = useMemo(() => {
    return new Date();
  }, []);
  const orders = useCopyState<SnapBuy.Order[]>([]); // Replace with your actual orders data
  const user = useUser();
  const currentClient = useCurrentClient();
  useEffect(() => {
    // if (currentClient?.client.id) {
    return onCollectionSnapshot<SnapBuy.Order>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
      (snapshot) => {
        const ordersData = snapshot.map((doc) => ({
          ...doc.data,
          id: doc.id,
        }));
        orders.set(ordersData);
      },
      {
        // where: and(where("clientId", "==", currentClient?.client.id)),
      }
    );
    // }
  }, [currentClient]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div
          className={tw(
            "min-w-[30%] transition-[min-width]",
            isFocused.get && "max-md:min-w-[60%]"
          )}
        >
          <Field
            propositions={["@status"]}
            onFocus={() => {
              isFocused.set(true);
            }}
            onBlur={() => {
              isFocused.set(false);
            }}
            inputName="search-order"
            placeholder="Search Order"
            className="rounded-xl"
          />
        </div>
        <div>
          <CircleTip icon={allIcons.solid.faFilter} />
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faUser} />
          <Translate content="client" />
        </span>
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faCalendarAlt} />
          <Translate content="created at" />
        </span>
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faBox} />
          <Translate content="products" />
        </span>
        <div className="invisible">
          <CircleTip icon={allIcons.solid.faEllipsisV} />
        </div>
      </div>
      <Line />
      <Scroll>
        {orders.get
          .filter((order) => {
            return include(`${order.id} @status ${order.status}`, searchOrder);
          })
          .map((order) => {
            const time = new Date(order.createdAt!);
            const timeDifference = Math.floor(
              (currentTime.getTime() - time.getTime()) / 1000
            );
            let timeAgo = "";
            if (timeDifference < 60) {
              timeAgo = `${timeDifference} sec${
                timeDifference > 1 ? "s" : ""
              } ago`;
            } else if (timeDifference < 3600) {
              const minutes = Math.floor(timeDifference / 60);
              timeAgo = `${minutes} min${minutes > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 86400) {
              const hours = Math.floor(timeDifference / 3600);
              timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 604800) {
              const days = Math.floor(timeDifference / 86400);
              timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 2419200) {
              const weeks = Math.floor(timeDifference / 604800);
              timeAgo = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 29030400) {
              const months = Math.floor(timeDifference / 2419200);
              timeAgo = `${months} month${months > 1 ? "s" : ""} ago`;
            } else {
              const years = Math.floor(timeDifference / 29030400);
              timeAgo = `${years} year${years > 1 ? "s" : ""} ago`;
            }
            const { products = {} } = order;
            const productCount = Object.keys(products).length;
            return (
              <div
                key={order.id}
                className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-2"
              >
                <div className="w-full">
                  <span
                    className="inline-flex items-center gap-2 p-2 rounded-2xl"
                    style={{
                      color: colors[order.status],
                      backgroundColor: `${colors[order.status]}20`,
                    }}
                  >
                    <Icon icon={icons[order.status]} />
                    <span>{order.status}</span>
                  </span>
                </div>
                <span className="w-full">{timeAgo}</span>
                <span className="w-full">
                  <span className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background]">
                    {productCount}
                  </span>
                </span>
                <div>
                  <CircleTip
                    icon={allIcons.solid.faEllipsisV}
                    onClick={({ clientX, clientY }) => {
                      openMenu({
                        x: clientX,
                        y: clientY,
                        menu: [
                          {
                            label: "View Order",
                            defaultIcon: allIcons.solid.faEye,
                            click: () => {
                              showPopup(<OrderView order={order} />);
                            },
                          },
                        ],
                      });
                    }}
                  />
                </div>
              </div>
            );
          })}
      </Scroll>
    </div>
  );
};
