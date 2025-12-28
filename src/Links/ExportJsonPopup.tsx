import { allIcons } from "@biqpod/app/ui/apis";
import {
  Translate,
  Card,
  CircleTip,
  Line,
  CircleLoading,
  EmptyComponent,
  Button,
} from "@biqpod/app/ui/components";
import {
  showToast,
  useAction,
  closePopup,
  isLoading,
  execAction,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { saveAs } from "file-saver";
import { useState, useCallback, useEffect } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";

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
              className={tw(loading && "animate-spin")}
            >
              <Translate content="export all data to json" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
