import { allIcons, and, where } from "biqpod/ui/apis";
import {
  Anchor,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  IconProps,
  InfinityScroll,
  Line,
  Scroll,
} from "biqpod/ui/components";
import {
  getFieldValue,
  getTempFromStore,
  showPopup,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { include, tw } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
import { OrderProducts } from "./OrderProducts/OrderProducts";
import { Biqpod } from "biqpod/ui/types";
import { getDoc, onCollectionSnapshot } from "../server";
const colors: Record<string, string> = {
  pending: "#F59E0B", // Yellow
  completed: "#10B981", // Green
  processing: "#3B82F6", // Blue
  done: "#047857", // Dark Green
  cancelled: "#EF4444", // Red
};
const icons: Record<string, IconProps["icon"]> = {
  pending: allIcons.solid.faClock,
  completed: allIcons.solid.faCheckCircle,
  processing: allIcons.solid.faCog,
  done: allIcons.solid.faCheckDouble,
  cancelled: allIcons.solid.faBan,
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
  useEffect(() => {
    if (user?.uid) {
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
          where: and(where("uid", "==", user.uid)),
        }
      );
    }
  }, [user]);
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
        <span className="w-full">Order ID</span>
        <div className="w-full">
          <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
            <Icon icon={allIcons.solid.faTag} />
            <span>Status</span>
          </span>
        </div>
        <span className="w-full">Created At</span>
        <div>
          <CircleTip className="invisible" icon={allIcons.solid.faEllipsisV} />
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
            return (
              <div
                key={order.id}
                className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-2"
              >
                <span className="w-full">
                  <Anchor
                    onClick={() => {
                      showPopup(<OrderProducts order={order} />);
                    }}
                  >
                    {order.id}
                  </Anchor>
                </span>
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
                <div>
                  <CircleTip icon={allIcons.solid.faEllipsisV} />
                </div>
              </div>
            );
          })}
      </Scroll>
    </div>
  );
};
