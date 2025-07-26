import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Scroll,
  Field,
  Tip,
  Button,
  Translate,
  CircleLoading,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  showToast,
  useAction,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "./apis";
import { useEffect } from "react";
import { tw } from "@biqpod/app/ui/utils";
interface SetPixelsProps {
  store: SnapBuy.Store;
}
interface Pixel {
  id: keyof Required<Required<SnapBuy.Store>["pixels"]>;
  photo: string;
  color: string;
}
export const pixelsPhoto: Record<string, string> = {
  facebook:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png",
  instagram:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png",
  tiktok:
    "https://cdn.pixabay.com/photo/2021/06/15/12/28/tiktok-6338432_960_720.png",
  snapchat:
    "https://static.vecteezy.com/system/resources/previews/018/930/694/non_2x/snapchat-logo-snapchat-icon-transparent-free-png.png",
};
const pixels: Pixel[] = [
  {
    id: "facebook",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png",
    color: "#1877F2",
  },
  // {
  //   id: "instagram",
  //   photo:
  //     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png",
  //   color: "#C13584",
  // },
  {
    id: "tiktok",
    photo:
      "https://cdn.pixabay.com/photo/2021/06/15/12/28/tiktok-6338432_960_720.png",
    color: "#000000",
  },
  // {
  //   id: "snapchat",
  //   photo:
  //     "https://static.vecteezy.com/system/resources/previews/018/930/694/non_2x/snapchat-logo-snapchat-icon-transparent-free-png.png",
  //   color: "#FFFC00",
  // },
];
export const SetPixels = ({ store }: SetPixelsProps) => {
  const values = pixels.map((item) => ({
    item,
    value: getFieldValue(`pixel-${item.id}`),
  }));
  useEffect(() => {
    pixels.forEach((item) => {
      setFieldValue(`pixel-${item.id}`, store.pixels?.[item.id] || "");
    });
  }, []);
  const setStorePixelsAction = useAction(
    "set-store-pixels",
    async () => {
      const pixels: SnapBuy.Store["pixels"] = {};
      values.forEach(({ item, value }) => {
        if (value) {
          pixels[item.id] = value;
        }
      });
      await snapbuyApi.setStorePixels(store.id, pixels);
      closePopup();
    },
    [values]
  );
  const setStorePixelsActionLoading = isLoading(setStorePixelsAction);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full overflow-hidden">
      <CardHeaderForPopup title="Store Pixels" />
      <Line />
      <Scroll>
        {pixels.map((item) => (
          <div className="p-2">
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border border-solid rounded-xl"
              style={{
                borderColor: item.color,
              }}
            >
              <img
                src={item.photo}
                alt={item.id}
                className="rounded-full w-12 h-12"
              />
              <div className="flex flex-col gap-2 w-full">
                <span className="font-bold text-xl capitalize">
                  {item.id} :
                </span>
                <div className="relative w-full">
                  <Field
                    className="rounded-xl"
                    style={{
                      borderColor: item.color,
                    }}
                    placeholder="Enter Pixel ID"
                    inputName={`pixel-${item.id}`}
                  />
                  <Tip
                    icon={allIcons.solid.faPaste}
                    className="top-1/2 right-2 absolute -translate-y-1/2"
                    onClick={async () => {
                      const value = await navigator.clipboard.readText();
                      setFieldValue(`pixel-${item.id}`, value);
                      showToast("Pixel ID pasted successfully", "success");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={async () => {
            execAction("set-store-pixels");
          }}
        >
          <span className="capitalize">
            <Translate content="save pixels" />
          </span>
        </Button>
      </div>
      <div
        className={tw(
          "z-10 absolute inset-0 flex pointer-events-none justify-center opacity-0 backdrop-blur-sm items-center bg-[--biqpod-gray-opacity]",
          setStorePixelsActionLoading && "opacity-100 pointer-events-auto"
        )}
      >
        <CircleLoading />
      </div>
    </Card>
  );
};
