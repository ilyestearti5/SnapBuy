import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  ExcelPopup,
  Translate,
  Line,
  BooleanFeild,
  Icon,
  Button,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useUser,
  useAsyncEffect,
  closePopup,
  showPopup,
  execAction,
  openDialog,
  confirm,
} from "@biqpod/app/ui/hooks";
import { doubleFilter } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { api } from "../apis";
import { loadFromExcel } from "./Products";
interface PopupProductProps {
  products: SnapBuy.Product[];
  file?: string;
}
export const PopupProduct = ({ products, file }: PopupProductProps) => {
  const existsState = useCopyState<null | boolean>(false);
  const newsState = useCopyState<null | boolean>(false);
  const user = useUser();
  const allProducts = useCopyState<SnapBuy.Product[] | null>(null);
  useAsyncEffect(async () => {
    if (!user?.uid) return allProducts.set(null);
    const newProducts = await api.getAllProducts();
    allProducts.set(newProducts);
  }, [user?.uid]);
  const [exists, news] = useMemo(() => {
    if (!allProducts.get) return [null, null];
    const [exists, news] = doubleFilter(products, (product) => {
      return !!allProducts.get!.find((p) => p.name === product.name);
    });
    return [exists, news];
  }, [allProducts.get]);

  const isAvailable = useCopyState<null | boolean>(false);

  return (
    <Card className="max-md:w-10/12 md:w-1/2">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          {file && (
            <CircleTip
              onClick={() => {
                closePopup();
                loadFromExcel(file);
              }}
              icon={allIcons.solid.faChevronLeft}
            />
          )}
          <h1 className="font-bold text-3xl capitalize">
            <Translate content="insert new products" />
          </h1>
        </div>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div>
        <div className="flex items-center gap-2 p-2">
          <BooleanFeild id="exists-clients" state={existsState} />
          <span className="text-xl capitalize">
            <Translate content="exists" />
          </span>
          {exists === null && (
            <Icon
              icon={allIcons.solid.faSpinner}
              iconClassName="animate-spin"
            />
          )}
          {exists !== null && (
            <span className="font-bold text-xl">({exists.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <BooleanFeild id="exists-clients" state={newsState} />
          <span className="text-xl capitalize">
            <Translate content="news" />
          </span>
          {news === null && (
            <Icon
              icon={allIcons.solid.faSpinner}
              iconClassName="animate-spin"
            />
          )}
          {news !== null && (
            <span className="font-bold text-xl">({news.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <BooleanFeild id="available-by-default" state={newsState} />
          <span className="text-xl capitalize">
            <Translate content="always available" />
          </span>
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={async () => {
            const options: AddProductActionProps = {
              exists:
                exists?.map((prod) => ({
                  ...prod,
                  id: encodeURIComponent(prod.id),
                })) ?? undefined,
              news:
                news?.map((prod) => ({
                  ...prod,
                  id: encodeURIComponent(prod.id),
                  available: !!isAvailable.get,
                })) ?? undefined,
            };
            var isYes = confirm({
              title: "add products",
              message: "are you sure you want to add these products ?",
            });
            if (!isYes) {
              return;
            }
            execAction("add-products", options);
            closePopup();
          }}
        >
          <Translate content="add products" />
        </Button>
      </div>
    </Card>
  );
};
