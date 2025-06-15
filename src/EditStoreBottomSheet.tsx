import { allIcons } from "@biqpod/app/ui/apis";
import {
  Translate,
  Line,
  ImageField,
  Field,
  Button,
  Card,
  CircleTip,
  CircleLoading,
  NumberField,
} from "@biqpod/app/ui/components";
import {
  useTemp,
  setFieldValue,
  setTemp,
  execAction,
  closeBottomSheet,
  closePopup,
  getAction,
  confirm,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
interface UpsertStoreProps {
  store?: SnapBuy.Store;
}
export const UpsertStore = ({ store }: UpsertStoreProps) => {
  const photoState = useTemp<string | Nothing>("store-photo");
  const deliveryPriceState = useTemp<number | null | undefined>(
    "store-delivery-price"
  );
  useEffect(() => {
    setFieldValue("store-name", store?.name || "");
    setFieldValue("store-phone", store?.phone || "");
    setTemp("store-photo", store?.photo || null);
    setTemp("store-delivery-price", store?.deliveryPrice || null);
  }, []);
  const action = getAction("upsert-store");
  const loadingAction = action?.status === "loading";
  // const storeName = getFieldValue("store-name");
  return (
    <Card className="relative max-md:rounded-none max-md:w-full min-w-[400px] max-md:h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-3">
        <h1 className="font-bold text-3xl uppercase">
          <Translate content={store ? "edit store" : "add store"} />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
              closeBottomSheet();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-3">
        <ImageField id="store-photo" state={photoState} />
      </div>
      <Line />
      <div className="h-full">
        <div className="flex flex-col gap-2 p-2">
          <Field inputName="store-name" placeholder="Enter Store Name" />
          <Field
            inputName="store-phone"
            placeholder="Enter Store Phone"
            maxLength={10}
            inputMode="tel"
            controls={{
              "[0-9]{10}": {
                succ: "valid",
                err: "invalid",
              },
            }}
          />
          <div className="relative">
            <NumberField
              state={deliveryPriceState}
              config={{
                autoChange: true,
                placeholder: "Enter Delivery Price",
                min: 0,
              }}
              id="store-delivery-price"
            />
            {!deliveryPriceState.get && (
              <span className="top-1/2 right-2 absolute bg-red-700 px-2 py-[1px] rounded-full font-bold text-white capitalize -translate-y-1/2">
                <Translate content="free" />
              </span>
            )}
            {!!deliveryPriceState.get && (
              <span className="top-1/2 right-2 absolute px-2 py-[1px] text-[--biqpod-primary] -translate-y-1/2">
                <Translate content="DA" />
              </span>
            )}
          </div>
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        {!loadingAction && (
          <Button className="bg-[--biqpod-gray-opacity] p-3 text-[--biqpod-text-color]">
            <Translate content="cancel" />
          </Button>
        )}
        <Button
          icon={
            loadingAction
              ? allIcons.solid.faSpinner
              : store
              ? allIcons.solid.faPen
              : allIcons.solid.faPlus
          }
          iconClassName={tw(loadingAction && "animate-spin")}
          onClick={async () => {
            if (!deliveryPriceState.get) {
              const response = await confirm({
                title: "Delivery Pricing",
                message:
                  "Are you sure you want to set the delivery price to free?",
                detail:
                  "Setting the delivery price to free means that you will not charge any delivery fee for your customers.",
                type: "warning",
              });
              if (!response) {
                return;
              }
            }
            execAction("upsert-store", store?.id);
          }}
          className="p-3"
        >
          <Translate content={store ? "update store" : "add store"} />
        </Button>
      </div>
      {loadingAction && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
