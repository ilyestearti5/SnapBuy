import {
  allIcons,
  and,
  CloudSelection,
  getDocs,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
import {
  Card,
  CardWait,
  CircleTip,
  Icon,
  Line,
  Scroll,
  Translate,
  EmptyComponent,
  Field,
  AsyncComponent,
} from "@biqpod/app/ui/components";
import {
  useAction,
  useCopyState,
  useUser,
  showPopup,
  execAction,
  useTemp,
  isLoading,
  getTemp,
  isSuccess,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { snapbuyApi } from "../apis";
import { mergeArray, range } from "@biqpod/app/ui/utils";
import { Nothing } from "@biqpod/app/ui/types";
import { FilterPopup } from "./FilterPopup";
import { AssignDeliveryAgent } from "./AssignDeliveryAgent";
import { OrderView } from "../routes/Clients/OrderView";
import {
  OrderClientDisplay,
  OrderClientPhone,
  OrderClientAddress,
  OrderClientWilaya,
  OrderClientMenuActions,
} from "../components/OrderClientDisplay";
interface DeliveryOrdersProps {}
const PAGE_SIZE = 20;
export const DeliveryOrders = ({}: DeliveryOrdersProps) => {
  const user = useUser();
  const orders = useCopyState<Souqify.Order[] | null>(null);
  const filterStatus = useTemp<string | Nothing>(
    "filter-delivery-management-status"
  );
  const filterDelivery = getTemp<string>("filter-delivery-management-delivery");
  const lastDoc = useCopyState<Souqify.Order | null>(null);
  const hasMore = useCopyState(false);
  const action = useAction(
    "fetch-delivery-orders",
    async (next: boolean) => {
      if (!user?.uid) {
        return;
      }
      // const currentTime = new Date();
      // var subTime: Date | null = null;
      const selection: CloudSelection<Souqify.Order> = {
        orders: mergeArray(orderBy("createdAt", "desc")),
        limit: PAGE_SIZE,
        where: and(where("delivery.uid", "==", user.uid)),
        startAt:
          next && lastDoc.get?.createdAt ? [lastDoc.get?.createdAt] : undefined,
      };
      const newOrders = await getDocs<Souqify.Order>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
        selection
      );
      if (!newOrders) {
        return;
      }
      const list = newOrders.map((order) => ({ ...order.data, id: order.id }));
      orders.set((prev) => (next && prev ? [...prev, ...list] : list));
      const lastDocRef = newOrders.at(-1)?.data;
      lastDoc.set(lastDocRef || null);
      hasMore.set(newOrders.length === PAGE_SIZE);
    },
    [user?.uid, lastDoc.get, filterDelivery]
  );
  const loading = isLoading(action);
  useEffect(() => {
    if (user?.uid) {
      execAction("fetch-delivery-orders");
    }
  }, [user?.uid, filterStatus.get]);
  const success = isSuccess(action);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-2 p-2">
        <h1 className="font-bold text-2xl">
          <Translate content="delivery management" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => showPopup(<FilterPopup />)}
            title="Filter orders"
          />
        </div>
      </div>
      <Line />
      <div className="flex items-center p-2">
        <Field
          inputName="search-delivery"
          className="rounded-xl"
          placeholder="Search Delivery"
        />
      </div>
      <Line />
      {success && (
        <EmptyComponent>
          {!!orders.get?.length && (
            <Scroll>
              <div className="flex flex-col gap-2 p-2">
                {orders.get?.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="flex justify-between items-center p-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <OrderClientDisplay
                            order={order}
                            className="font-semibold"
                            showCustomerBadge={true}
                          />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>
                              <Translate content="store" />:
                            </strong>{" "}
                            {order.storeId && (
                              <AsyncComponent
                                render={async () => {
                                  const store = await snapbuyApi.getStore(
                                    order.storeId!
                                  );
                                  return (
                                    <EmptyComponent>
                                      {store?.name}
                                    </EmptyComponent>
                                  );
                                }}
                                loading={
                                  <span className="capitalize">
                                    <Translate content="loading" />
                                    ...
                                  </span>
                                }
                              />
                            )}
                          </p>
                          <p>
                            <strong>
                              <Translate content="agent" />:
                            </strong>{" "}
                            {order.delivery?.agentId && (
                              <AsyncComponent
                                deps={[order.delivery.agentId]}
                                render={async () => {
                                  const agent = await snapbuyApi.getAccount(
                                    order.delivery?.agentId!
                                  );
                                  return (
                                    <EmptyComponent>
                                      {agent?.firstname} {agent?.lastname}
                                    </EmptyComponent>
                                  );
                                }}
                              />
                            )}
                            {!order.delivery?.agentId && (
                              <Translate content="not assigned yet" />
                            )}
                          </p>
                          <p>
                            <strong>
                              <Translate content="phone" />:
                            </strong>{" "}
                            <OrderClientPhone order={order} />
                          </p>
                          <p>
                            <strong>
                              <Translate content="address" />:
                            </strong>{" "}
                            <OrderClientAddress order={order} />
                          </p>
                          <OrderClientWilaya order={order} />
                          <p>
                            <strong>
                              <Translate content="items" />:
                            </strong>{" "}
                            <span className="bg-[--biqpod-primary-background] px-1 border border-[--biqpod-borders] border-solid rounded-xl font-semibold">
                              {Object.values(order.products || {}).length +
                                Object.values(order.packs || {}).length}
                            </span>
                          </p>
                          {order.createdAt && (
                            <p>
                              <strong>
                                <Translate content="created" />:
                              </strong>{" "}
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between gap-2 ml-4 h-full">
                        <div className="flex gap-1">
                          <OrderClientMenuActions
                            order={order}
                            onViewOrder={() => {
                              showPopup(<OrderView order={order} />);
                            }}
                            onAssignAgent={() => {
                              showPopup(<AssignDeliveryAgent order={order} />);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Scroll>
          )}
          {!orders.get?.length && (
            <div className="flex justify-center items-center h-full">
              <Card>
                <div className="flex justify-center items-center">
                  <Icon
                    iconClassName="text-red-600 text-7xl"
                    icon={allIcons.solid.faXmark}
                  />
                </div>
                <Line />
                <div className="p-3 text-center">
                  <p>
                    <Translate content="no delivery founded" />
                  </p>
                </div>
              </Card>
            </div>
          )}
        </EmptyComponent>
      )}
      {loading && (
        <div className="flex flex-wrap flex-1 items-center gap-2 p-2 h-full overflow-hidden">
          {range(10).map((i) => (
            <CardWait key={i} className="rounded-2xl w-full h-[300px]" />
          ))}
        </div>
      )}
    </div>
  );
};
