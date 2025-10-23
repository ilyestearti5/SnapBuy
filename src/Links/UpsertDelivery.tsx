import { allIcons, getDoc, getDocs } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Button,
  Line,
  Field,
  Scroll,
  Icon,
  CardWait,
  EmptyComponent,
  CircleLoading,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  getTemp,
  setFieldValue,
  setTemp,
  useAsyncMemo,
  useUser,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { Biqpod } from "@biqpod/app/ui/types";
import { filterFuzzySearch, range, tw } from "@biqpod/app/ui/utils";
import { useFetchMoreAction } from "../utils";
import { useEffect, useMemo } from "react";
export interface UpsertDeliveryProps {
  order: Snapbuy.Order;
}
export interface DeliveryUser {
  uid?: string;
  name?: string;
  photo?: string;
}
export const UpsertDelivery = ({ order }: UpsertDeliveryProps) => {
  const action = useFetchMoreAction<DeliveryUser>(
    "load-users",
    20,
    async () => {
      const docs = await getDocs<DeliveryUser>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "deliveries"],
        {}
      );
      return docs?.map((doc) => {
        return doc.data;
      });
    },
    []
  );
  const user = useUser();
  useEffect(() => {
    if (user?.uid) {
      action.fetchInit();
    }
  }, [user]);
  const searchValue = getFieldValue("search-delivery");
  const filterdUsers = useMemo(() => {
    return filterFuzzySearch(action.data.get, searchValue || "", "name");
  }, [searchValue, action.data.get]);
  const loading = getTemp<boolean>("delivery-loading");
  const currentUser = useAsyncMemo(async () => {
    if (order.delivery?.uid) {
      return getDoc<Biqpod.Account.User>(["users", order.delivery?.uid]);
    } else {
      return null;
    }
  }, []);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-[80vw] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-3xl capitalize">
          <Translate content="set delivery company" />
        </h1>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Field
          placeholder="Search For Delivery"
          inputName="search-delivery"
          className="rounded-xl"
        />
      </div>
      <Line />
      {currentUser && (
        <EmptyComponent>
          <div className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-2">
            <div className="flex items-center gap-2">
              <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-[40px] h-[40px] overflow-hidden">
                {currentUser.photo && (
                  <img
                    src={currentUser.photo}
                    className="w-full h-full object-cover"
                  />
                )}
                {!currentUser.photo && <Icon icon={allIcons.solid.faUser} />}
              </div>
              <div className="flex flex-col">
                <span className="font-bold">
                  {currentUser.firstname} {currentUser.lastname}
                </span>
                <span className="text-sm">{currentUser.email}</span>
              </div>
            </div>
            <div>
              <Button
                onClick={async () => {
                  if (currentUser.uid) {
                    setTemp("delivery-loading", true);
                    try {
                      await snapbuyApi.setDeliveryToOrder({
                        orderId: order.id,
                        delivery: null,
                      });
                      closePopup();
                      execAction("fetch-orders", false);
                    } catch {}
                    setTemp("delivery-loading", false);
                  }
                }}
                className="rounded-full"
              >
                <Translate content="un select" />
              </Button>
            </div>
          </div>
          <Line />
        </EmptyComponent>
      )}
      <Scroll>
        <div className="flex flex-col gap-2">
          {action.action?.status === "loading" &&
            range(8).map((index) => {
              const isOdd = index % 2 === 0;
              return (
                <CardWait
                  key={index}
                  className="flex items-center gap-2 p-2 w-full h-[70px]"
                >
                  <CardWait className="rounded-full w-[40px] h-[40px]" />
                  <div className="flex flex-col gap-2">
                    <CardWait
                      className={tw(
                        "rounded-xl h-[20px]",
                        isOdd && "w-[300px]",
                        !isOdd && "w-[150px]"
                      )}
                    />
                    <CardWait
                      className={tw(
                        "rounded-xl h-[20px]",
                        !isOdd && "w-[300px]",
                        isOdd && "w-[150px]"
                      )}
                    />
                  </div>
                </CardWait>
              );
            })}
          {action.action?.status === "success" && (
            <EmptyComponent>
              {filterdUsers.map((user, index) => {
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-[40px] h-[40px] overflow-hidden">
                        {user.photo && (
                          <img
                            src={user.photo}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!user.photo && <Icon icon={allIcons.solid.faUser} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">{user.name}</span>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={async () => {
                          if (user) {
                            setTemp("delivery-loading", true);
                            try {
                              await snapbuyApi.setDeliveryToOrder({
                                orderId: order.id,
                                delivery: user.uid || null,
                              });
                              closePopup();
                              execAction("fetch-orders", false);
                            } catch (e) {}
                            setTemp("delivery-loading", false);
                          }
                        }}
                        className="rounded-full"
                      >
                        <Translate content="select" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filterdUsers.length === 0 && (
                <div className="flex items-center gap-2 p-2">
                  <div>
                    <CircleTip
                      icon={allIcons.solid.faXmark}
                      onClick={() => {
                        setFieldValue("search-delivery", "");
                      }}
                    />
                  </div>
                  <span>
                    <Translate content="no delivery found for value" />{" "}
                    {searchValue}
                  </span>
                </div>
              )}
            </EmptyComponent>
          )}
        </div>
      </Scroll>
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center backdrop-blur-sm">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
