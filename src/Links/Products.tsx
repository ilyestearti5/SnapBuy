import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
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
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  getPosition,
  handelShadowColor,
  isLoading,
  isSuccess,
  openPath,
  showPopup,
  showToast,
  useAction,
  useColorMerge,
  useCopyState,
  useDeviceResolution,
  useMemoDelay,
  useResolution,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { FixedSizeList as List, ListOnScrollProps } from "react-window";
import { getDocs } from "../server";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ProductRender } from "./ProductRender";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreId } from "../utils";
import { useIndexedDBProducts } from "../hooks/useIndexedDBProducts";
import { loadFromExcel } from "./loadFromExcel";
import { FilterOptionsForProduct, PopupFilter } from "./PopupFilter";
import { AnimatedCard, FadeIn } from "../animations/components";
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
const JsonImportFrom = () => {
  const storeId = useStoreId();
  const action = useAction(
    "import-json",
    async () => {
      const files = await openPath({
        filters: [
          {
            name: "*",
            extensions: ["json"],
          },
        ],
      });
      const file = files.at(0);
      if (!file) {
        showToast("Please select a file");
        return;
      }
      const text = await (file as unknown as File).text();
      const data = JSON.parse(text);
      if (data.products && Array.isArray(data.products)) {
        await snapbuyApi.upsertProducts(
          storeId!,
          data.products.map((p: Partial<SnapBuy.Product>) => ({
            ...p,
            storeId,
          }))
        );
      }
      if (data.brands && Array.isArray(data.brands)) {
        for (const brand of data.brands) {
          await snapbuyApi.createBrand({ ...brand, storeId });
        }
      }
      if (data.packs && Array.isArray(data.packs)) {
        for (const pack of data.packs) {
          await snapbuyApi.addPack({ ...pack, storeId });
        }
      }
      if (data.collections && Array.isArray(data.collections)) {
        for (const collection of data.collections) {
          await snapbuyApi.upsertCollection({ ...collection, storeId });
        }
      }
      if (data.coupons && Array.isArray(data.coupons)) {
        for (const coupon of data.coupons) {
          await snapbuyApi.upsertCoupon({ ...coupon, storeId });
        }
      }
      showToast("Import completed successfully");
      closePopup();
    },
    [storeId]
  );
  const loading = isLoading(action);
  return (
    <Card className="flex">
      <div className="flex items-center gap-2 p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="import from json" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex justify-center items-center p-4">
        <Button
          onClick={() => {
            execAction("import-json");
          }}
          icon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faUpload
          }
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="select json file" />
        </Button>
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
    var option: Record<string, any> = {};
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
export const ExportJsonPopup = () => {
  const storeId = useStoreId();
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const loadPreview = useCallback(async () => {
    if (!storeId) return;
    setLoadingPreview(true);
    try {
      const exportData: {
        products?: SnapBuy.Product[];
        brands?: SnapBuy.Brand[];
        packs?: SnapBuy.Pack[];
        collections?: SnapBuy.Collection[];
        coupons?: SnapBuy.Coupon[];
      } = {};
      // Fetch all products
      try {
        const products = await snapbuyApi.getProductsOf(storeId);
        exportData.products = products || [];
      } catch (error) {
        exportData.products = [];
      }
      // Fetch all brands
      try {
        const brands = await snapbuyApi.getAllBrands(storeId);
        exportData.brands = brands || [];
      } catch (error) {
        exportData.brands = [];
      }
      // Fetch all packs
      try {
        const packs = await snapbuyApi.getPacks(storeId);
        exportData.packs = packs || [];
      } catch (error) {
        exportData.packs = [];
      }
      // Fetch all collections
      try {
        const collections = await snapbuyApi.getCollections(storeId);
        exportData.collections = collections || [];
      } catch (error) {
        exportData.collections = [];
      }
      // Fetch all coupons
      try {
        const coupons = await snapbuyApi.getCoupons(storeId);
        exportData.coupons = coupons || [];
      } catch (error) {
        exportData.coupons = [];
      }
      setPreviewData(exportData);
    } catch (error) {
      showToast("Failed to load preview data");
    } finally {
      setLoadingPreview(false);
    }
  }, [storeId]);
  const action = useAction(
    "export-json",
    async () => {
      if (!previewData) return;
      // Create and download JSON file
      const jsonString = JSON.stringify(previewData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      saveAs(
        blob,
        `snapbuy_export_${new Date().toISOString().split("T")[0]}.json`
      );
      showToast("Export completed successfully");
      closePopup();
    },
    [previewData]
  );
  const loading = isLoading(action);
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);
  const renderTable = (
    title: string,
    data: any[],
    columns: string[],
    productsData?: any[]
  ) => {
    if (!data || data.length === 0) {
      return (
        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-lg">{title}</h3>
          <div className="py-4 text-gray-500 text-center">
            <Translate content="no" /> {title.toLowerCase()}{" "}
            <Translate content="found" />
          </div>
        </div>
      );
    }
    // Create product name lookup map for packs
    const productNameMap = productsData
      ? productsData.reduce((map: Record<string, string>, product: any) => {
          if (product.id && product.name) {
            map[product.id] = product.name;
          }
          return map;
        }, {})
      : {};
    return (
      <div className="mb-6">
        <h3 className="mb-2 font-semibold text-lg">
          {title} ({data.length})
        </h3>
        <div className="border rounded-lg overflow-x-auto">
          <table className="border-[var(--biqpod-borders)] divide-y min-w-full">
            <thead className="bg-[var(--biqpod-secondary-background)]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 font-medium text-[var(--biqpod-secondary-content)] text-xs text-left uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--biqpod-primary-background)] divide-y divide-[var(--biqpod-borders)]">
              {data.slice(0, 5).map((item, index) => (
                <tr key={index}>
                  {columns.map((col) => {
                    let value = item[col];
                    if (
                      title === "Packs" &&
                      col === "products" &&
                      Array.isArray(value)
                    ) {
                      // Special formatting for packs products - show product names instead of IDs
                      value = value
                        .map((prod: any) => {
                          const productName =
                            productNameMap[prod.prodId] || prod.prodId;
                          return `${productName} (${prod.count})`;
                        })
                        .join(", ");
                    } else if (
                      title === "Collections" &&
                      col === "products" &&
                      Array.isArray(value)
                    ) {
                      // Special formatting for collections products - show product names instead of IDs
                      value = value
                        .map((prodId: string) => {
                          const productName = productNameMap[prodId] || prodId;
                          return productName;
                        })
                        .join(", ");
                    } else if (
                      col === "available" &&
                      typeof value === "boolean"
                    ) {
                      // Special formatting for available field - show checkmark/cross
                      value = value ? "✅" : "❌";
                    } else if (col === "price (client/customer)") {
                      // Special formatting for price field
                      if (item.type === "single" && item.single) {
                        const clientPrice = item.single.client
                          ? `DA${item.single.client}`
                          : "-";
                        const customerPrice = item.single.customer
                          ? `DA${item.single.customer}`
                          : "-";
                        value = `(${clientPrice})/(${customerPrice})`;
                      } else if (
                        item.type === "multiple" &&
                        item.multiple?.prices?.length
                      ) {
                        value = item.multiple.prices
                          .map((p: any) => `DA${p.price}`)
                          .join(", ");
                      } else {
                        value = "-";
                      }
                    } else if (typeof value === "object" && value !== null) {
                      value =
                        JSON.stringify(value).substring(0, 50) +
                        (JSON.stringify(value).length > 50 ? "..." : "");
                    }
                    return (
                      <td
                        key={col}
                        className="px-3 py-2 max-w-xs text-sm truncate"
                      >
                        {value?.toString() || "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {data.length > 5 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-2 text-[var(--biqpod-secondary-content)] text-sm italic"
                  >
                    <Translate content="... and" /> {data.length - 5}{" "}
                    <Translate content="more items" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-4/5 max-md:h-full md:max-h-[90vh] overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="export to json" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col h-full md:max-h-[calc(90vh-120px)] overflow-y-auto">
        {loadingPreview ? (
          <div className="flex justify-center items-center py-8">
            <CircleLoading />
            <span className="ml-2">
              <Translate content="loading preview..." />
            </span>
          </div>
        ) : previewData ? (
          <div className="p-4">
            <div className="bg-blue-50 mb-4 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>
                  <Translate content="preview:" />
                </strong>{" "}
                <Translate content="below is a sample of your data that will be exported. each table shows the first 5 items from each category." />
              </p>
            </div>
            {renderTable("Products", previewData.products, [
              "name",
              "description",
              "quantity",
              "available",
              "type",
              "price (client/customer)",
            ])}
            {renderTable("Brands", previewData.brands, ["name", "description"])}
            {renderTable(
              "Packs",
              previewData.packs,
              ["name", "price", "products"],
              previewData.products
            )}
            {renderTable(
              "Collections",
              previewData.collections,
              ["name", "products"],
              previewData.products
            )}
            {renderTable("Coupons", previewData.coupons, [
              "code",
              "name",
              "type",
              "value",
              "isActive",
            ])}
            <div className="bg-green-800/25 p-4 rounded-lg">
              <p className="mb-3 text-green-500 text-sm">
                <strong>
                  <Translate content="total items:" />
                </strong>{" "}
                {previewData.products?.length || 0}{" "}
                <Translate content="products" />,{" "}
                {previewData.brands?.length || 0} <Translate content="brands" />
                ,{previewData.packs?.length || 0} <Translate content="packs" />,{" "}
                {previewData.collections?.length || 0}{" "}
                <Translate content="collections" />,
                {previewData.coupons?.length || 0}{" "}
                <Translate content="coupons" />
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-8">
            <span className="text-gray-500">
              <Translate content="failed to load preview" />
            </span>
          </div>
        )}
      </div>
      {previewData && (
        <EmptyComponent>
          <Line />
          <div className="p-3">
            <Button
              onClick={() => {
                execAction("export-json");
              }}
              icon={
                loading
                  ? allIcons.solid.faCircleNotch
                  : allIcons.solid.faDownload
              }
              iconClassName={tw(loading && "animate-spin")}
            >
              <Translate content="export all data to json" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
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
      <motion.div
        drag
        dragMomentum={false}
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5,
        }}
      >
        <Card className="flex flex-col items-center p-3 rounded-3xl">
          <AnimatePresence>
            {showTools && (
              <EmptyComponent>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CircleTip
                    icon={allIcons.solid.faFileCode}
                    className="text-blue-600"
                    onClick={async () => {
                      showPopup(<JsonImportFrom />);
                    }}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CircleTip
                    icon={allIcons.solid.faFileCode}
                    className="text-purple-600"
                    onClick={() => {
                      showPopup(<ExportJsonPopup />);
                    }}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CircleTip
                    icon={allIcons.regular.faFileExcel}
                    className="text-green-600"
                    onClick={async () => {
                      showPopup(<ExcelImportFrom />);
                    }}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <CircleTip
                    className="text-green-600"
                    onClick={() => {
                      showPopup(<ExportExcelPopupProducts />);
                    }}
                    icon={allIcons.solid.faFileExcel}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: 0 }}
                >
                  <CircleTip
                    icon={allIcons.solid.faPlus}
                    className="text-violet-500"
                    onClick={async () => {
                      showPopup(<PostNewProduct />);
                    }}
                  />
                </motion.div>
              </EmptyComponent>
            )}
          </AnimatePresence>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <CircleTip
              onClick={onToggleTools}
              icon={allIcons.solid.faPlus}
              iconClassName={tw(
                "transition-transform duration-300",
                showTools ? "rotate-45 text-sky-700" : "rotate-0"
              )}
            />
          </motion.div>
        </Card>
      </motion.div>
    );
  }
);
const PAGE_SIZE = 20;
export const Products = () => {
  const storeId = useStoreId();
  const {
    products,
    lastDoc,
    isLoading: cacheLoading,
    updateProducts,
    addProducts,
  } = useIndexedDBProducts(storeId);
  const hasMore = useCopyState(true);
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
          startAt: next && lastDoc?.id && mergeArray(lastDoc?.id),
        }
      );
      if (!newProducts) {
        return;
      }
      const list = newProducts.map((order) => ({
        ...order.data,
        id: order.id,
      }));
      if (next) {
        addProducts(list, newProducts.at(-1)?.data || null);
      } else {
        updateProducts(list, newProducts.at(-1)?.data || null);
      }
      hasMore.set(newProducts.length === PAGE_SIZE);
    },
    [storeId, lastDoc]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (cacheLoading) return;
    if (products.length === 0) {
      execAction("fetch-products", false);
    } else if (lastDoc) {
      // Try to fetch more products
      execAction("fetch-products", true);
    }
  }, [cacheLoading, products.length, lastDoc]);
  const showTools = useCopyState(false);
  const options = useTemp<FilterOptionsForProduct>("filter-products-options");
  const search = getFieldValue("producer-search-product");
  const [_, filterProducts] = useMemoDelay(
    () => {
      let filteredProducts = products?.filter((prod: SnapBuy.Product) => {
        // Apply filter options with AND logic
        if (options.get) {
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
          // Filter by brand
          if (
            options.get.brand !== null &&
            options.get.brand !== undefined &&
            options.get.brand !== ""
          ) {
            if (prod.brandId !== options.get.brand) {
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
            if (!!prod.multiple?.prices !== isPromoted) {
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
            if (prod.type === "single" && prod.single?.client) {
              productPrice = prod.single.client;
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
            if (prod.type === "single" && prod.single?.client) {
              productPrice = prod.single.client;
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
    [search, products, options.get],
    500
  );
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
  const { isMobile, isDesktop, isTablet } = useDeviceResolution();
  const columns = useMemo(() => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    if (isDesktop) return 4;
    return 2; // fallback
  }, [isMobile, isTablet, isDesktop]);
  // Memoize the item count to prevent recalculation
  const itemCount = useMemo(() => {
    return Math.ceil((filterProducts?.length || 0 + 1) / columns);
  }, [filterProducts?.length, columns]);
  // Stable onScroll callback
  const handleScroll = useCallback(
    (e: ListOnScrollProps) => {
      scrollState.current = e.scrollOffset || 0;
      setShowShadow((e.scrollOffset || 0) > 40);
      // Infinite scroll logic
      const { scrollOffset, scrollDirection } = e;
      const threshold = 200;
      const isNearBottom =
        scrollDirection === "forward" &&
        scrollOffset + listHeight >=
          Math.ceil((filterProducts?.length || 0) / columns) * 340 - threshold;
      if (isNearBottom && hasMore.get && !loading) {
        execAction("fetch-products", true);
      }
    },
    [listHeight, filterProducts?.length, hasMore.get, loading, columns]
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
        // Loading placeholder card
        return (
          <div style={style} className="flex items-center gap-2 p-2">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div
                key={`loading-${index}-${colIndex}`}
                className="flex flex-col bg-[var(--biqpod-primary-background)] p-3 border border-[var(--biqpod-borders)] rounded-lg animate-pulse"
                style={{ width: "100%", maxWidth: "300px" }}
              >
                {/* Image placeholder */}
                <div className="bg-[var(--biqpod-secondary-background)] mb-3 rounded-lg w-full h-32"></div>

                {/* Title placeholder */}
                <div className="bg-[var(--biqpod-secondary-background)] mb-2 rounded h-4"></div>
                <div className="bg-[var(--biqpod-secondary-background)] mb-3 rounded w-3/4 h-3"></div>

                {/* Price placeholder */}
                <div className="bg-[var(--biqpod-secondary-background)] mb-2 rounded w-1/2 h-5"></div>

                {/* Button placeholder */}
                <div className="bg-[var(--biqpod-secondary-background)] rounded w-full h-8"></div>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div style={style} className="flex items-center gap-2 p-2">
          {Array.from({ length: columns }, (_, colIndex) => {
            const product = data?.at(index * columns + colIndex);
            return (
              typeof product === "object" && (
                <ProductRender
                  index={index * columns + colIndex}
                  product={product}
                  key={product.id}
                />
              )
            );
          })}
        </div>
      );
    },
    [columns]
  );
  // Memoized main content section to prevent unnecessary re-renders
  const MainContent = useMemo(() => {
    if (filterProducts && filterProducts.length > 0) {
      return (
        <motion.div
          className="relative h-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {showShadow && (
            <motion.div
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <List
            ref={listRef}
            height={listHeight}
            itemCount={itemCount}
            itemSize={340}
            width={"100%"}
            itemData={
              loading || cacheLoading
                ? [...listItemData, ...range(0, columns)]
                : listItemData
            }
            onScroll={handleScroll}
          >
            {RenderItem}
          </List>
        </motion.div>
      );
    }
    return (
      <FadeIn className="flex justify-center items-center w-full h-full">
        <AnimatedCard>
          <Card>
            <motion.div
              className="flex justify-center items-center p-2 h-full"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Icon
                icon={allIcons.solid.faBoxOpen}
                iconClassName="text-9xl text-[--biqpod-primary]"
              />
            </motion.div>
            <Line />
            <div className="flex justify-center items-center p-4 h-full text-2xl capitalize">
              <Translate content="no products found" />
            </div>
          </Card>
        </AnimatedCard>
      </FadeIn>
    );
  }, [
    loading,
    cacheLoading,
    success,
    products.length,
    filterProducts,
    showShadow,
    colorMerge,
    listHeight,
    itemCount,
    listItemData,
    handleScroll,
    RenderItem,
  ]);
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <PositionView positionId="searching">
        <motion.div
          className="flex justify-between items-center gap-2 p-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="relative flex justify-center w-full">
            <Field
              inputName="producer-search-product"
              placeholder="Search Product"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2 transform">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                / {filterProducts?.length || 0}
              </motion.span>
            </span>
          </div>
          <motion.div
            className="flex"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CircleTip
              icon={allIcons.solid.faFilter}
              onClick={() => {
                showPopup(
                  <PopupFilter value={options.get} onChange={options.set} />
                );
              }}
            />
          </motion.div>
        </motion.div>
        <Line />
      </PositionView>
      {MainContent}
      <ToolsCard
        showTools={showTools.get}
        onToggleTools={toggleTools}
        storeId={storeId}
      />
    </motion.div>
  );
};
