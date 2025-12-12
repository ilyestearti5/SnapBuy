import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Icon,
  Line,
  MarkDown,
  Translate,
} from "@biqpod/app/ui/components";
import { useFormProduct } from "../../../apis/getFns";
export const ProductDataBeforeCreate = () => {
  const product = useFormProduct();
  return (
    <div className="flex flex-col">
      <div>
        <div className="flex items-center gap-2 p-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <Icon icon={allIcons.solid.faHeading} />
            <p className="font-semibold capitalize">
              <Translate content="title" />:
            </p>
          </div>
          <div className="flex items-center gap-1 w-full">
            {product.name || (
              <span className="text-[--biqpod-gray-opacity] capitalize">
                <Translate content="no title" />
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <Icon icon={allIcons.solid.faLayerGroup} />
            <p className="font-semibold capitalize">
              <Translate content="type" />:
            </p>
          </div>
          <div className="flex items-center gap-1 w-full">
            <div>{product.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <Icon icon={allIcons.solid.faListNumeric} />
            <p className="font-semibold capitalize">
              <Translate content="limited" />:
            </p>
          </div>
          <div className="flex items-center gap-1 w-full">
            <Translate content={product.limited ? "yes" : "no"} />
          </div>
        </div>
        {product.limited && (
          <div className="flex items-center gap-2 p-2 w-full">
            <Icon icon={allIcons.solid.faBox} />
            <p className="font-semibold capitalize">
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
          <EmptyComponent>
            <div>
              <div className="flex items-center gap-2 p-2 w-full">
                <Icon icon={allIcons.solid.faDollarSign} />
                <p className="font-semibold capitalize">
                  <Translate content="client price" /> :{" "}
                  {typeof product.single?.client === "number" ? (
                    <i>{product.single.client.toFixed(2).concat("DA")}</i>
                  ) : (
                    <span className="text-[--biqpod-gray-opacity] capitalize">
                      <Translate content="no price" />
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 p-2 w-full">
                <Icon icon={allIcons.solid.faDollarSign} />
                <p className="font-semibold capitalize">
                  <Translate content="customer price" /> :{" "}
                  {typeof product.single?.customer === "number" ? (
                    <i>{product.single.customer.toFixed(2).concat("DA")}</i>
                  ) : (
                    <span className="text-[--biqpod-gray-opacity] capitalize">
                      <Translate content="no price" />
                    </span>
                  )}
                </p>
              </div>
            </div>
          </EmptyComponent>
        )}
      </div>
      {product.type === "multiple" && (
        <EmptyComponent>
          <Line />
          <div className="flex flex-col gap-2 py-2">
            <h3 className="px-2 font-semibold text-primary text-xl">
              <Translate content="prices list" />:
            </h3>
            <div className="px-2 overflow-x-auto">
              <div className="border border-[--biqpod-borders] border-solid rounded-2xl w-full overflow-hidden">
                <div className="flex bg-[--biqpod-secondary-background] w-full">
                  <div className="px-6 py-1 w-full font-medium text-xs text-left uppercase">
                    <Translate content="price" />
                  </div>
                  <div className="px-6 py-1 w-full font-medium text-xs text-left uppercase">
                    <Translate content="quantity" />
                  </div>
                </div>
                <Line />
                {product.multiple?.prices?.map((item, index) => (
                  <div key={index} className="flex w-full">
                    <div className="px-6 py-1 w-full font-medium text-xs text-left uppercase">
                      {item.price}
                    </div>
                    <div className="px-6 py-1 w-full font-medium text-xs text-left uppercase">
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
  );
};
