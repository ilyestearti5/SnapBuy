import { allIcons } from "@biqpod/app/ui/apis";
import {
  Translate,
  Line,
  ImageField,
  Field,
  Button,
  CircleLoading,
  Card,
  CircleTip,
} from "@biqpod/app/ui/components";
import {
  useTemp,
  setFieldValue,
  setTemp,
  execAction,
  closeBottomSheet,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
import { useActionStatus } from "./CartPopup";
interface UpsertStoreProps {
  store?: SnapBuy.Store;
}
export const UpsertStore = ({ store }: UpsertStoreProps) => {
  const photoState = useTemp<string | Nothing>("store-photo");
  useEffect(() => {
    setFieldValue("store-name", store?.name || "");
    setFieldValue("store-phone", store?.phone || "");
    setTemp("store-photo", store?.photo || null);
  }, []);
  const status = useActionStatus("upsert-new-store");
  const loadingAction = status.isLoading;
  // const storeName = getFieldValue("store-name");
  return (
    <Card className="relative max-md:rounded-none max-md:w-full min-w-[400px] max-md:h-full">
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
          {/* <div
              className={tw(
                "flex justify-between items-center transition-[height] duration-300 gap-2 h-[0px] overflow-hidden",
                storeName && !store && "h-[50px]"
              )}
            >
              <div></div>
              <div className="bg-[--biqpod-primary-background] px-2 border border-[--biqpod-borders] border-solid rounded-full">
                {storeName ? toId(storeName) : "-"}
              </div>
            </div> */}
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
            await execAction("upsert-new-store", store?.id);
            closeBottomSheet();
            closePopup();
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
