import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Icon,
  Key,
  Line,
  MarkDown,
  Tip,
  Translate,
} from "@biqpod/app/ui/components";
import { setTemp } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useFormProduct } from "../../../apis";
export const ProductDataBeforeCreate = () => {
  const product = useFormProduct();
  return (
    <EmptyComponent>
      <div
        className={tw(
          "flex flex-col gap-6 shadow-lg mx-auto bg-[--biqpod-primary-background]"
        )}
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
            {product.name || (
              <span className="text-[--biqpod-gray-opacity] capitalize">
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
            {product.category || (
              <span className="text-[--biqpod-gray-opacity] capitalize">
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
            <div>{product.type}</div>
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 2);
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
            {(product.keys &&
              product.keys.map((info) => {
                return <Key key={info}>{info}</Key>;
              })) || (
              <span className="text-[--biqpod-gray-opacity] capitalize">
                <Translate content="no keys" />
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
            <p className={tw("font-semibold capitalize")}>
              <Translate content="limited" />:
            </p>
          </div>
          <div className="capitalize">
            <Translate content={product.limited ? "yes" : "no"} />
            <Tip
              icon={allIcons.solid.faExternalLink}
              onClick={() => {
                setTemp("post-focused", 0);
              }}
            />
          </div>
          {product.limited && (
            <div className={tw("flex items-center gap-2")}>
              <Icon icon={allIcons.solid.faBox} />
              <p className={tw("font-semibold capitalize")}>
                <Translate content="quantity:" />
              </p>
              <p>
                {product.quantity || (
                  <span className="text-[--biqpod-gray-opacity] capitalize">
                    <Translate content="no quantity" />
                  </span>
                )}
              </p>
            </div>
          )}
          {product.type === "single" && (
            <div className={tw("flex items-center gap-2")}>
              <Icon icon={allIcons.solid.faDollarSign} />
              <p className={tw("font-semibold capitalize")}>
                <Translate content="price:" />{" "}
                {typeof product.single?.price === "number" ? (
                  <i>{product.single.price.toFixed(2).concat("DA")}</i>
                ) : (
                  <span className="text-[--biqpod-gray-opacity] capitalize">
                    <Translate content="no price" />
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        {product.type === "multiple" && (
          <EmptyComponent>
            <Line />
            <div>
              <h3
                className={tw("my-2 px-2 font-semibold text-2xl text-primary")}
              >
                <Translate content="prices list" />:
              </h3>
              <div className={tw("overflow-x-auto px-2")}>
                <div
                  className={tw(
                    "border border-[--biqpod-borders] border-solid rounded-2xl w-full overflow-hidden"
                  )}
                >
                  <div className="flex bg-[--biqpod-secondary-background] w-full">
                    <div
                      className={tw(
                        "px-6 py-1 w-full font-medium text-left text-xs uppercase"
                      )}
                    >
                      <Translate content="price" />
                    </div>
                    <div
                      className={tw(
                        "px-6 py-1 w-full font-medium text-left text-xs uppercase"
                      )}
                    >
                      <Translate content="quantity" />
                    </div>
                  </div>
                  <Line />
                  {product.multiple?.prices?.map((item, index) => (
                    <div key={index} className="flex w-full">
                      <div
                        className={tw(
                          "px-6 py-1 w-full font-medium text-left text-xs uppercase"
                        )}
                      >
                        {item.price}
                      </div>
                      <div
                        className={tw(
                          "px-6 py-1 w-full font-medium text-left text-xs uppercase"
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
          <MarkDown value={product.description || "*No Description*"} />
        </div>
      </div>
    </EmptyComponent>
  );
};
