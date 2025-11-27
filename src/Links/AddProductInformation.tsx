import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Icon,
  Translate,
  NumberField,
  Button,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useTemp,
  showToast,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { BrandInfo } from "./BrandInfo";

export function AddProductInformation({
  product,
  id,
}: {
  product: Biqpod.Snapbuy.Product;
  id: string;
}) {
  const count = useCopyState<number | null | undefined>(1);
  const price = useCopyState<number | null | undefined>(
    product.single?.customer || 0
  );
  const selectedProducts = useTemp<
    Record<string, { count: number; price: number }>
  >("selected-products-for-invoice");
  const photo = product.photos?.at(0);
  return (
    <Card>
      <CardHeaderForPopup popupId={id} title="add price / count" />
      <Line />
      <div className="flex flex-col justify-center items-center gap-2 p-3">
        <div className="rounded-2xl w-[150px] h-[150px] overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex justify-center items-center w-full h-full">
              <Icon
                icon={allIcons.solid.faBoxOpen}
                iconClassName="text-2xl text-[--biqpod-gray-opacity-2]"
              />
            </div>
          )}
        </div>
        <span>{product.name}</span>
        <BrandInfo brandId={product?.brandId} />
      </div>
      <Line />
      <div className="flex flex-col gap-2 p-2">
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label className="w-full md:text-right" htmlFor="count-updater">
            <Translate content="count" /> :
          </label>
          <NumberField
            id="count-updater"
            config={{
              placeholder: "Enter Count",
              autoChange: true,
              size: 20,
            }}
            state={count}
          />
        </div>
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label className="w-full md:text-right" htmlFor="price-updater">
            <Translate content="price" /> :
          </label>
          <NumberField
            id="price-updater"
            config={{
              placeholder: "Enter Price",
              autoChange: true,
              size: 20,
            }}
            state={price}
          />
        </div>
      </div>
      <Line />
      <div className="p-3">
        <Button
          onClick={() => {
            if (typeof count.get !== "number") {
              showToast("please enter a valid count", "error");
              return;
            }
            if (typeof price.get !== "number") {
              showToast("please enter a valid price", "error");
              return;
            }
            if (!product.id) {
              showToast("invalid product", "error");
            }
            selectedProducts.set((prev) => ({
              ...prev,
              [product.id!]: {
                count: count.get!,
                price: price.get!,
              },
            }));
            closePopup(id);
          }}
          disabled={
            !product ||
            !count.get ||
            count.get <= 0 ||
            !price.get ||
            price.get <= 0
          }
          rightIcon={allIcons.solid.faPlus}
        >
          <Translate content="add to selection" />
        </Button>
      </div>
    </Card>
  );
}
