import {
  Card,
  CardHeaderForPopup,
  Line,
  EnumField,
  CardWait,
  Button,
  EmptyComponent,
  Translate,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useAsyncMemo,
  useUser,
  useAction,
  showToast,
  closePopup,
  isLoading,
  execAction,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { delay } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
import { snapbuyApi } from "../../apis";

interface OrderVarientProps {
  store: SnapBuy.Store;
}
export const OrderVarient = ({ store }: OrderVarientProps) => {
  const varient = useCopyState<string | Nothing>(null);
  const varients = useAsyncMemo(async () => {
    await delay(1500);
    const varients = await snapbuyApi.varient.getList();
    return varients;
  }, []);
  const user = useUser();
  const setVarient = useAction(
    "upsert-varient-to-store",
    async () => {
      if (!user?.uid) {
        return;
      }
      await snapbuyApi.updateStore(store.id, {
        orderVarientId: varient.get || null,
      });
      showToast("Order Varient Updated", "success");
      closePopup();
      execAction("print-stores");
    },
    [user, varient.get]
  );
  const loading = isLoading(setVarient);
  useEffect(() => {
    varient.set(store.orderVarientId);
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full">
      <CardHeaderForPopup title="order varient" />
      <Line />
      <div className="p-3 max-md:h-full">
        {varients && (
          <EnumField
            config={{
              placeholder: "Select Order Varient",
              list: varients?.map((varient) => {
                return {
                  content: varient.name,
                  value: varient.id,
                };
              }),
              search: true,
            }}
            id="order-varient"
            state={varient}
          />
        )}
        {!varients && <CardWait className="rounded-2xl w-full h-[50px]" />}
      </div>
      <Line />
      <div className="p-3">
        <Button
          className="rounded-full"
          onClick={async () => {
            execAction("upsert-varient-to-store");
          }}
        >
          {!loading ? (
            <EmptyComponent>
              <Translate content="set for" /> {store.name}
            </EmptyComponent>
          ) : (
            <Translate content="loading..." />
          )}
        </Button>
      </div>
    </Card>
  );
};
