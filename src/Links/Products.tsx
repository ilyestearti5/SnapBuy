import { allIcons } from "@biqpod/app/ui/apis";
import { delay, filterFuzzySearch, range, tw } from "@biqpod/app/ui/utils";
import {
  BooleanField,
  Button,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  PositionView,
  Translate,
  ArrayField,
  Scroll,
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
  useTemp,
  confirm,
  openMenu,
  getTemp,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ProductRender } from "./ProductRender";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreId } from "../utils";
import { useIndexedDBProducts } from "../hooks/useIndexedDBProducts";
import { loadFromExcel } from "./loadFromExcel";
import {
  FilterOptionsForProduct,
  AdminFilterProducts,
} from "./AdminPopupFilter";
import { AnimatedCard, FadeIn } from "../animations/components";
import { useUsedBy } from "../routes/Stores/Stores";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { MetadataFieldComponent } from "../components/MetadataField";
import { MergePhotosPopup } from "./MergePhotosPopup";
const productKeys: (keyof Biqpod.Snapbuy.Product)[] = [
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
  prodKey: keyof Biqpod.Snapbuy.Product;
  value: boolean;
  onChange: (value: boolean) => void;
}
// Platform logos configuration
const PLATFORM_LOGOS = {
  woocommerce:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/WooCommerce_logo.svg/2560px-WooCommerce_logo.svg.png",
  shopify:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/2560px-Shopify_logo_2018.svg.png",
  wordpress:
    "https://logos-world.net/wp-content/uploads/2020/10/WordPress-Emblem.png",
  json: "https://upload.wikimedia.org/wikipedia/commons/c/c9/JSON_vector_logo.svg",
  excel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Microsoft_Excel_2013-2019_logo.svg/1085px-Microsoft_Excel_2013-2019_logo.svg.png",
  bigcommerce: "https://cdn.worldvectorlogo.com/logos/bigcommerce-1.svg",
  magento:
    "https://upload.wikimedia.org/wikipedia/commons/5/55/Magento_Logo.svg",
};
interface ImportExportMethod {
  name: string;
  logo: string;
  onClick: () => void;
  comingSoon?: boolean;
}
interface ImportExportPopupProps {
  mode: "import" | "export";
}
const ImportExportPopup = ({ mode }: ImportExportPopupProps) => {
  const storeId = useStoreId();
  const bigMerchants: ImportExportMethod[] = [
    {
      name: "WooCommerce",
      logo: PLATFORM_LOGOS.woocommerce,
      onClick: () => {
        showToast("WooCommerce integration coming soon!", "info");
      },
    },
    {
      name: "Shopify",
      logo: PLATFORM_LOGOS.shopify,
      onClick: () => {
        showToast("Shopify integration coming soon!", "info");
      },
    },
    {
      name: "WordPress",
      logo: PLATFORM_LOGOS.wordpress,
      onClick: () => {
        showToast("WordPress integration coming soon!", "info");
      },
    },
    {
      name: "BigCommerce",
      logo: PLATFORM_LOGOS.bigcommerce,
      onClick: () => {
        showToast("BigCommerce integration coming soon!", "info");
      },
    },
    {
      name: "Magento",
      logo: PLATFORM_LOGOS.magento,
      onClick: () => {
        showToast("Magento integration coming soon!", "info");
      },
    },
  ];
  const fileSystems: ImportExportMethod[] =
    mode === "import"
      ? [
          {
            name: "JSON",
            logo: PLATFORM_LOGOS.json,
            onClick: async () => {
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
                await snapbuyApi.product.upsert(
                  storeId!,
                  data.products.map((p: Partial<Biqpod.Snapbuy.Product>) => p)
                );
              }
              if (data.brands && Array.isArray(data.brands)) {
                for (const brand of data.brands) {
                  await snapbuyApi.brands.create({ ...brand, storeId });
                }
              }
              if (data.packs && Array.isArray(data.packs)) {
                for (const pack of data.packs) {
                  await snapbuyApi.packs.add({ ...pack, storeId });
                }
              }
              if (data.collections && Array.isArray(data.collections)) {
                for (const collection of data.collections) {
                  await snapbuyApi.collections.upsert({
                    ...collection,
                    storeId,
                  });
                }
              }
              if (data.coupons && Array.isArray(data.coupons)) {
                for (const coupon of data.coupons) {
                  await snapbuyApi.coupon.upsert({ ...coupon, storeId });
                }
              }
              showToast("Import completed successfully");
              closePopup();
            },
          },
          {
            name: "Excel",
            logo: PLATFORM_LOGOS.excel,
            onClick: async () => {
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
              closePopup();
            },
          },
        ]
      : [
          {
            name: "JSON",
            logo: PLATFORM_LOGOS.json,
            onClick: () => {
              closePopup();
              showPopup(<ExportJsonPopup />);
            },
          },
          {
            name: "Excel",
            logo: PLATFORM_LOGOS.excel,
            onClick: () => {
              closePopup();
              showPopup(<ExportExcelPopupProducts />);
            },
          },
        ];
  const renderMethodCard = (method: ImportExportMethod) => (
    <motion.div
      key={method.name}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={method.onClick}
      className={tw(
        "relative flex flex-col items-center gap-3 bg-[--biqpod-primary-background] hover:bg-[--biqpod-gray-opacity] border p-4 rounded-2xl cursor-pointer border-solid border-[--biqpod-borders] duration-200",
        method.comingSoon && "opacity-60"
      )}
    >
      {method.comingSoon && (
        <div className="top-2 right-2 absolute bg-yellow-500 px-2 py-1 rounded-full font-semibold text-white text-xs">
          Soon
        </div>
      )}
      <div className="flex justify-center items-center bg-white rounded-xl w-full h-20 overflow-hidden">
        <img
          src={method.logo}
          alt={method.name}
          className="p-2 w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <span className="font-semibold text-sm text-center capitalize">
        {method.name}
      </span>
    </motion.div>
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-3/4 lg:w-2/3 max-md:h-full md:max-h-[85vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate
            content={mode === "import" ? "import products" : "export products"}
          />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <Scroll className="flex flex-col gap-6 p-4 h-full">
        {/* Big Merchants Section */}
        <div>
          <h2 className="mb-4 font-semibold text-xl capitalize">
            <Icon icon={allIcons.solid.faStore} iconClassName="mr-2" />
            <Translate content="big merchants" />
          </h2>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {bigMerchants.map(renderMethodCard)}
          </div>
        </div>
        {/* File Systems Section */}
        <div>
          <h2 className="mb-4 font-semibold text-xl capitalize">
            <Icon icon={allIcons.solid.faFile} iconClassName="mr-2" />
            <Translate content="file systems" />
          </h2>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {fileSystems.map(renderMethodCard)}
          </div>
        </div>
      </Scroll>
    </Card>
  );
};
export const KeyLine = ({ prodKey, onChange, value }: KeyLineProps) => {
  const state = useCopyState<Biqpod.System.Setting.Value["boolean"]>(value);
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
  var keys = useCopyState<(keyof Biqpod.Snapbuy.Product)[]>([]);
  const action = useAction(
    "export-products",
    async () => {
      var products = await snapbuyApi.product.getAll();
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
  products: Biqpod.Snapbuy.Product[],
  keys: (keyof Biqpod.Snapbuy.Product)[]
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
        products?: Biqpod.Snapbuy.Product[];
        brands?: Biqpod.Snapbuy.Brand[];
        packs?: Biqpod.Snapbuy.Pack[];
        collections?: Biqpod.Snapbuy.Collection[];
        coupons?: Biqpod.Snapbuy.Coupon[];
      } = {};
      // Fetch all products
      try {
        const products = await snapbuyApi.product.getProductsOf(storeId);
        exportData.products = products || [];
      } catch (error) {
        exportData.products = [];
      }
      // Fetch all brands
      try {
        const brands = await snapbuyApi.brands.getAll(storeId);
        exportData.brands = brands || [];
      } catch (error) {
        exportData.brands = [];
      }
      // Fetch all packs
      try {
        const packs = await snapbuyApi.packs.getAll(storeId);
        exportData.packs = packs || [];
      } catch (error) {
        exportData.packs = [];
      }
      // Fetch all collections
      try {
        const collections = await snapbuyApi.collections.getAll(storeId);
        exportData.collections = collections || [];
      } catch (error) {
        exportData.collections = [];
      }
      // Fetch all coupons
      try {
        const coupons = await snapbuyApi.coupon.getAll(storeId);
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
    onStartSelection,
  }: {
    showTools: boolean;
    onToggleTools: () => void;
    onStartSelection: () => void;
  }) => {
    const usedBy = useUsedBy();
    const isSelectionMode = getTemp<boolean>("is-selection-mode");
    return (
      <motion.div
        drag
        dragMomentum={false}
        layout
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5,
        }}
      >
        <Card
          motionProps={{
            initial: { opacity: 0, y: 20, scale: 0.9, height: "auto" },
            animate: {
              opacity: 1,
              y: 0,
              scale: 1,
              height: showTools ? "auto" : 60,
              transition: {
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { type: "spring", stiffness: 400, damping: 25 },
                y: { type: "spring", stiffness: 400, damping: 25 },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              },
            },
            exit: { opacity: 0, y: 20, scale: 0.9, height: 60 },
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.3,
            },
            whileHover: {
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            },
            whileTap: { scale: 0.98 },
            layout: true,
          }}
          enableAnimations
          className="flex flex-col items-center bg-[--biqpod-gray-opacity] shadow-2xl backdrop-blur-sm p-3 border-0 rounded-3xl overflow-hidden"
        >
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.1,
                    },
                  },
                }}
                className="flex flex-col gap-2"
              >
                {usedBy !== "read" && (
                  <motion.div
                    variants={{
                      hidden: { scale: 0, opacity: 0, y: 20 },
                      visible: { scale: 1, opacity: 1, y: 0 },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    {!isSelectionMode && (
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      >
                        <CircleTip
                          icon={allIcons.solid.faListCheck}
                          className="text-orange-600 hover:text-orange-700 transition-colors duration-200"
                          onClick={() => {
                            onStartSelection();
                          }}
                        />
                      </motion.div>
                    )}
                    {/* Import Button */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      variants={{
                        hidden: { scale: 0, opacity: 0, y: 20 },
                        visible: { scale: 1, opacity: 1, y: 0 },
                      }}
                    >
                      <CircleTip
                        icon={allIcons.solid.faFileImport}
                        className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        onClick={() => {
                          showPopup(<ImportExportPopup mode="import" />);
                        }}
                      />
                    </motion.div>
                    {/* Export Button */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                      variants={{
                        hidden: { scale: 0, opacity: 0, y: 20 },
                        visible: { scale: 1, opacity: 1, y: 0 },
                      }}
                    >
                      <CircleTip
                        icon={allIcons.solid.faFileExport}
                        className="text-purple-600 hover:text-purple-700 transition-colors duration-200"
                        onClick={() => {
                          showPopup(<ImportExportPopup mode="export" />);
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
                {usedBy !== "read" && (
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    variants={{
                      hidden: { scale: 0, opacity: 0, y: 20 },
                      visible: { scale: 1, opacity: 1, y: 0 },
                    }}
                  >
                    <CircleTip
                      icon={allIcons.solid.faPlus}
                      className="text-violet-500 hover:text-violet-600 transition-colors duration-200"
                      onClick={async () => {
                        showPopup(<PostNewProduct />);
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <CircleTip
            onClick={onToggleTools}
            icon={allIcons.solid.faPlus}
            iconClassName={tw(
              "transition-transform duration-300 ease-in-out",
              showTools ? "rotate-45" : "rotate-0"
            )}
          />
        </Card>
      </motion.div>
    );
  }
);
export const Products = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const {
    products,
    isLoading: cacheLoading,
    setProducts,
  } = useIndexedDBProducts(storeId);
  const tabsPosition = getPosition("products-and-brands");
  const action = useAction(
    "fetch-products",
    async () => {
      if (!storeId) {
        return;
      }
      await delay(200);
      var result = await snapbuyApi.product.getProductsOf(storeId);
      if (!result) {
        return;
      }
      setProducts(
        result.sort((a, b) => {
          return a.name?.localeCompare(b.name || "") || 0;
        })
      );
    },
    [storeId]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (cacheLoading) return;
    if (products.length === 0) {
      execAction("fetch-products", false);
    }
  }, [cacheLoading, products.length]);
  const showTools = useCopyState(false);
  const selectedProducts = useTemp<string[]>("selected-products");
  const isSelectionMode = useTemp<boolean>("is-selection-mode");
  const bulkDeleteAction = useAction(
    "bulk-delete-products",
    async () => {
      const selectedProductIds = selectedProducts.get || [];
      if (selectedProductIds.length === 0) {
        showToast("No products selected for deletion", "error");
        return;
      }
      try {
        // Delete each selected product
        await Promise.all(
          selectedProductIds.map(async (productId) => {
            await snapbuyApi.product.delete(productId);
          })
        );
        // Clear selection and exit selection mode
        selectedProducts.set([]);
        isSelectionMode.set(false);
        // Show success message
        const productCount = selectedProductIds.length;
        showToast(
          `Successfully deleted ${productCount} product${
            productCount > 1 ? "s" : ""
          }`,
          "success"
        );
        // Refresh the product list
        execAction("fetch-products", false);
      } catch (error) {
        console.error("Failed to delete products:", error);
        showToast("Failed to delete some products. Please try again.", "error");
        throw error; // Re-throw to mark action as failed
      }
    },
    [selectedProducts.get, isSelectionMode]
  );
  const bulkToggleAvailabilityAction = useAction(
    "bulk-toggle-availability",
    async (enable: boolean) => {
      const selectedProductIds = selectedProducts.get || [];
      if (selectedProductIds.length === 0) {
        showToast("No products selected", "error");
        return;
      }
      try {
        // Update availability for each selected product
        await Promise.all(
          selectedProductIds.map(async (productId) => {
            const product = await snapbuyApi.product.get(productId);
            if (product) {
              const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
                id: productId,
                available: enable,
              };
              await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
            }
          })
        );
        // Clear selection and exit selection mode
        selectedProducts.set([]);
        isSelectionMode.set(false);
        // Show success message
        const productCount = selectedProductIds.length;
        const actionText = enable ? "enabled" : "disabled";
        showToast(
          `Successfully ${actionText} ${productCount} product${
            productCount > 1 ? "s" : ""
          }`,
          "success"
        );
        // Refresh the product list
        execAction("fetch-products", false);
      } catch (error) {
        console.error("Failed to update product availability:", error);
        showToast("Failed to update some products. Please try again.", "error");
        throw error; // Re-throw to mark action as failed
      }
    },
    [selectedProducts.get, isSelectionMode, storeId]
  );
  const bulkDeleteLoading = isLoading(bulkDeleteAction);
  const bulkToggleLoading = isLoading(bulkToggleAvailabilityAction);
  const options = useTemp<FilterOptionsForProduct>("filter-products-options");
  const search = getFieldValue("producer-search-product");
  const [_, filterProducts] = useMemoDelay(
    () => {
      let filteredProducts = products?.filter((prod) => {
        // Apply filter options with AND logic
        if (options.get) {
          // Filter by availability
          if (options.get.available && options.get.available !== "all") {
            const isAvailable = options.get.available === "true";
            if (prod.available !== isAvailable) {
              return false;
            }
          }
          // Filter by multiple brands
          if (options.get.brands && options.get.brands.length > 0) {
            if (!options.get.brands.includes(prod.brandId || "")) {
              return false;
            }
          }
          // Filter by keys
          if (options.get.keys && options.get.keys.length > 0) {
            // Assuming keys are metadata keys
            const hasKeys = options.get.keys.every(
              (key) => prod.metaData && key in prod.metaData
            );
            if (!hasKeys) {
              return false;
            }
          }
          // Filter by product type
          if (options.get.productType) {
            if (prod.type !== options.get.productType) {
              return false;
            }
          }
          // Filter by metadata
          if (
            options.get.metadata &&
            Object.keys(options.get.metadata).length > 0
          ) {
            const hasAllMetadata = Object.entries(options.get.metadata).every(
              ([key, field]) => {
                if (!field) return true; // Skip undefined fields
                if (!prod.metaData || !prod.metaData[key]) return false;
                // For now, just check if the key exists. In the future, we could check values too
                return true;
              }
            );
            if (!hasAllMetadata) {
              return false;
            }
          }
          // Filter by price range
          if (options.get.minPrice) {
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
          if (options.get.maxPrice) {
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
  const [showShadow, setShowShadow] = useState(false);
  // Position and height calculation for FastList
  const position = getPosition("searching");
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return (tabsPosition?.top || 0) - posHeight - posTop;
  }, [position, tabsPosition?.top]);
  const colorMerge = useColorMerge();
  // Helper: check if any product is selected
  // Stable toggle function for tools
  const toggleTools = useCallback(() => {
    showTools.set(!showTools.get);
  }, [showTools]);
  const startSelectionMode = useCallback(() => {
    isSelectionMode.set(true);
    showTools.set(false);
    // Initialize selectedProducts if null
    if (!selectedProducts.get) {
      selectedProducts.set([]);
    }
  }, [isSelectionMode, showTools, selectedProducts]);
  // Reset scroll when search changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem?.(0);
    }
  }, [search]);
  // Memoize the item data to prevent unnecessary re-renders
  const listItemData = useMemo(() => {
    // During loading or when no filters are active, use products directly to avoid delay
    if (loading || cacheLoading || (!search && !options.get)) {
      return products || [];
    }
    return filterProducts || [];
  }, [filterProducts, products, loading, cacheLoading, search, options.get]);
  const { isMobile, isDesktop, isTablet } = useDeviceResolution();
  const columns = useMemo(() => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    if (isDesktop) return 4;
    return 2; // fallback
  }, [isMobile, isTablet, isDesktop]);
  // Memoize the item count to prevent recalculation
  const itemCount = useMemo(() => {
    return Math.ceil((listItemData?.length || 0 + 1) / columns);
  }, [listItemData?.length, columns]);
  // Memoized render item function
  const RenderItem = useCallback(
    ({
      index,
      style,
      data,
    }: {
      index: number;
      style: React.CSSProperties;
      data: (Biqpod.Snapbuy.Product | number)[];
    }) => {
      const itsNumber = data.some((item) => typeof item === "number");
      if (itsNumber) {
        // Loading placeholder card
        return (
          <div style={style} className="flex items-center gap-2 p-2">
            {Array.from({ length: columns }, (_, colIndex) => (
              <motion.div
                key={`loading-${index}-${colIndex}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-1 w-full h-[300px]"
              >
                <CardWait className="flex flex-col justify-between rounded-2xl w-full h-full overflow-hidden">
                  {/* Image placeholder */}
                  <div className="relative flex justify-center items-center p-3 w-full h-[200px] overflow-hidden">
                    <CardWait className="rounded-xl w-full h-full" />
                  </div>
                  <Line />
                  {/* Title placeholder */}
                  <div className="p-2 max-md:p-1">
                    <CardWait className="rounded-xl w-3/4 h-6" />
                  </div>
                  <Line />
                  {/* Price placeholder */}
                  <div className="flex justify-between items-center px-2 max-md:py-1 md:py-2">
                    <div className="flex flex-col gap-2">
                      <CardWait className="rounded-2xl w-16 h-6" />
                      <CardWait className="rounded-2xl w-16 h-6" />
                    </div>
                    <CardWait className="rounded-full w-8 h-8" />
                  </div>
                </CardWait>
              </motion.div>
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
    [columns, isSelectionMode.get]
  );
  // Memoized main content section to prevent unnecessary re-renders
  const MainContent = useMemo(() => {
    const data =
      loading || cacheLoading
        ? [...listItemData, ...range(0, columns * 8)]
        : listItemData;
    if (data.length > 0) {
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
            itemData={data}
            onScroll={(e) => {
              setShowShadow(e.scrollOffset > 10);
            }}
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
    showShadow,
    colorMerge,
    listHeight,
    itemCount,
    listItemData,
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
                  <AdminFilterProducts
                    value={options.get}
                    onChange={options.set}
                  />
                );
              }}
            />
          </motion.div>
        </motion.div>
        <Line />
      </PositionView>
      {isSelectionMode.get && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="flex justify-between items-center gap-2 bg-[--biqpod-primary] p-2 text-[--biqpod-primary-content]"
        >
          <div className="flex items-center gap-2">
            <CircleTip
              icon={allIcons.solid.faXmark}
              onClick={() => {
                isSelectionMode.set(false);
                selectedProducts.set([]);
              }}
              className="text-[--biqpod-primary-content]"
            />
            <span>{selectedProducts.get?.length || 0} selected</span>
          </div>
          {selectedProducts.get && selectedProducts.get.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const allFilteredIds =
                    filterProducts
                      ?.map((p) => p.id)
                      .filter((id): id is string => id !== undefined) || [];
                  selectedProducts.set(allFilteredIds);
                  showToast(
                    `Selected all ${allFilteredIds.length} filtered products`
                  );
                }}
                className="bg-[--biqpod-primary-content] hover:bg-[--biqpod-primary-content] w-fit text-[--biqpod-primary]"
              >
                <Icon
                  icon={allIcons.solid.faCheckSquare}
                  iconClassName="mr-2"
                />
                Select All Filtered ({filterProducts?.length || 0})
              </Button>
              <Button
                onClick={({ clientX, clientY }) => {
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu: [
                      {
                        label: "Delete All",
                        defaultIcon: allIcons.solid.faTrash,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Delete Products",
                            message: `Are you sure you want to delete ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                            detail: "This action cannot be undone.",
                          });
                          if (response) {
                            execAction("bulk-delete-products");
                          }
                        },
                      },
                      {
                        label: "Disable",
                        defaultIcon: allIcons.solid.faEyeSlash,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Disable Products",
                            message: `Are you sure you want to disable ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                          });
                          if (response) {
                            execAction("bulk-toggle-availability", false);
                          }
                        },
                      },
                      {
                        label: "Enable",
                        defaultIcon: allIcons.solid.faEye,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Enable Products",
                            message: `Are you sure you want to enable ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                          });
                          if (response) {
                            execAction("bulk-toggle-availability", true);
                          }
                        },
                      },
                      {
                        label: "Add Metadata",
                        defaultIcon: allIcons.solid.faTags,
                        click: () => {
                          showPopup(
                            <AddMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Metadata added successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Remove Metadata",
                        defaultIcon: allIcons.solid.faTrash,
                        click: () => {
                          showPopup(
                            <RemoveMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Metadata removed successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Remove All Metadata",
                        defaultIcon: allIcons.solid.faTrashAlt,
                        click: () => {
                          showPopup(
                            <RemoveAllMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("All metadata removed successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Set Brand",
                        defaultIcon: allIcons.solid.faTag,
                        click: () => {
                          showPopup(
                            <SetBrandPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Brand set successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Merge Photos",
                        defaultIcon: allIcons.solid.faImages,
                        click: () => {
                          showPopup(
                            <MergePhotosPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Photos merged successfully!");
                              }}
                            />
                          );
                        },
                      },
                    ],
                  });
                }}
                disabled={bulkDeleteLoading || bulkToggleLoading}
                className="bg-[--biqpod-primary-content] hover:bg-[--biqpod-primary-content] disabled:opacity-50 w-fit text-[--biqpod-primary] disabled:cursor-not-allowed"
              >
                <Icon
                  icon={
                    bulkDeleteLoading || bulkToggleLoading
                      ? allIcons.solid.faCircleNotch
                      : allIcons.solid.faBolt
                  }
                  iconClassName={tw(
                    (bulkDeleteLoading || bulkToggleLoading) && "animate-spin",
                    "mr-2"
                  )}
                />
                {bulkDeleteLoading || bulkToggleLoading
                  ? "Processing..."
                  : `Actions (${selectedProducts.get?.length || 0})`}
              </Button>
            </div>
          )}
        </motion.div>
      )}
      {MainContent}
      {usedBy !== "read" && (
        <ToolsCard
          showTools={showTools.get}
          onToggleTools={toggleTools}
          onStartSelection={startSelectionMode}
        />
      )}
    </motion.div>
  );
};
const AddMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const tempMetadata = useCopyState<
    Record<string, Biqpod.Snapbuy.MetadataField | undefined>
  >({});
  const metadataFields = useMemo(() => {
    return Object.values(tempMetadata.get || {})
      .map((field) => field!)
      .filter(Boolean);
  }, [tempMetadata.get]);
  // Convert array-based approach to object-based for MetadataFieldComponent
  const action = useAction(
    "add-metadata",
    async () => {
      if (metadataFields.length === 0) {
        showToast("Please add a metadata field first", "error");
        return;
      }
      // Update each selected product with all metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            let updatedMetaData = { ...product.metaData, ...tempMetadata.get };
            // Add or update each metadata field
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: updatedMetaData,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const fieldNames = metadataFields.map((f) => f.key).join(", ");
      showToast(
        `Metadata fields "${fieldNames}" added to ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
      // Clear temp data
      tempMetadata.set({});
    },
    [selectedProducts, storeId, tempMetadata.get]
  );
  const loading = isLoading(action);
  useEffect(() => {
    return () => {
      tempMetadata.set({});
    };
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="add metadata to products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="bg-[--biqpod-gray-opacity] mx-2 mt-2 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Selected Products:</strong> {selectedProducts.length}
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <MetadataFieldComponent
            metadata={tempMetadata.get || undefined}
            onChangeMetadata={(metadata) => {
              tempMetadata.set(metadata);
              console.log(metadata);
            }}
            showAddSection={true}
            showFieldActions={true}
          />
        </div>
        <div className="bg-yellow-600/20 mx-2 p-3 rounded-lg">
          <p className="text-yellow-600 text-sm">
            <strong>Note:</strong> This will add the selected metadata fields to
            all selected products. If a product already has any of these
            metadata keys, they will be overwritten.
          </p>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
            tempMetadata.set({});
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            if (metadataFields.length === 0) {
              showToast("Please add a metadata field first", "error");
              return;
            }
            const fieldNames = metadataFields.map((f) => f!.key).join(", ");
            const response = await confirm({
              title: "Add Metadata",
              message: `Are you sure you want to add metadata fields "${fieldNames}" to ${selectedProducts.length} products?`,
            });
            if (response) {
              execAction("add-metadata");
            }
          }}
          disabled={loading || metadataFields.length === 0}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="add metadata" />
        </Button>
      </div>
    </Card>
  );
};
const RemoveMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const metadataKeys = useCopyState<string[] | Nothing>([]);
  const action = useAction(
    "remove-metadata",
    async () => {
      const metadataKeysList = metadataKeys.get || [];
      if (metadataKeysList.length === 0) {
        showToast("Please enter metadata keys to remove", "error");
        return;
      }
      // Update each selected product by removing the specified metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product && product.metaData) {
            var meta = { ...product.metaData };
            metadataKeysList.forEach((key) => {
              const { [key]: _, ...rest } = meta;
              meta = rest;
            });
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: meta,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const keysString = metadataKeysList.join(", ");
      showToast(
        `Metadata fields "${keysString}" removed from ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
      // Clear the field
      metadataKeys.set([]);
    },
    [selectedProducts, storeId, metadataKeys.get]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="remove metadata from products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col justify-between gap-4 p-4 h-full">
        <div className="flex flex-col gap-2">
          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
            <p className="text-sm">
              <strong>Selected Products:</strong> {selectedProducts.length}
            </p>
          </div>
          <Card>
            <h3 className="p-2 font-semibold text-lg capitalize">
              <Translate content="metadata keys to remove" />
            </h3>
            <Line />
            <div className="flex flex-col gap-2 p-2">
              <ArrayField id="metadata-keys" state={metadataKeys} />
            </div>
          </Card>
        </div>
        <div className="bg-red-600/20 p-3 rounded-lg">
          <p className="text-red-600 text-sm">
            <strong>Warning:</strong> This will permanently remove the specified
            metadata fields from all selected products. This action cannot be
            undone.
          </p>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
            metadataKeys.set([]);
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            const metadataKeysList = metadataKeys.get || [];
            if (metadataKeysList.length === 0) {
              showToast("Please enter metadata keys to remove", "error");
              return;
            }
            const keysString = metadataKeysList.join(", ");
            const response = await confirm({
              title: "Remove Metadata",
              message: `Are you sure you want to remove metadata fields "${keysString}" from ${selectedProducts.length} products?`,
              detail: "This action cannot be undone.",
              type: "warning",
            });
            if (response) {
              execAction("remove-metadata");
            }
          }}
          disabled={loading || (metadataKeys.get || []).length === 0}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faTrash
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="remove metadata" />
        </Button>
      </div>
    </Card>
  );
};
const RemoveAllMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const action = useAction(
    "remove-all-metadata",
    async () => {
      // Update each selected product by removing all metadata
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: {},
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      showToast(
        `All metadata removed from ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
    },
    [selectedProducts, storeId]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="remove all metadata from products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col justify-between gap-4 p-4 h-full">
        <div className="flex flex-col gap-2">
          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
            <p className="text-sm">
              <strong>Selected Products:</strong> {selectedProducts.length}
            </p>
          </div>
        </div>
        <div className="bg-red-600/20 p-3 rounded-lg">
          <p className="text-red-600 text-sm">
            <strong>Warning:</strong> This will permanently remove ALL metadata
            fields from all selected products. This action cannot be undone.
          </p>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            const response = await confirm({
              title: "Remove All Metadata",
              message: `Are you sure you want to remove ALL metadata from ${selectedProducts.length} products?`,
              detail: "This action cannot be undone.",
              type: "warning",
            });
            if (response) {
              execAction("remove-all-metadata");
            }
          }}
          disabled={loading}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faTrashAlt
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="remove all metadata" />
        </Button>
      </div>
    </Card>
  );
};
const SetBrandPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const [brands, setBrands] = useState<Biqpod.Snapbuy.Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const searchTerm = getFieldValue("set-brand-search");
  useEffect(() => {
    const fetchBrands = async () => {
      if (!storeId) return;
      setLoadingBrands(true);
      try {
        const fetchedBrands = await snapbuyApi.brands.getAll(storeId);
        setBrands(fetchedBrands || []);
      } catch (error) {
        console.error("Failed to load brands:", error);
        showToast("Failed to load brands", "error");
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [storeId]);
  const filteredBrands = useMemo(() => {
    if (!searchTerm?.trim()) return brands;
    const nameMatches = filterFuzzySearch(brands, searchTerm, "name");
    const descMatches = filterFuzzySearch(brands, searchTerm, "description");
    return [...new Set([...nameMatches, ...descMatches])];
  }, [brands, searchTerm]);
  const action = useAction(
    "set-brand",
    async () => {
      if (!selectedBrandId) {
        showToast("Please select a brand", "error");
        return;
      }
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              brandId: selectedBrandId,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const brandName =
        brands.find((b) => b.id === selectedBrandId)?.name || selectedBrandId;
      showToast(
        `Brand "${brandName}" set to ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
    },
    [selectedProducts, storeId, selectedBrandId, brands]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="set brand to products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="bg-[--biqpod-gray-opacity] mx-2 mt-2 p-3 rounded-lg">
          <p className="text-sm">
            <Translate content="select a brand to assign to the selected products" />
          </p>
        </div>
        <div className="mx-2">
          <Field
            inputName="set-brand-search"
            placeholder="Search brands..."
            className="rounded-xl"
          />
        </div>
        <Scroll className="flex-1 overflow-hidden">
          {loadingBrands ? (
            <div className="flex justify-center items-center py-8">
              <CircleLoading />
              <span className="ml-2">
                <Translate content="loading brands..." />
              </span>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <span className="text-gray-500">
                {searchTerm?.trim()
                  ? "No brands match your search"
                  : "No brands found"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className={tw(
                    "flex items-center gap-2 p-3 rounded-lg cursor-pointer border",
                    selectedBrandId === brand.id
                      ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] border-[--biqpod-primary]"
                      : "hover:bg-[--biqpod-gray-opacity] border-[--biqpod-borders]"
                  )}
                  onClick={() => setSelectedBrandId(brand.id!)}
                >
                  <input
                    type="radio"
                    checked={selectedBrandId === brand.id}
                    onChange={() => setSelectedBrandId(brand.id!)}
                    className="mr-2"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{brand.name}</span>
                    {brand.description && (
                      <span className="opacity-75 text-sm">
                        {brand.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Scroll>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            execAction("set-brand");
          }}
          disabled={loading || !selectedBrandId || loadingBrands}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="set brand" />
        </Button>
      </div>
    </Card>
  );
};
