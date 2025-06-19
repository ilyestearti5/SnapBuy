import {
  allIcons,
  and,
  getDownloadURL,
  orderBy,
  setDoc,
  where,
} from "@biqpod/app/ui/apis";
import {
  delay,
  filterFuzzySearch,
  mergeArray,
  range,
  tw,
} from "@biqpod/app/ui/utils";
import {
  BooleanField,
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  getTemp,
  isLoading,
  isSuccess,
  openPath,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useMemoDelay,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { getDocs, uploadFile } from "../server";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ProductRender } from "./ProductRender";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useStoreId } from "../App";
import { UpsertPack } from "./UpsertPack";
import { loadFromExcel } from "./loadFromExcel";
import { arraySeparator } from "../utils";
const productKeys: (keyof SnapBuy.Product)[] = [
  "available",
  "createdAt",
  "description",
  "id",
  "limited",
  "name",
  "photos",
  "quantity",
  "type",
];
interface KeyLineProps {
  prodKey: keyof SnapBuy.Product;
  value: boolean;
  onChange: (value: boolean) => void;
}
export const allKeys: keys[] = [
  "available",
  "createdAt",
  "description",
  "id",
  "limited",
  "name",
  "photos",
  "quantity",
  "type",
  "single.price",
  "multiple.prices",
  "multiple.counts",
  "category",
];
const ExcelImportFrom = () => {
  return (
    <Card className="flex">
      <div className="flex items-center gap-2 p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="import from excel" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex justify-center items-center gap-2 p-2">
        <div
          className="flex justify-center items-center bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] rounded-2xl w-[60px] h-[60px] cursor-pointer"
          onClick={async () => {
            const files = await openPath({
              filters: [
                {
                  name: "*",
                  extensions: ["xlsx", "xls", "csv"],
                },
              ],
            });
            const file = files.at(0);
            if (!file) {
              showToast("Please select a file");
              return;
            }
            loadFromExcel(file);
          }}
        >
          <Icon iconClassName="text-3xl" icon={allIcons.solid.faUpload} />
        </div>
        <div
          className="flex justify-center items-center bg-[--biqpod-gray-opacity] opacity-20 active:bg-[--biqpod-gray-opacity-2] p-2 rounded-2xl w-[60px] h-[60px] pointer-events-none"
          onClick={() => {
            window.open("https://account.biqpod.com/link");
          }}
        >
          <img
            className="object-cover"
            draggable={false}
            src={
              "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
            }
          />
        </div>
      </div>
    </Card>
  );
};
export const KeyLine = ({ prodKey, onChange, value }: KeyLineProps) => {
  const state = useCopyState<null | boolean>(value);
  useEffect(() => {
    if (state.get != value) {
      onChange(!!state.get);
    }
  }, [state.get]);
  return (
    <div className="flex items-center gap-2 p-2">
      <BooleanField state={state} id={`${prodKey}-key`} />
      <span className="text-xl capitalize">{prodKey}</span>
    </div>
  );
};
export const ExportExcelPopupProducts = () => {
  var keys = useCopyState<(keyof SnapBuy.Product)[]>([]);
  const action = useAction(
    "export-products",
    async () => {
      var products = await snapbuyApi.getAllProducts();
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
const PAGE_SIZE = 20;
export const Products = () => {
  const user = useUser();
  const products = useTemp<SnapBuy.Product[]>("fetched-products"); // Replace with your actual product data
  const lastDoc = useCopyState<SnapBuy.Product | null>(null);
  const hasMore = useCopyState(true);
  const storeId = useStoreId();
  const action = useAction(
    "fetch-products",
    async (next = false) => {
      if (!storeId) {
        return;
      }
      if (!user?.uid) return;
      await delay(300);
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(
            where("uid", "==", user.uid),
            where("storeId", "==", storeId) // Assuming storeId is the same as uid
          ),
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
      products.set((prev) => (next ? [...(prev || []), ...list] : list));
      const lastDocRef = newProducts.at(-1)?.data;
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(newProducts.length === PAGE_SIZE);
    },
    [user?.uid, storeId]
  );
  const success = isSuccess(action);
  useEffect(() => {
    execAction("fetch-products");
  }, [user]);
  const isFullWidth = useTemp("isFullWidth");
  const showTools = useCopyState(false);
  // categorys
  // market
  // filtring
  const search = getFieldValue("producer-search-product");
  const [_, filterProducts] = useMemoDelay(
    () => {
      if (!search) {
        return products.get;
      }
      return filterFuzzySearch(products.get || [], search, "name");
    },
    [search, products.get],
    1000
  );
  useEffect(() => {
    if (user?.uid) return snapbuyApi.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const canDelete = getTemp<string>("canDeleteProduct");
  const loading = isLoading(action);
  const selectedProducts = getTemp<string[]>("selected-products");
  // Helper: check if any product is selected
  const anyProductSelected = useMemo(() => {
    return !!selectedProducts?.length;
  }, [selectedProducts]);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div className="w-full">
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
          <CircleTip icon={allIcons.solid.faFilter} />
        </div>
      </div>
      <Line />
      <Scroll
        onScroll={(e) => {
          const target = e.currentTarget;
          if (
            target.scrollHeight - target.scrollTop - target.clientHeight <
              200 &&
            hasMore.get &&
            !loading
          ) {
            execAction("fetch-products", true);
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-2 p-2">
          {filterProducts?.map((product, index) => {
            return (
              <ProductRender index={index} product={product} key={product.id} />
            );
          })}
          {loading && (
            <EmptyComponent>
              {range(10).map((index) => {
                return (
                  <Card className="flex flex-col w-full h-[300px]">
                    <div className="p-2 h-full">
                      <CardWait key={index} className="rounded-2xl h-full" />
                    </div>
                    <Line />
                    <div className="p-2">
                      <CardWait className="rounded-2xl w-full h-[50px]" />
                    </div>
                  </Card>
                );
              })}
            </EmptyComponent>
          )}
          {success && filterProducts?.length === 0 && (
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
          <div className="w-full h-[100px]" />
        </div>
      </Scroll>
      <Card
        onClick={() => {
          showTools.set(!showTools.get);
        }}
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute flex flex-col items-center p-3 rounded-3xl"
      >
        <CircleTip
          icon={allIcons.solid.faArrowUpRightFromSquare}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            if (!storeId) {
              showToast("Store ID is not set", "error");
              return;
            }
            const ok = await confirm({
              title: "Deploy Products",
              message: "Are you sure you want to deploy products?",
              detail: "This will deploy all products to the server.",
              type: "warning",
            });
            if (ok) {
              setTemp("loading-text", "Start Retrieving Products");
              const allProducts = await snapbuyApi.getProductsOf(storeId);
              setTemp("loading-text", `Found ${allProducts?.length} Products`);
              const workbook = new ExcelJS.Workbook();
              const worksheet = workbook.addWorksheet("Products");
              // Add header
              worksheet.columns = allKeys.map((key) => ({
                header: key.replaceAll(".", " "),
                key: key,
              }));
              allProducts?.forEach(async (product) => {
                var option: Partial<Record<keys, string>> = {};
                allKeys.forEach((key) => {
                  if (key === "multiple.prices") {
                    option["multiple.prices"] = product.data?.multiple?.prices
                      ?.map((price) => price.price)
                      .join(arraySeparator);
                    return;
                  } else if (key === "multiple.counts") {
                    option["multiple.counts"] = product.data?.multiple?.prices
                      ?.map((price) => price.quantity)
                      .join(arraySeparator);
                    return;
                  } else if (key === "single.price") {
                    option["single.price"] =
                      product.data?.single?.price?.toString();
                    return;
                  } else {
                    var value = String(product.data?.[key]);
                  }
                  if (value === undefined) {
                    switch (key) {
                      case "available":
                        value = "false";
                        break;
                      case "limited":
                        value = "false";
                        break;
                      case "quantity":
                        value = "0";
                        break;
                    }
                  }
                  option[key] = value;
                });
                worksheet.addRow(option);
              }); // Add rows
              setTemp("loading-text", "Writing to Excel File");
              const buffer = await workbook.xlsx.writeBuffer();
              const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });
              setTemp("loading-text", "Uploading Excel File");
              const ref = [
                "projects",
                import.meta.env.VITE_PROJECT_ID,
                "stores",
                storeId,
                "products.xlsx",
              ];
              await uploadFile(ref, blob);
              setTemp("loading-text", "Setting Access Link");
              const accessLink = await getDownloadURL(ref);
              await setDoc(
                [
                  "projects",
                  import.meta.env.VITE_PROJECT_ID,
                  "stores",
                  storeId,
                ],
                {
                  accessLink,
                }
              );
              setTemp("loading-text", "Done");
              await delay(1000);
              setTemp("loading-text", "");
            }
          }}
        />
        <CircleTip
          icon={allIcons.solid.faBoxesPacking}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<UpsertPack />);
          }}
        />
        <CircleTip
          icon={allIcons.regular.faFileExcel}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<ExcelImportFrom />);
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
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<PostNewProduct />);
          }}
        />

        <CircleTip
          icon={allIcons.solid.faPlus}
          iconClassName={tw(
            "transition-transform",
            showTools.get ? "rotate-45" : "rotate-0"
          )}
        />
      </Card>
      {anyProductSelected && (
        <Card className="bottom-4 left-4 z-[5000000000000000000000000000000] absolute flex flex-col items-center p-3 rounded-3xl">
          <CircleTip
            // icon represent available
            icon={allIcons.regular.faEdit}
            onClick={async () => {
              if (selectedProducts) {
                const unAvailableProducts = filterProducts?.filter(
                  (prod) => !prod.available
                );
                if (unAvailableProducts?.length) {
                  const response = await confirm({
                    title: "Modify Products",
                    message:
                      "Are you sure you want to modify the selected products?",
                    detail: `You are about to modify ${unAvailableProducts?.length} products. This action cannot be undone.`,
                    type: "warning",
                  });
                  if (response) {
                    execAction("add-products", {
                      exists: unAvailableProducts?.map(({ id }) => {
                        return {
                          id,
                          available: true,
                        };
                      }),
                    });
                    setTemp("selected-products", []);
                  }
                } else {
                  showToast(
                    "No products with state un available there is",
                    "info"
                  );
                }
              }
            }}
          />
          <CircleTip
            icon={allIcons.solid.faCheckDouble}
            onClick={async () => {
              setTemp(
                "selected-products",
                filterProducts?.map(({ id }) => id)
              );
            }}
          />
          <CircleTip
            icon={allIcons.solid.faTrashCan}
            onClick={async () => {
              if (selectedProducts) {
                const response = await confirm({
                  title: "Delete Products",
                  message:
                    "Are you sure you want to delete the selected products?",
                  detail: `You are about to delete ${selectedProducts.length} products. This action cannot be undone.`,
                  type: "warning",
                });
                if (response) {
                  execAction("delete-products", selectedProducts);
                  setTemp("selected-products", []);
                }
              }
            }}
          />
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={async () => {
              setTemp("selected-products", []);
            }}
          />
        </Card>
      )}
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
