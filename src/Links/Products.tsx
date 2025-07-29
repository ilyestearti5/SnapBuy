import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { delay, filterFuzzySearch, mergeArray, tw } from "@biqpod/app/ui/utils";
import {
  BooleanField,
  Button,
  Card,
  CircleLoading,
  CircleTip,
  Field,
  Icon,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  getPosition,
  handelShadowColor,
  isLoading,
  isSuccess,
  openPath,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useColorMerge,
  useCopyState,
  useMemoDelay,
  useResolution,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { getDocs } from "../server";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ProductRender } from "./ProductRender";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useStoreId } from "../App";
import { loadFromExcel } from "./loadFromExcel";
import { FilterOptionsForProduct, PopupFilter } from "./PopupFilter";
import { Collections } from "./Collections";
import { Packs } from "./Packs";
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
const ToolsCard = memo(
  ({
    showTools,
    onToggleTools,
  }: {
    showTools: boolean;
    onToggleTools: () => void;
    storeId: string | null | undefined;
  }) => {
    return (
      <Card
        onClick={onToggleTools}
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute flex flex-col items-center p-3 rounded-3xl"
      >
        {/* <CircleTip
          icon={allIcons.solid.faArrowUpRightFromSquare}
          className={tw(
            "transition-[width,height] bg-[--biqpod-gray-opacity] animate-pulse hover:animate-none active:animate-ping text-yellow-600",
            !showTools && "w-[0px] h-[0px]"
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
                    option["multiple.prices"] = product?.multiple?.prices
                      ?.map((price) => price.price)
                      .join(arraySeparator);
                    return;
                  } else if (key === "multiple.counts") {
                    option["multiple.counts"] = product?.multiple?.prices
                      ?.map((price) => price.quantity)
                      .join(arraySeparator);
                    return;
                  } else if (key === "single.price") {
                    option["single.price"] = product?.single?.price?.toString();
                    return;
                  } else {
                    var value = String(product?.[key]);
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
        /> */}
        <CircleTip
          icon={allIcons.solid.faCodeFork}
          className={tw(
            "transition-[width,height] text-red-300",
            !showTools && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<Collections />);
          }}
        />
        <CircleTip
          icon={allIcons.solid.faBoxesPacking}
          className={tw(
            "transition-[width,height] text-blue-300",
            !showTools && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<Packs />);
          }}
        />
        <CircleTip
          icon={allIcons.regular.faFileExcel}
          className={tw(
            "transition-[width,height] text-green-600",
            !showTools && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<ExcelImportFrom />);
          }}
        />
        <CircleTip
          className={tw(
            "transition-[width,height] text-green-600",
            !showTools && "w-[0px] h-[0px]"
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
            "transition-[width,height] text-violet-500",
            !showTools && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<PostNewProduct />);
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          iconClassName={tw(
            "transition-transform",
            showTools ? "rotate-45 text-sky-700" : "rotate-0"
          )}
        />
      </Card>
    );
  }
);
ToolsCard.displayName = "ToolsCard";
const SelectedProductsCard = memo(
  ({
    selectedProducts,
    filterProducts,
    anyProductSelected,
  }: {
    selectedProducts: string[] | null | undefined;
    filterProducts: SnapBuy.Product[] | null | undefined;
    anyProductSelected: boolean;
  }) => {
    if (!anyProductSelected) return null;
    return (
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
    );
  }
);
SelectedProductsCard.displayName = "SelectedProductsCard";
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
      await delay(300);
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(
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
    [storeId]
  );
  const success = isSuccess(action);
  useEffect(() => {
    execAction("fetch-products");
  }, [user]);
  const showTools = useCopyState(false);
  const options = useTemp<FilterOptionsForProduct>("filter-products-options");
  const search = getFieldValue("producer-search-product");
  const [_, filterProducts] = useMemoDelay(
    () => {
      let filteredProducts = products.get?.filter((prod) => {
        // Apply filter options with AND logic
        if (options.get) {
          // Filter by category
          if (options.get.category && options.get.category !== "all") {
            if (prod.category !== options.get.category) {
              return false;
            }
          }
          // Filter by availability
          if (
            options.get.available !== null &&
            options.get.available !== undefined &&
            options.get.available !== ""
          ) {
            const isAvailable = options.get.available === "true";
            if (prod.available !== isAvailable) {
              return false;
            }
          }
          // Filter by promoted status (if implemented in your product structure)
          if (
            options.get.promoted !== null &&
            options.get.promoted !== undefined &&
            options.get.promoted !== ""
          ) {
            const isPromoted = options.get.promoted === "true";
            // Assuming promoted is a field in your product structure
            // If not implemented, you can add it to the Product interface
            if (prod.metaData?.promoted !== isPromoted) {
              return false;
            }
          }
          // Filter by price range
          if (
            options.get.minPrice !== null &&
            options.get.minPrice !== undefined &&
            options.get.minPrice > 0
          ) {
            let productPrice = 0;
            if (prod.type === "single" && prod.single?.price) {
              productPrice = prod.single.price;
            } else if (
              prod.type === "multiple" &&
              prod.multiple?.prices?.length
            ) {
              // For multiple prices, use the minimum price
              productPrice = Math.min(
                ...prod.multiple.prices.map((p) => p.price)
              );
            }
            if (productPrice < options.get.minPrice) {
              return false;
            }
          }
          if (
            options.get.maxPrice !== null &&
            options.get.maxPrice !== undefined &&
            options.get.maxPrice > 0
          ) {
            let productPrice = 0;
            if (prod.type === "single" && prod.single?.price) {
              productPrice = prod.single.price;
            } else if (
              prod.type === "multiple" &&
              prod.multiple?.prices?.length
            ) {
              // For multiple prices, use the maximum price
              productPrice = Math.max(
                ...prod.multiple.prices.map((p) => p.price)
              );
            }
            if (productPrice > options.get.maxPrice) {
              return false;
            }
          }
        }
        return true;
      });
      // Apply search filter after other filters
      if (!search) {
        return filteredProducts;
      }
      return filterFuzzySearch(filteredProducts || [], search, "name");
    },
    [search, products.get, options.get],
    500
  );
  useEffect(() => {
    if (user?.uid) return snapbuyApi.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const loading = isLoading(action);
  // FastList related state and refs
  const listRef = useRef<any>(null);
  const scrollState = useRef(0);
  const [showShadow, setShowShadow] = useState(false);
  // Position and height calculation for FastList
  const position = getPosition("searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop;
  }, [position, height]);
  const colorMerge = useColorMerge();
  // Helper: check if any product is selected
  // Stable toggle function for tools
  const toggleTools = useCallback(() => {
    showTools.set(!showTools.get);
  }, [showTools]);
  // Reset scroll when search changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem?.(0);
    }
  }, [search]);
  // Memoize the item data to prevent unnecessary re-renders
  const listItemData = useMemo(() => {
    return filterProducts ? [...filterProducts, 0] : [];
  }, [filterProducts]);
  // Memoize the item count to prevent recalculation
  const itemCount = useMemo(() => {
    return Math.ceil((filterProducts?.length || 0 + 1) / 2);
  }, [filterProducts?.length]);
  // Stable onScroll callback
  const handleScroll = useCallback(
    (e: any) => {
      scrollState.current = e.scrollOffset || 0;
      setShowShadow((e.scrollOffset || 0) > 40);
      // Infinite scroll logic
      const { scrollOffset, scrollDirection } = e;
      const threshold = 200;
      const isNearBottom =
        scrollDirection === "forward" &&
        scrollOffset + listHeight >=
          Math.ceil((filterProducts?.length || 0) / 2) * 340 - threshold;
      if (isNearBottom && hasMore.get && !loading) {
        execAction("fetch-products", true);
      }
    },
    [listHeight, filterProducts?.length, hasMore.get, loading]
  );
  // Memoized render item function
  const RenderItem = useCallback(
    ({
      index,
      style,
      data,
    }: {
      index: number;
      style: React.CSSProperties;
      data: (SnapBuy.Product | number)[];
    }) => {
      if (typeof data === "number") {
        return <div style={style} />;
      }
      const first = data?.at(index * 2);
      const second = data?.at(index * 2 + 1);
      return (
        <div style={style} className="flex items-center gap-2 p-2">
          {typeof first == "object" && (
            <ProductRender index={index * 2} product={first} key={first.id} />
          )}
          {typeof second == "object" && (
            <ProductRender
              index={index * 2 + 1}
              product={second}
              key={second.id}
            />
          )}
        </div>
      );
    },
    []
  );
  // Memoized main content section to prevent unnecessary re-renders
  const MainContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <CircleLoading />
        </div>
      );
    }
    if (!success) {
      return null;
    }
    return (
      <div className="relative h-full overflow-hidden">
        {showShadow && (
          <div
            style={{
              ...colorMerge({
                boxShadow: handelShadowColor([
                  {
                    x: 0,
                    y: 0,
                    blur: 20,
                    size: 5,
                    colorId: "shadow.color",
                  },
                ]),
              }),
            }}
            className="top-[-30px] z-[10000] absolute inset-x-0 shadow-xl h-[30px]"
          />
        )}
        {!!filterProducts?.length && (
          <List
            ref={listRef}
            height={listHeight}
            itemCount={itemCount}
            itemSize={340}
            width={"100%"}
            itemData={listItemData}
            onScroll={handleScroll}
          >
            {RenderItem}
          </List>
        )}
        {filterProducts && filterProducts?.length === 0 && (
          <div className="flex justify-center items-center w-full h-full">
            <Card>
              <div className="flex justify-center items-center p-2 h-full">
                <Icon
                  icon={allIcons.solid.faBoxOpen}
                  iconClassName="text-9xl text-[--biqpod-primary]"
                />
              </div>
              <Line />
              <div className="flex justify-center items-center p-4 h-full text-2xl capitalize">
                <Translate content="no products found" />
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }, [
    loading,
    success,
    showShadow,
    colorMerge,
    filterProducts?.length,
    listHeight,
    itemCount,
    listItemData,
    handleScroll,
    RenderItem,
  ]);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <PositionView positionId="searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="relative flex justify-center w-full">
            <Field
              inputName="producer-search-product"
              placeholder="Search Product"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
              / {filterProducts?.length || 0}
            </span>
          </div>
          <div className="flex">
            <CircleTip
              icon={allIcons.solid.faFilter}
              onClick={() => {
                showPopup(
                  <PopupFilter value={options.get} onChange={options.set} />
                );
              }}
            />
          </div>
        </div>
        <Line />
      </PositionView>
      {MainContent}
      <ToolsCard
        showTools={showTools.get}
        onToggleTools={toggleTools}
        storeId={storeId}
      />
    </div>
  );
};
