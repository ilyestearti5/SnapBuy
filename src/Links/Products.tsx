import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import {
  delay,
  include,
  mergeArray,
  mergeObject,
  tw,
} from "@biqpod/app/ui/utils";
import {
  BooleanFeild,
  Button,
  Card,
  CircleTip,
  ExcelPopup,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  getPosition,
  getTemp,
  isLoading,
  isSuccess,
  openPath,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { getDocs } from "../server";
import { api, useFocused } from "../apis";
import { PopupProduct } from "./PopupProduct";
import { fuzzyRankedSearch } from "../utils";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ProductRender } from "./ProductRender";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
const productKeys: (keyof SnapBuy.Product)[] = [
  "available",
  "colors",
  "createdAt",
  "description",
  "id",
  "limited",
  "name",
  "photos",
  "quantity",
  "theme",
  "type",
  "sizes",
];
interface KeyLineProps {
  prodKey: keyof SnapBuy.Product;
  value: boolean;
  onChange: (value: boolean) => void;
}
export const KeyLine = ({ prodKey, onChange, value }: KeyLineProps) => {
  const state = useCopyState<null | boolean>(value);
  useEffect(() => {
    if (state.get != value) {
      onChange(!!state.get);
    }
  }, [state.get]);
  return (
    <div className="flex items-center gap-2 p-2">
      <BooleanFeild state={state} id={`${prodKey}-key`} />
      <span className="text-xl capitalize">{prodKey}</span>
    </div>
  );
};
export const ExportExcelPopupProducts = () => {
  var keys = useCopyState<(keyof SnapBuy.Product)[]>([]);
  var action = useAction(
    "export-products",
    async () => {
      var products = await api.getAllProducts();
      await exportExcel(products, keys.get);
    },
    [keys.get]
  );
  var loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="export products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col h-full">
        {productKeys.map((prod) => {
          return (
            <KeyLine
              onChange={(value) => {
                if (value) {
                  keys.set((prev) => [...prev, prod]);
                } else {
                  keys.set((prev) => prev.filter((p) => p != prod));
                }
              }}
              key={prod}
              value={keys.get.includes(prod)}
              prodKey={prod}
            />
          );
        })}
      </div>
      <Line />
      <div className="p-3">
        <Button
          onClick={() => {
            execAction("export-products");
          }}
          icon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faFileExcel
          }
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="export products" />
        </Button>
      </div>
    </Card>
  );
};
const exportExcel = async (
  products: SnapBuy.Product[],
  keys: (keyof SnapBuy.Product)[]
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Products");
  // Add header
  worksheet.columns = keys.map((key) => ({
    header: key,
    key: key,
  }));
  // Add rows
  products.forEach((product) => {
    var option: Partial<SnapBuy.Product> = {};
    keys.forEach((key) => {
      var value = product[key];
      if (value === undefined) {
        switch (key) {
          case "available":
            value = false;
            break;
          case "limited":
            value = false;
            break;
          case "quantity":
            value = 0;
            break;
        }
      }
      option[key] = value;
    });
    worksheet.addRow(option);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "products.xlsx");
};
export const loadFromExcel = async (file: string) => {
  showPopup(
    <ExcelPopup
      uri={file}
      options={[
        "id",
        "name",
        "description",
        "category",
        "available",
        "limited",
        "themeId",
        "price",
        "quantity",
      ]}
      onChange={(json) => {
        showPopup(
          <PopupProduct
            products={json.map(({ price, ...all }) => {
              return {
                ...all,
                single: {
                  price,
                },
                type: "single",
                photos: [],
              };
            })}
            file={file}
          />
        );
      }}
      title="Excel File"
    />
  );
};
const PAGE_SIZE = 20;
export const Products = () => {
  const user = useUser();
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<SnapBuy.Product | null>(null);
  const hasMore = useCopyState(true);
  const action = useAction(
    "fetch-products",
    async (next = false) => {
      if (!user?.uid) return;
      await delay(300);
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(where("uid", "==", user.uid)),
          orders: mergeArray(orderBy("id", "asc")),
          limit: PAGE_SIZE,
          startAt: next && lastDoc.get?.id && mergeArray(lastDoc.get?.id),
        }
      );
      if (!newProducts) {
        return;
      }
      const list = newProducts.map((order) => ({
        ...order.data,
        id: order.id,
      }));
      products.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = newProducts.at(-1)?.data;
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(newProducts.length === PAGE_SIZE);
    },
    [user?.uid]
  );
  const success = isSuccess(action);
  useEffect(() => {
    execAction("fetch-products");
  }, [user]);
  const isFullWidth = useTemp("isFullWidth");
  const showTools = useCopyState(false);
  // categorys
  // market
  const typedMarket = getFieldValue("prod-category");
  const positionMark = getPosition("prod-market-layout");
  // filtring
  const search = getFieldValue("producer-search-product");
  const filterProducts = useMemo(() => {
    if (!search) {
      return products.get;
    }
    return fuzzyRankedSearch(search, products.get, "name");
  }, [search, products.get]);
  useEffect(() => {
    if (user?.uid) return api.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const focused = useFocused();
  const canDelete = getTemp<string>("canDeleteProduct");
  const loading = isLoading(action);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div>
          <Field
            inputName="producer-search-product"
            placeholder="Search Product"
            className="rounded-xl"
          />
        </div>
        <div className="flex">
          {/* <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => {
              showPopup(<PopupFilter />);
            }}
          /> */}
          <CircleTip
            icon={
              isFullWidth.get
                ? allIcons.solid.faCompress
                : allIcons.solid.faExpand
            }
            onClick={() => {
              isFullWidth.set(!isFullWidth.get);
            }}
            iconClassName={tw(
              "rotate-0 transition-transform duration-500",
              isFullWidth.get && "rotate-90"
            )}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        <div className="flex flex-wrap items-center gap-2 p-2">
          {filterProducts.map((product) => {
            return <ProductRender product={product} key={product.id} />;
          })}
          {success && filterProducts.length === 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Card>
                <div className="flex justify-center items-center p-2 h-full">
                  <Icon
                    icon={allIcons.solid.faBoxOpen}
                    iconClassName="text-8xl text-[--biqpod-primary]"
                  />
                </div>
                <Line />
                <div className="flex justify-center items-center p-2 h-full">
                  <Translate content="no products found" />
                </div>
              </Card>
            </div>
          )}
          {hasMore.get && (
            <Card className="justify-center items-center w-full h-[180px]">
              <CircleTip
                iconClassName={tw(loading && "animate-spin")}
                icon={
                  loading
                    ? allIcons.solid.faCircleNotch
                    : allIcons.solid.faChevronRight
                }
                onClick={() => {
                  execAction("fetch-products", true);
                }}
              />
            </Card>
          )}
        </div>
      </Scroll>
      <Card
        onClick={() => {
          showTools.set(!showTools.get);
        }}
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute flex flex-col items-center p-3 rounded-3xl"
      >
        <CircleTip
          icon={allIcons.regular.faFileExcel}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            const files = await openPath({});
            const file = files.at(0);
            if (!file) {
              showToast("Please select a file");
              return;
            }
            loadFromExcel(file);
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<PostNewProduct />);
          }}
        />
        <CircleTip
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={() => {
            // export excel file (upload)
            showPopup(<ExportExcelPopupProducts />);
          }}
          icon={allIcons.solid.faFileExcel}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          iconClassName={tw(
            "transition-transform",
            showTools.get ? "rotate-45" : "rotate-0"
          )}
        />
      </Card>
      <div
        className={tw(
          "bottom-0 z-[10000] absolute inset-x-0 flex justify-center items-center bg-gradient-to-t to-[--biqpod-transparent] opacity-0 from-[--biqpod-shadow-color] p-2 transition-[transform,opacity] translate-y-full duration-500 pointer-events-none transform",
          canDelete && "pointer-events-auto opacity-100 translate-y-0"
        )}
      >
        <div className="flex justify-center items-center bg-[--biqpod-primary-background] border border-[--biqpod-error] border-solid rounded-full w-[80px] h-[80px]">
          <Icon
            icon={allIcons.solid.faTrashCan}
            iconClassName="text-[--biqpod-error] text-3xl"
          />
        </div>
      </div>
    </div>
  );
};
