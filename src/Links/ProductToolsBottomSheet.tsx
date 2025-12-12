import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Translate,
  Line,
  Icon,
  Button,
  Scroll,
  Card,
  CardHeaderForPopup,
  TabContent,
  Field,
  Tabs,
  AsyncComponent,
  CircleLoading,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  ColorIds,
  showToast,
  showPopup,
  execAction,
  closeBottomSheet,
  closePopup,
  confirm,
} from "@biqpod/app/ui/hooks";
import { delay, mapAsync, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { ChromePicker as ColorPicker } from "react-color";
import { snapbuyApi } from "../apis";
import { colorsInListWithNames } from "../utils";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { sharSocialMedia } from "../utils";
import { Biqpod } from "@biqpod/app/ui/types";
interface CopyLinkPickColorProps {
  product: Biqpod.Snapbuy.Product;
}
const typeIcons = {
  string: allIcons.solid.faFont,
  number: allIcons.solid.faHashtag,
  boolean: allIcons.solid.faToggleOn,
  array: allIcons.solid.faList,
  colors: allIcons.solid.faPalette,
};
type Orientation = "portrait" | "landscape";
interface PreviewWindowProps {
  title: string;
  zoom: number;
  url: string;
  orientation: Orientation;
}
function PreviewWindow({ title, zoom, url, orientation }: PreviewWindowProps) {
  const isMobile = title === "Mobile";
  if (isMobile) {
    return (
      <div
        className={tw(
          `relative mx-auto border-gray-800 bg-gray-800 border-[10px] border-solid rounded-[2.5rem] shadow-xl`,
          orientation === "portrait"
            ? "h-[700px] w-[350px]"
            : "h-[350px] w-[700px]"
        )}
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        <div
          className={`rounded-[2rem] overflow-hidden w-full h-full bg-white`}
        >
          <iframe
            src={url}
            title={`${title} Preview`}
            className="border-0 w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex flex-col items-center"
      style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
    >
      <div
        className={tw(
          "relative bg-gray-800 shadow-xl border-[4px] border-gray-800 border-solid rounded-t-xl",
          orientation === "landscape"
            ? "w-[800px] h-[450px] md:w-[1200px] md:h-[675px]"
            : "w-[350px] h-[220px] md:w-[1200px] md:h-[700px]"
        )}
      >
        <div className="bg-black rounded-lg w-full h-full overflow-hidden">
          <iframe
            src={url}
            title={`${title} Preview`}
            className="border-0 w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
      <div
        className={tw(
          "relative bg-gray-900 rounded-b-xl -mt-1",
          orientation === "landscape"
            ? "w-[816px] h-[12px] md:w-[1232px] md:h-[20px]"
            : "w-[358px] h-[8px] md:w-[1216px] md:h-[32px]"
        )}
      />
      <div
        className={tw(
          "relative bg-gray-800 rounded-b-xl -mt-1",
          orientation === "landscape"
            ? "w-[320px] h-[40px] md:w-[500px] md:h-[60px]"
            : "w-[140px] h-[25px] md:w-[500px] md:h-[80px]"
        )}
      />
    </div>
  );
}
const CopyLinkPickColor = ({ product }: CopyLinkPickColorProps) => {
  const selectedColorId = useCopyState<ColorIds | null>(null);
  const selectedColor = useCopyState<string | null>(null);
  const usedColor = useCopyState<Partial<Record<ColorIds, string>>>({});
  const colorSearchQuery = useCopyState<string>("");
  const uri = useMemo(() => {
    const uri = new URL(location.href);
    uri.pathname = "/product/" + product.id;
    Object.entries(usedColor.get).forEach(([colorId, color]) => {
      if (color) {
        uri.searchParams.set("color." + colorId, color);
      }
    });
    return uri;
  }, [usedColor.get]);
  const filteredColors = useMemo(() => {
    if (!colorSearchQuery.get) return colorsInListWithNames;
    return colorsInListWithNames.filter((color) => {
      const normalizedColor = color.name.replaceAll(".", " ").toLowerCase();
      return normalizedColor.includes(colorSearchQuery.get.toLowerCase());
    });
  }, [colorSearchQuery.get]);
  return (
    <EmptyComponent>
      <Line />
      <div className="flex items-stretch md:w-[80vw] max-md:h-full md:max-h-[70vh] overflow-hidden">
        <div className="border-[--biqpod-borders] border-r border-solid">
          <div className="w-[200px] overflow-hidden">
            <div className="p-2">
              <Field
                inputName="colorSearch"
                placeholder="Search colors..."
                value={colorSearchQuery.get}
                onChange={(e) => colorSearchQuery.set(e.target.value)}
                className="rounded-xl w-full text-sm"
              />
            </div>
            <Line />
            <Scroll>
              {filteredColors.map((color) => {
                const backgroundColor = usedColor.get[color.colorId] || null;
                return (
                  <div
                    onClick={async () => {
                      if (backgroundColor) {
                        usedColor.set(
                          ({ [color.colorId]: _, ...colors }) => colors
                        );
                      } else selectedColorId.set(color.colorId);
                    }}
                    key={color.colorId}
                    className="flex justify-between items-center active:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] max-md:p-2 md:p-3 cursor-pointer"
                  >
                    <h1 className="max-md:text-xs md:text-xl capitalize text-wrap">
                      {color.name}
                    </h1>
                    {backgroundColor && (
                      <div>
                        <div
                          className="rounded-full w-[15px] h-[15px]"
                          style={{
                            backgroundColor,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </Scroll>
          </div>
        </div>
        <div className="flex flex-col justify-between items-center w-full overflow-hidden">
          <div className="relative flex justify-center items-stretch gap-2 p-1 w-full">
            <Tabs
              tabs={[
                {
                  value: "mobile",
                  label: "Mobile",
                  icon: allIcons.solid.faMobile,
                },
                {
                  value: "desktop",
                  label: "Desktop",
                  icon: allIcons.solid.faDesktop,
                },
              ]}
              identifier="preview"
              defaultValue="mobile"
            />
          </div>
          <Line />
          <div className="justify-center items-center bg-white w-full h-full overflow-hidden">
            <TabContent
              identifier="preview"
              className="flex justify-center items-center p-2 h-full"
              value="mobile"
            >
              <AsyncComponent
                loading={<CircleLoading />}
                deps={[uri.href]}
                render={async () => {
                  await delay(500);
                  return (
                    <PreviewWindow
                      title={"Mobile"}
                      zoom={0.45}
                      url={uri.href}
                      orientation="portrait"
                    />
                  );
                }}
              />
            </TabContent>
            <TabContent
              identifier="preview"
              className="flex justify-center items-center p-2 h-full overflow-auto"
              value="desktop"
            >
              <AsyncComponent
                loading={<CircleLoading />}
                deps={[uri.href]}
                render={async () => {
                  await delay(500);
                  return (
                    <PreviewWindow
                      title={"Desktop"}
                      zoom={0.2}
                      url={uri.href}
                      orientation="landscape"
                    />
                  );
                }}
              />
            </TabContent>
          </div>
        </div>
        {/* Mobile color picker at bottom */}
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        <Button
          icon={allIcons.regular.faCopy}
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          onClick={async () => {
            closePopup();
            await navigator.clipboard.writeText(uri.href);
            showToast("Link copied to clipboard!");
          }}
        >
          <Translate content="copy" />
        </Button>
        <Button
          className="rounded-full"
          onClick={async () => {
            closePopup();
            const files = await mapAsync(
              product.photos || [],
              async (photo) => {
                const response = await fetch(photo);
                const blob = await response.blob();
                return new File([blob], photo.split("/").pop() || "image.jpg", {
                  type: blob.type,
                });
              }
            );
            await navigator.share({
              title: product.name,
              url: uri.href,
              text: product.description || "",
              files,
            });
          }}
        >
          <Translate content="share" />
        </Button>
      </div>
      {selectedColorId.get && (
        <div className="z-50 absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] pl-4">
          <Card className="w-3/4 overflow-hidden">
            <div className="p-2 border-[--biqpod-borders] border-b">
              <h3 className="font-extrabold text-2xl capitalize">
                <Translate content={selectedColorId.get?.replace(".", " ")} />
              </h3>
            </div>
            <Line />
            <ColorPicker
              color={selectedColor.get || "#ffffff"}
              onChange={(color) => {
                selectedColor.set(color.hex);
              }}
              styles={{
                default: {
                  picker: {
                    backgroundColor: "var(--biqpod-secondary-background)",
                    boxShadow: "none",
                    width: "100%",
                  },
                  body: {
                    backgroundColor: "var(--biqpod-primary-background)",
                  },
                },
              }}
            />
            <Line />
            <div className="flex justify-between items-center gap-2 p-2">
              <Button
                onClick={() => {
                  selectedColorId.set(null);
                  selectedColor.set(null);
                }}
                className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
              >
                <Translate content="cancel" />
              </Button>
              {selectedColor.get && (
                <Button
                  onClick={() => {
                    if (selectedColorId.get === null) {
                      return;
                    }
                    const color = selectedColor.get;
                    if (color) {
                      usedColor.set({
                        ...usedColor.get,
                        [selectedColorId.get]: color,
                      });
                      showToast("Color saved!");
                    } else {
                      showToast("Please select a color first.");
                    }
                    selectedColorId.set(null);
                    selectedColor.set(null);
                  }}
                >
                  <Translate content="set" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </EmptyComponent>
  );
};
export const ProductToolsBottomSheet = ({
  product,
  usedBy,
}: {
  index: number;
  product: Biqpod.Snapbuy.Product;
  usedBy: "owned" | "random" | "read/edit" | "read" | null;
}) => {
  const uri = useMemo(() => {
    const uri = new URL(location.href);
    uri.pathname = "/product/" + product.id;
    return uri;
  }, []);
  return (
    <EmptyComponent>
      <div className="flex items-center gap-2 p-2">
        <h1 className="font-bold text-3xl uppercase">
          <Translate content="actions" />
        </h1>
      </div>
      <div className="relative w-full overflow-x-hidden">
        <Line />
        <div className="flex gap-2 p-2 overflow-x-auto">
          {sharSocialMedia.map(({ name, icon, link }) => {
            const u = link.replace("{link}", encodeURIComponent(uri.href));
            return (
              <div
                key={name}
                className="inline-flex justify-center items-center gap-2 bg-[--biqpod-primary-background] active:bg-[--biqpod-gray-opacity] border border-[--biqpod-borders] border-solid rounded-lg w-[50px] h-[50px] text-2xl cursor-pointer"
                onClick={() => {
                  window.open(u, "_blank");
                }}
              >
                <Icon icon={icon} />
              </div>
            );
          })}
        </div>
        <Line />
        {[
          {
            label: "copy link",
            defaultIcon: allIcons.regular.faCopy,
            click: async () => {
              closeBottomSheet();
              showPopup(
                <Card className="relative max-md:rounded-none max-md:w-full max-md:h-full">
                  <CardHeaderForPopup title="Copy Link" />
                  <CopyLinkPickColor product={product} />
                </Card>
              );
            },
          },
          {
            label: "View Metadata",
            defaultIcon: allIcons.solid.faInfoCircle,
            click: () => {
              closeBottomSheet();
              const fields = Object.entries(product.metaData || {});
              showPopup(
                <Card className="relative max-md:rounded-none max-md:w-full max-md:h-full">
                  <CardHeaderForPopup title="Product Metadata" />
                  <Line />
                  <Scroll>
                    <div className="p-2">
                      {fields.map(([key, meta]) => (
                        <Card key={key} className="mb-3">
                          <div className="flex items-center gap-2 p-3 border-[--biqpod-borders] border-b">
                            <Icon
                              icon={
                                typeIcons[
                                  meta?.type as keyof typeof typeIcons
                                ] || allIcons.solid.faQuestionCircle
                              }
                            />
                            <span className="font-semibold capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-[--biqpod-text-secondary] text-sm">
                              ({meta?.type})
                            </span>
                          </div>
                          <div className="p-3">
                            {meta?.type === "string" && (
                              <span className="text-sm">{meta.value}</span>
                            )}
                            {meta?.type === "number" && (
                              <span className="font-mono text-sm">
                                {meta.value}
                              </span>
                            )}
                            {meta?.type === "boolean" && (
                              <div className="flex items-center gap-2">
                                <Icon
                                  icon={
                                    meta.value
                                      ? allIcons.solid.faCheck
                                      : allIcons.solid.faXmark
                                  }
                                />
                                <span className="text-sm">
                                  {meta.value ? "True" : "False"}
                                </span>
                              </div>
                            )}
                            {meta?.type === "array" && (
                              <div className="flex flex-wrap gap-1">
                                {(meta.value as any[]).map((item, i) => (
                                  <span
                                    key={i}
                                    className="bg-[--biqpod-primary] px-2 py-1 rounded text-[--biqpod-text-color] text-xs"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )}
                            {meta?.type === "colors" && (
                              <div className="flex items-center gap-2">
                                {(meta.value as string[]).map((color) => (
                                  <div
                                    key={color}
                                    className="border border-[--biqpod-borders] rounded-full w-6 h-6"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                      {fields.length === 0 && (
                        <div className="flex flex-col justify-center items-center gap-2 p-2 text-[--biqpod-text-secondary] text-sm text-center capitalize">
                          <Icon
                            className="text-4xl"
                            icon={allIcons.solid.faInfoCircle}
                          />
                          <Translate content="no meta data available" />
                        </div>
                      )}
                    </div>
                  </Scroll>
                </Card>
              );
            },
          },
          ...(usedBy !== "read"
            ? [
                {
                  type: "separator" as const,
                },
                {
                  label: "Duplicate",
                  click: () => {
                    const duplicatedProduct = {
                      ...product,
                      id: undefined, // This will generate a new ID when creating
                    };
                    showPopup(<PostNewProduct product={duplicatedProduct} />);
                  },
                  defaultIcon: allIcons.solid.faCodeFork,
                },
                {
                  label: product.available ? "Disable" : "Enable",
                  click: async () => {
                    await snapbuyApi.product.upsert(product.storeId!, [
                      {
                        ...product,
                        available: !product.available,
                      },
                    ]);
                    execAction("fetch-products");
                  },
                  defaultIcon: product.available
                    ? allIcons.solid.faEyeSlash
                    : allIcons.solid.faEye,
                },
                {
                  label: "Edit Product",
                  click: () => {
                    showPopup(<PostNewProduct product={product} />);
                  },
                  defaultIcon: allIcons.solid.faPen,
                },
                {
                  label: "Delete Product",
                  click: async () => {
                    const response = await confirm({
                      title: "Delete Product",
                      message: `Are you sure you want to delete "${product.name}"?`,
                      detail: "This action cannot be undone.",
                      type: "warning",
                    });
                    if (response) {
                      await snapbuyApi.product.delete(product.id!);
                      execAction("fetch-products");
                      showToast("Product Deleted");
                    }
                  },
                  defaultIcon: allIcons.solid.faTrashCan,
                },
              ]
            : []),
        ].map(({ label, type, click, defaultIcon }, index) => {
          if (type === "separator") {
            return <Line key={index} />;
          }
          return (
            <div
              key={index}
              className="flex items-center gap-6 hover:bg-[--biqpod-gray-opacity] p-3 max-md:text-lg md:text-xl capitalize cursor-pointer"
              onClick={async () => {
                label && !["Link"].includes(label) && closeBottomSheet();
                click?.();
              }}
            >
              <Icon
                icon={defaultIcon || allIcons.solid.faHiking}
                className={tw(!defaultIcon && "invisible")}
              />
              <span>
                <Translate content={label || ""} />
              </span>
            </div>
          );
        })}
      </div>
    </EmptyComponent>
  );
};
