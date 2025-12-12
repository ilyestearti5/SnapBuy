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
  Icon,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import {
  useTemp,
  setFieldValue,
  setTemp,
  execAction,
  closeBottomSheet,
  closePopup,
  getAction,
  showPopup,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { SetStorePlatforms } from "./SetStorePlatforms";
import { platformsPhoto } from "../../utils/platforms";
interface UpsertStoreProps {
  store?: Biqpod.Snapbuy.Store;
}
export const UpsertStore = ({ store }: UpsertStoreProps) => {
  const photoState = useTemp<string | Nothing>("store-photo");
  useEffect(() => {
    setFieldValue("store-name", store?.name || "");
    setFieldValue("store-phone", store?.phone || "");
    setFieldValue("store-email", store?.email || "");
    setTemp("store-photo", store?.photo || null);
  }, []);
  const action = getAction("upsert-store");
  const loadingAction = action?.status === "loading";
  const activePlatforms = useMemo(() => {
    if (!store?.platforms) return [];
    return Object.entries(store.platforms).filter(([_, value]) => value);
  }, [store?.platforms]);
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
          <Field
            className="rounded-xl"
            inputName="store-name"
            placeholder="Enter Store Name"
          />
          <Field
            className="rounded-xl"
            inputName="store-phone"
            placeholder="Enter Store Phone"
            inputMode="tel"
            controls={{
              "^(0|\\+[0-9]{1,3})[0-9]{9}$": {
                succ: "valid",
                err: "invalid",
              },
            }}
          />
          <Field
            className="rounded-xl"
            inputName="store-email"
            placeholder="Enter Store Email"
            inputMode="email"
            controls={{
              "[^@\\s]+@[^@\\s]+\\.[^@\\s]+": {
                succ: "valid",
                err: "invalid",
              },
            }}
          />
        </div>
      </div>
      {/* Platforms Section - Only show for existing stores */}
      {store && (
        <EmptyComponent>
          <Line />
          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg capitalize">
                <Translate content="store platforms" />
              </h3>
              <Button
                onClick={() => {
                  const id = crypto.randomUUID();
                  showPopup(<SetStorePlatforms store={store} popupId={id} />, {
                    id,
                  });
                }}
                className="px-3 py-1 w-fit text-sm"
                icon={allIcons.solid.faGlobe}
              >
                <Translate content="manage platforms" />
              </Button>
            </div>
            {activePlatforms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activePlatforms.map(([platformId, _]) => {
                  const photo =
                    platformsPhoto[platformId as keyof typeof platformsPhoto];
                  return (
                    <div
                      key={platformId}
                      className="flex items-center gap-1 bg-[--biqpod-gray-opacity] px-2 py-1 rounded-full"
                    >
                      {photo && (
                        <img
                          src={photo}
                          alt={platformId}
                          className="rounded w-4 h-4"
                        />
                      )}
                      <span className="text-xs capitalize">{platformId}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[--biqpod-gray-opacity-2] py-4 text-center">
                <Icon icon={allIcons.solid.faGlobe} className="mb-1 text-2xl" />
                <div className="text-sm">
                  <Translate content="no platforms configured" />
                </div>
              </div>
            )}
          </div>
        </EmptyComponent>
      )}
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
