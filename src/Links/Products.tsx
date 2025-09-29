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
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Key,
  Line,
  PositionView,
  Translate,
  MagicField,
  ArrayField,
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
  useFieldValue,
  confirm,
  openMenu,
  getTemp,
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
import { useUsedBy } from "../routes/Stores/Stores";
import { Nothing } from "@biqpod/app/ui/types";
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
const AddMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  // Use proper form field management like ProductMetadata
  const metadataKeyField = useFieldValue("add-metadata-key");
  const metadataType = useCopyState<string | false | 0 | null | undefined>(
    "string"
  );
  const fullMagicFields =
    getTemp<
      Partial<Record<string, Nothing | string | number | string[] | boolean>>
    >("magic-fields");
  // Create a temporary metadata field for form management
  const tempMetadata = useTemp<SnapBuy.MetadataField[]>(
    "temp-bulk-metadata-fields"
  );
  const addMetadataField = () => {
    const fieldKeyValue = metadataKeyField.get || "";
    if (!fieldKeyValue.trim()) {
      showToast("Field key is required", "error");
      return;
    }
    const selectedFieldType = metadataType.get as SnapBuy.MetadataField["type"];
    if (!selectedFieldType) {
      showToast("Field type is required", "error");
      return;
    }
    // Check if field key already exists in the list
    const existingFields = tempMetadata.get || [];
    if (existingFields.some((field) => field.key === fieldKeyValue.trim())) {
      showToast("Field key already exists in the list", "error");
      return;
    }
    const defaultValue = getDefaultValueForType(selectedFieldType);
    const newField: SnapBuy.MetadataField = {
      key: fieldKeyValue.trim(),
      type: selectedFieldType,
      value: defaultValue,
    };
    // Add to the list of fields
    const updatedFields = [...existingFields, newField];
    tempMetadata.set(updatedFields);
    // Clear the key field
    metadataKeyField.set("");
  };
  const removeMetadataField = (index: number) => {
    const existingFields = tempMetadata.get || [];
    const updatedFields = existingFields.filter((_, i) => i !== index);
    tempMetadata.set(updatedFields);
  };
  const getDefaultValueForType = (type: SnapBuy.MetadataField["type"]) => {
    switch (type) {
      case "number":
        return 0;
      case "boolean":
        return false;
      case "array":
        return [];
      case "colors":
        return [];
      case "string":
        return "";
      default:
        return "";
    }
  };
  const requiredFields = useMemo(() => {
    return tempMetadata.get?.map((field) => {
      return {
        ...field,
        value:
          fullMagicFields?.[`${field.type}-temp-bulk-metadata-${field.key}`] ||
          getDefaultValueForType(field.type),
      };
    });
  }, [tempMetadata.get, fullMagicFields]);
  const action = useAction(
    "add-metadata",
    async () => {
      const metadataFields = requiredFields || [];
      if (metadataFields.length === 0) {
        showToast("Please add a metadata field first", "error");
        return;
      }
      console.log({ metadataFields });
      // Update each selected product with all metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.getProduct(productId);
          if (product) {
            let updatedMetaData = [...(product.metaData || [])];
            // Add or update each metadata field
            metadataFields.forEach((field) => {
              const existingFieldIndex = updatedMetaData.findIndex(
                (f) => f.key === field.key
              );
              if (existingFieldIndex >= 0) {
                // Update existing field
                updatedMetaData[existingFieldIndex] = field;
              } else {
                // Add new field
                updatedMetaData.push(field);
              }
            });
            const updatedProduct: Partial<SnapBuy.Product> = {
              id: productId,
              metaData: updatedMetaData,
            };
            await snapbuyApi.upsertProducts(storeId!, [updatedProduct]);
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
      // Clear temp data
      tempMetadata.set([]);
    },
    [selectedProducts, storeId, tempMetadata]
  );
  const loading = isLoading(action);
  const metadataFields = tempMetadata.get || [];
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
      <div className="flex flex-col justify-between gap-4 p-4 h-full">
        <div className="flex flex-col gap-2">
          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
            <p className="text-sm">
              <strong>Selected Products:</strong> {selectedProducts.length}
            </p>
          </div>
          {/* Add new field section - same as ProductMetadata */}
          <Card>
            <h3 className="p-2 font-semibold text-lg capitalize">
              <Translate content="add metadata field" />
            </h3>
            <Line />
            <div className="flex flex-col gap-2 p-2">
              <Field
                inputName="add-metadata-key"
                className="rounded-2xl"
                placeholder="Enter field name"
              />
              <EnumField
                state={metadataType}
                config={{
                  list: [
                    {
                      value: "string",
                      content: "Text",
                    },
                    {
                      value: "number",
                      content: "Number",
                    },
                    {
                      value: "boolean",
                      content: "Boolean",
                    },
                    {
                      value: "array",
                      content: "Text Array",
                    },
                    {
                      value: "colors",
                      content: "Colors",
                    },
                  ],
                }}
                id="add-metadata-field-type-selector"
              />
            </div>
            <Line />
            <div className="p-2">
              <Button
                onClick={addMetadataField}
                disabled={!(metadataKeyField.get || "")?.trim()}
                className="disabled:opacity-50 p-2 rounded-full w-full disabled:cursor-not-allowed"
                icon={allIcons.solid.faPlus}
              >
                <Translate content="add field" />
              </Button>
            </div>
          </Card>
          {/* Field preview - same as ProductMetadata */}
          {metadataFields.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="mb-2 font-semibold text-lg">
                Metadata Fields to Add ({metadataFields.length}):
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {metadataFields.map((field, index) => {
                  const options: any =
                    field.type === "string"
                      ? { hint: "Enter text", autoChange: true }
                      : field.type === "number"
                      ? { placeholder: "Enter a number", autoChange: true }
                      : field.type === "colors"
                      ? {
                          placeholder: "Enter colors (comma separated)",
                          hint: "e.g. red, blue, green, #ff0000, rgb(255,0,0)",
                          separator: ",",
                        }
                      : {};
                  return (
                    <div
                      key={index}
                      className="bg-[--biqpod-primary-background] border border-[--biqpod-borders] border-solid rounded-xl"
                    >
                      <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{field.key}</span>
                          <Key className="inline-flex items-center gap-1">
                            <Icon
                              icon={
                                field.type === "number"
                                  ? allIcons.solid.faHashtag
                                  : field.type === "boolean"
                                  ? allIcons.solid.faToggleOn
                                  : field.type === "array"
                                  ? allIcons.solid.faList
                                  : field.type === "colors"
                                  ? allIcons.solid.faPalette
                                  : allIcons.solid.faTextHeight
                              }
                            />
                            <Translate content={field.type} />
                          </Key>
                        </div>
                        <CircleTip
                          icon={allIcons.solid.faTrash}
                          onClick={() => removeMetadataField(index)}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>
                      <Line />
                      <div className="p-3">
                        {field.type === "colors" ? (
                          <div className="space-y-2">
                            <p className="text-[--biqpod-gray-opacity-2] text-sm">
                              Add colors using the color picker, predefined
                              colors, or type color names/hex codes
                            </p>
                            <div className="flex flex-wrap gap-2 bg-[--biqpod-field-background] p-3 border border-[--biqpod-borders] border-solid rounded-lg min-h-[50px]">
                              <span className="self-center text-[--biqpod-gray-opacity] text-sm">
                                Select colors using the color picker below
                              </span>
                            </div>
                          </div>
                        ) : (
                          <MagicField
                            config={options}
                            fieldId={`${field.type}-temp-bulk-metadata-${field.key}`}
                            type={field.type}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}{" "}
        </div>
        <div className="bg-yellow-600/20 p-3 rounded-lg">
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
            tempMetadata.set([]);
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
            const fieldNames = metadataFields.map((f) => f.key).join(", ");
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
      console.log({ metadataKeysList });
      // Update each selected product by removing the specified metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.getProduct(productId);
          if (product && product.metaData) {
            let updatedMetaData = product.metaData.filter(
              (field) => !metadataKeysList.includes(field.key)
            );
            const updatedProduct: Partial<SnapBuy.Product> = {
              id: productId,
              metaData: updatedMetaData,
            };
            await snapbuyApi.upsertProducts(storeId!, [updatedProduct]);
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
                {usedBy !== "read" && (
                  <EmptyComponent>
                    {!isSelectionMode && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <CircleTip
                          icon={allIcons.solid.faListCheck}
                          className="text-orange-600"
                          onClick={() => {
                            onStartSelection();
                          }}
                        />
                      </motion.div>
                    )}
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
                  </EmptyComponent>
                )}
                {usedBy !== "read" && (
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
                )}
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
const PAGE_SIZE = 30;
const sortBy: keyof SnapBuy.Product = "name";
export const Products = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const {
    products,
    lastDoc,
    isLoading: cacheLoading,
    updateProducts,
    addProducts,
  } = useIndexedDBProducts(storeId);
  const hasMore = useCopyState(true);
  const tabsPosition = getPosition("products-and-brands");
  const action = useAction(
    "fetch-products",
    async (next = false) => {
      if (!storeId) {
        return;
      }
      await delay(200);
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(
            where("storeId", "==", storeId) // Assuming storeId is the same as uid
          ),
          orders: mergeArray(orderBy(sortBy, "asc")),
          limit: PAGE_SIZE,
          startAt: next && lastDoc?.[sortBy] && mergeArray(lastDoc?.[sortBy]),
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
    }
  }, [cacheLoading, products.length, lastDoc]);
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
            await snapbuyApi.deleteProduct(productId);
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
            const product = await snapbuyApi.getProduct(productId);
            if (product) {
              const updatedProduct: Partial<SnapBuy.Product> = {
                id: productId,
                available: enable,
              };
              await snapbuyApi.upsertProducts(storeId!, [updatedProduct]);
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
    return filterProducts || [];
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
      const threshold = 200; // Increased threshold to fetch when there's just a little scrolling left
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
