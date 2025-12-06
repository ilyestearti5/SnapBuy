import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Icon,
  Translate,
  NumberField,
  Button,
  Image,
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
  const selectedProducts = useTemp<
    Record<string, { count: number; price: number }>
  >("selected-products-for-invoice");
  const count = useCopyState<number | null | undefined>(
    selectedProducts.get?.[product.id || ""]?.count || 1
  );
  const price = useCopyState<number | null | undefined>(
    selectedProducts.get?.[product.id || ""]?.price || product.single?.customer
  );
  const photo = product.photos?.at(0);
  const total = (count.get || 0) * (price.get || 0);
  return (
    <Card className="w-2/3">
      <CardHeaderForPopup popupId={id} title="add price / count" />
      <Line />
      <div className="flex flex-col justify-center items-center gap-2 p-3">
        <Image
          src={photo}
          alt={
            <Icon
              icon={allIcons.solid.faBoxOpen}
              className="text-[--biqpod-gray-opacity-2] text-2xl"
            />
          }
          className="bg-[--biqpod-gray-opacity] rounded-2xl w-[150px] h-[150px]"
        />
        <span>{product.name}</span>
        <BrandInfo brandId={product?.brandId} />
      </div>
      <Line />
      <div className="flex flex-col gap-2 p-2">
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label
            className="w-full md:text-right capitalize"
            htmlFor="count-updater"
          >
            <Translate content="count" /> :
          </label>
          <NumberField
            id="count-updater"
            config={{
              placeholder: "Enter Count",
              autoChange: true,
            }}
            state={count}
          />
        </div>
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label
            className="w-full md:text-right capitalize"
            htmlFor="price-updater"
          >
            <Translate content="price" /> :
          </label>
          <NumberField
            id="price-updater"
            config={{
              placeholder: "Enter Price",
              autoChange: true,
            }}
            state={price}
          />
        </div>
      </div>
      <Line />
      <div className="p-3 font-bold text-[--biqpod-success] text-xl text-center">
        {/* change format to dzd pricing */}
        {total.toLocaleString("fr-DZ", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        DA
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
