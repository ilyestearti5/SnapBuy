import { allIcons } from "@biqpod/app/ui/apis";

import {
  EmptyComponent,
  Icon,
  Line,
  MarkDown,
  Tip,
  Translate,
} from "@biqpod/app/ui/components";
import {
  fieldHooks,
  getTemp,
  setTemp,
  useColorMerge,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { Nothing, SettingValueType } from "@biqpod/app/ui/types";
import { useMemo } from "react";
export const PostDataBeforePost = () => {
  const keys = getTemp<SettingValueType["array"]>("post-keys");
  const sizes = getTemp<SettingValueType["filter"]>("post-sizes");
  const colors = getTemp<string[]>("post-colors");
  const extraInformation = getTemp<SettingValueType["filter"]>(
    "post-extrainformation"
  );
  const category = getTemp<SettingValueType["enum"]>("post-category");
  const title = fieldHooks.getOneFeild("product-form-name", "value");
  const postType = getTemp<"multiple" | "single">("post-type");
  const quantity = getTemp<number | Nothing>("post-quantity");
  const description = fieldHooks.getOneFeild(
    "product-form-description",
    "value"
  );
  const price = getTemp<number | Nothing>("product-price");
  const limited = getTemp<boolean>("product-limited");
  const pricesList = getTemp<
    {
      price: number;
      quantity: number;
    }[]
  >("product-prices");
  const colorMerge = useColorMerge();
  const choisedTheme = getTemp<SnapBuy.Product["theme"]>(
    "product-choised-theme"
  );

  var choisedThemeArray = useMemo(() => {
    return Object.entries(choisedTheme || {})
      .map(([name, color]) => {
        return { name, color };
      })
      .filter(Boolean);
  }, [choisedTheme]);

  return (
    <EmptyComponent>
      <div
        className={tw("flex flex-col gap-6 shadow-lg mx-auto")}
        style={{
          ...colorMerge("primary.background"),
        }}
      >
        <div className="p-4">
          <h2
            className={tw(
              "flex justify-center items-center gap-2 font-bold text-3xl text-primary capitalize"
            )}
          >
            <Icon icon={allIcons.solid.faInfoCircle} />
            <Translate content="post details" />
          </h2>
        </div>
        <Line />
        <div className={tw("items-center gap-6 grid grid-cols-2 p-6")}>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faHeading} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="title" />:
            </p>
          </div>
          <div className="flex items-center gap-1">
            {title || (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no title" />
              </span>
            )}
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 0);
              }}
            />
          </div>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faTags} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="category" />:
            </p>
          </div>
          <div className="flex items-center gap-1">
            {category || (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no category" />
              </span>
            )}
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 0);
              }}
            />
          </div>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faLayerGroup} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="type" />:
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div>{postType}</div>
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 1);
              }}
            />
          </div>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faKey} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="keys" />:
            </p>
          </div>
          <div>
            {(keys &&
              keys.map((info) => {
                return (
                  <span
                    key={info}
                    className="px-2 py-1 border border-transparent border-solid rounded-full capitalize"
                    style={{
                      ...colorMerge({
                        backgroundColor: "gray.opacity",
                        borderColor: "borders",
                      }),
                    }}
                  >
                    {info}
                  </span>
                );
              })) || (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no keys" />
              </span>
            )}
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 6);
              }}
            />
          </div>
          <div className={tw("flex items-center gap-2")}>
            <p className={tw("font-semibold capitalize")}>
              <Translate content="limited" />:
            </p>
          </div>
          <div className="capitalize">
            <Translate content={limited ? "yes" : "no"} />
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 3);
              }}
            />
          </div>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faRulerCombined} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="sizes" />:
            </p>
          </div>
          <p>
            {(sizes && sizes.join(", ")) || (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no sizes" />
              </span>
            )}
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 6);
              }}
            />
          </p>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faPalette} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="colors" />:
            </p>
          </div>
          <div>
            <div className={tw("flex gap-2")}>
              {colors?.map((color, index) => (
                <div
                  key={index}
                  className={tw("rounded-full w-6 h-6")}
                  style={{ backgroundColor: color }}
                  title={color}
                ></div>
              )) || (
                <span
                  className="capitalize"
                  style={{
                    ...colorMerge({
                      color: "gray.opacity",
                    }),
                  }}
                >
                  <Translate content="no colors" />
                </span>
              )}
            </div>
          </div>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faInfoCircle} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="extra information" />:
            </p>
          </div>
          <p>
            {(extraInformation &&
              extraInformation.map((info) => {
                return (
                  <span
                    key={info}
                    className="px-2 py-1 border border-transparent border-solid rounded-full capitalize"
                    style={{
                      ...colorMerge({
                        backgroundColor: "gray.opacity",
                        borderColor: "borders",
                      }),
                    }}
                  >
                    {info}
                  </span>
                );
              })) || (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no extra information" />
              </span>
            )}
          </p>
          <div className={tw("flex items-center gap-2")}>
            <Icon icon={allIcons.solid.faPaintBrush} />
            <p className={tw("font-semibold capitalize")}>
              <Translate content="choised theme" />:
            </p>
          </div>
          <div className="flex gap-2">
            {choisedThemeArray.map(({ name, color }) => {
              return (
                <div
                  key={name}
                  className={tw("rounded-full w-6 h-6")}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              );
            })}
            {choisedThemeArray.length === 0 && (
              <span
                className="capitalize"
                style={{
                  ...colorMerge({
                    color: "gray.opacity",
                  }),
                }}
              >
                <Translate content="no choised theme" />
              </span>
            )}
          </div>
          {limited && (
            <div className={tw("flex items-center gap-2")}>
              <Icon icon={allIcons.solid.faBox} />
              <p className={tw("font-semibold capitalize")}>
                <Translate content="quantity:" />
              </p>
              <p>
                {quantity || (
                  <span
                    style={{
                      ...colorMerge({
                        color: "gray.opacity",
                      }),
                    }}
                    className="capitalize"
                  >
                    <Translate content="no quantity" />
                  </span>
                )}
              </p>
            </div>
          )}
          {postType === "single" && (
            <div className={tw("flex items-center gap-2")}>
              <Icon icon={allIcons.solid.faDollarSign} />
              <p className={tw("font-semibold capitalize")}>
                <Translate content="price:" />{" "}
                {typeof price === "number" ? (
                  <i>{price.toFixed(2).concat("DA")}</i>
                ) : (
                  <span
                    style={{
                      ...colorMerge({
                        color: "gray.opacity",
                      }),
                    }}
                    className="capitalize"
                  >
                    <Translate content="no price" />
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        {postType === "multiple" && (
          <EmptyComponent>
            <Line />
            <div>
              <h3
                className={tw("my-2 px-2 font-semibold text-2xl text-primary")}
              >
                Prices List:
              </h3>
              <div className={tw("overflow-x-auto px-2")}>
                <div
                  className={tw(
                    "border border-transparent border-solid rounded-2xl w-full overflow-hidden"
                  )}
                  style={{
                    ...colorMerge({
                      borderColor: "borders",
                    }),
                  }}
                >
                  <div
                    style={{
                      ...colorMerge("secondary.background"),
                    }}
                    className="flex w-full"
                  >
                    <div
                      className={tw(
                        "px-6 py-3 w-full font-medium text-left text-xs uppercase"
                      )}
                    >
                      <Translate content="price" />
                    </div>
                    <div
                      className={tw(
                        "px-6 py-3 w-full font-medium text-left text-xs uppercase"
                      )}
                    >
                      <Translate content="quantity" />
                    </div>
                  </div>
                  <Line />
                  {pricesList?.map((item, index) => (
                    <div key={index} className="flex w-full">
                      <div
                        className={tw(
                          "px-6 py-3 w-full font-medium text-left text-xs uppercase"
                        )}
                      >
                        {item.price}
                      </div>
                      <div
                        className={tw(
                          "px-6 py-3 w-full font-medium text-left text-xs uppercase"
                        )}
                      >
                        {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </EmptyComponent>
        )}
        <Line />
        <div className="p-2">
          <MarkDown value={description || "*No Description*"} />
        </div>
      </div>
    </EmptyComponent>
  );
};
