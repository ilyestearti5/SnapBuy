import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Key,
  Line,
  MagicField,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { useEffect, useMemo } from "react";
import {
  showToast,
  useCopyState,
  showPopup,
  closePopup,
  getMagicField,
  getFieldValue,
  setFieldValue,
  openMenu,
  setMagicField,
  useAsyncMemo,
  useColorMerge,
  handelShadowColor,
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { tw, filterFuzzySearch } from "@biqpod/app/ui/utils";
import { FixedSizeList as List } from "react-window";
import { useStoreId } from "../utils";
import { snapbuyApi } from "../apis";
type MetadataField = Biqpod.Snapbuy.MetadataField;
interface MetadataFieldProps {
  metadata: Record<string, MetadataField | undefined> | undefined;
  onChangeMetadata: (
    metadata: Record<string, MetadataField | undefined>
  ) => void;
  showAddSection?: boolean;
  showFieldActions?: boolean;
  className?: string;
}
const types = [
  {
    value: "string",
    content: "🪈 Text",
  },
  {
    value: "number",
    content: "🔢 Number",
  },
  {
    value: "boolean",
    content: "✅ Boolean",
  },
  {
    value: "array",
    content: "📚 Text Array",
  },
  {
    value: "colors",
    content: "🔵 Colors",
  },
];
interface RenderFieldProps {
  field: MetadataField;
  fieldIdPrefix: string;
}
const RenderField = ({ field, fieldIdPrefix }: RenderFieldProps) => {
  useEffect(() => {
    setMagicField(`${fieldIdPrefix}-${field.key}`, field.value);
  }, []);
  const options =
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
    <div className="flex justify-center items-center bg-[--biqpod-primary-background] p-2 border border-[--biqpod-borders] border-solid rounded-xl">
      <MagicField
        config={options as any}
        fieldId={`${fieldIdPrefix}-${field.key}`}
        type={field.type}
      />
    </div>
  );
};
interface EditTypePopupProps {
  field: MetadataField;
  onChangeField?: (field: MetadataField) => void;
}
const EditTypePopup = ({ field, onChangeField }: EditTypePopupProps) => {
  const state = useCopyState<string | Nothing>(field.type);
  const isDiff = useMemo(() => {
    return state.get !== field.type;
  }, [state.get, field.type]);
  return (
    <Card className="min-w-[300px]">
      <div className="flex justify-between items-center gap-2 p-2">
        <h1 className="text-2xl capitalize">
          <Translate content="edit type" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup("edit-type");
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-3">
        <EnumField
          config={{
            list: types,
          }}
          state={state}
        />
      </div>
      {isDiff && state.get && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              onClick={() => {
                onChangeField?.({
                  ...field,
                  type: state.get! as MetadataField["type"],
                });
                showToast(`Type modified from ${field.type} to ${state.get}`);
                closePopup("edit-type");
              }}
              className="rounded-2xl"
              icon={allIcons.solid.faRefresh}
            >
              <Translate content="modify" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
interface EditValuePopupProps {
  field: MetadataField;
  onChangeField?: (field: MetadataField) => void;
}
const tempFieldId = `temp-edit`;
const EditValuePopup = ({ field, onChangeField }: EditValuePopupProps) => {
  useEffect(() => {
    setMagicField(`${tempFieldId}-${field.key}`, field.value);
  }, [field.key]);
  const currentValue = getMagicField(`${tempFieldId}-${field.key}`);
  const isChanged = useMemo(() => {
    return JSON.stringify(currentValue) !== JSON.stringify(field.value);
  }, [currentValue, field.value]);
  return (
    <Card>
      <div className="flex justify-between items-center gap-2 p-2">
        <h1 className="text-2xl capitalize">
          <Translate content="edit value" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup("edit-value");
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <RenderField field={field} fieldIdPrefix={tempFieldId} />
      </div>
      {isChanged && (
        <EmptyComponent>
          <Line />
          <div className="flex gap-2 p-2">
            <Button
              onClick={() => {
                setMagicField(`${tempFieldId}-${field.key}`, field.value);
              }}
              className="bg-[--biqpod-gray-opacity-2] rounded-2xl text-[--biqpod-text-color]"
            >
              <Translate content="reset" />
            </Button>
            <Button
              onClick={() => {
                onChangeField?.({
                  ...field,
                  value: currentValue,
                });
                closePopup("edit-value");
              }}
              className="rounded-2xl"
            >
              <Translate content="confirm" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
interface SelectProductPopupProps {
  onSelectProduct: (product: Biqpod.Snapbuy.Product) => void;
}
const SelectProductPopup = ({ onSelectProduct }: SelectProductPopupProps) => {
  const storeId = useStoreId();
  const products = useAsyncMemo<
    Biqpod.Snapbuy.Product[] | undefined
  >(async () => {
    if (!storeId) return [];
    return await snapbuyApi.product.getProductsOf(storeId);
  }, [storeId]);
  const selectedProduct = useCopyState<Biqpod.Snapbuy.Product | null>(null);
  const selectedMetadataInArray = useMemo(() => {
    if (!selectedProduct.get?.metaData) return [];
    return Object.values(
      selectedProduct.get.metaData as Record<string, MetadataField>
    )
      .map((s) => s!)
      .filter(Boolean);
  }, [selectedProduct.get]);
  const searchValue = getFieldValue("search-products-in-metadata");
  const filteredProducts = useMemo(() => {
    return filterFuzzySearch(products || [], searchValue || "", "name");
  }, [products, searchValue]);
  const showRightSide = useCopyState(false);
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const product = filteredProducts[index];
    return (
      <div style={style}>
        <div
          className={tw(
            "flex items-center gap-2 p-2 rounded-xl cursor-pointer",
            selectedProduct.get?.id === product.id
              ? "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
              : "hover:bg-[--biqpod-primary-background]"
          )}
          onClick={() => {
            selectedProduct.set(product);
          }}
        >
          {product.photos?.[0] && (
            <img
              src={product.photos[0]}
              alt={product.name}
              className="rounded w-6 h-6 object-cover"
            />
          )}
          <div className="flex-1 font-medium text-sm truncate">
            {product.name}
          </div>
        </div>
      </div>
    );
  };
  useEffect(() => {
    if (selectedProduct.get) {
      showRightSide.set(true);
    }
  }, [selectedProduct.get]);
  const colorMerge = useColorMerge();
  return (
    <Card className="w-[800px] max-h-[80vh] overflow-hidden">
      <div className="z-[10] flex justify-between items-center gap-2 bg-[--biqpod-primary-background] p-2">
        <h1 className="text-2xl capitalize">
          <Translate content="select product" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup("select-product");
            }}
          />
        </div>
      </div>
      <Line />
      <div className="relative flex h-[60vh]">
        {/* Right side: Product list */}
        <div
          className="w-full"
          onClick={() => {
            showRightSide.set(false);
          }}
        >
          <div className="p-2">
            <Field
              inputName="search-products-in-metadata"
              placeholder="Search products"
              className="rounded-xl"
            />
          </div>
          <Line />
          <List
            height={400}
            width="100%"
            itemCount={filteredProducts.length}
            itemSize={50}
          >
            {Row}
          </List>
        </div>
        {/* Left side: Metadata fields */}
        <div
          className={tw(
            "absolute bg-[--biqpod-primary-background] border-[--biqpod-borders] border-l border-solid w-2/3 h-full transition-[right]",
            showRightSide.get ? "right-0" : "-right-full"
          )}
          style={{
            ...colorMerge({
              boxShadow: handelShadowColor([
                {
                  colorId: "shadow.color",
                  blur: 10,
                  size: 20,
                  x: -20,
                  y: 0,
                },
              ]),
            }),
          }}
        >
          {selectedProduct.get ? (
            <div className="h-full overflow-y-auto">
              <div className="flex justify-between items-center gap-2 p-3">
                <h3 className="font-semibold capitalize">
                  <Translate content="metadata fields" />
                </h3>
                <CircleTip
                  icon={allIcons.solid.faChevronRight}
                  onClick={() => {
                    showRightSide.set(false);
                  }}
                />
              </div>
              <Line />
              <div className="p-2">
                {selectedMetadataInArray.length > 0 ? (
                  selectedMetadataInArray.map((field) => (
                    <div
                      key={field.key}
                      className="flex flex-col gap-1 bg-[--biqpod-primary-background] mb-2 p-2 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{field.key}</span>
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
                          className="text-sm"
                        />
                        <span className="text-[--biqpod-gray-opacity-2] text-sm capitalize">
                          {field.type}
                        </span>
                      </div>
                      <div className="text-sm">
                        {field.type === "boolean" ? (
                          field.value ? (
                            "True"
                          ) : (
                            "False"
                          )
                        ) : field.type === "array" ? (
                          Array.isArray(field.value) ? (
                            field.value.join(", ")
                          ) : (
                            String(field.value)
                          )
                        ) : field.type === "colors" ? (
                          Array.isArray(field.value) ? (
                            <div className="flex flex-wrap gap-1">
                              {field.value.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="border border-[--biqpod-borders] border-solid rounded-full w-4 h-4"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          ) : (
                            String(field.value)
                          )
                        ) : (
                          String(field.value)
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[--biqpod-gray-opacity-2] text-center">
                    <Translate content="no metadata fields" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center p-2 h-full text-[--biqpod-gray-opacity]">
              <Translate content="select a product to view metadata" />
            </div>
          )}
        </div>
      </div>
      <Line />
      <div className="z-[10] flex justify-end bg-[--biqpod-primary-background] p-2">
        <Button
          onClick={() => {
            if (selectedProduct.get) {
              onSelectProduct(selectedProduct.get);
              closePopup("select-product");
            }
          }}
          disabled={!selectedProduct.get}
          className="rounded-2xl"
          icon={allIcons.solid.faCheck}
        >
          <Translate content="import metadata" />
        </Button>
      </div>
    </Card>
  );
};
const getDefaultValueForType = (type: MetadataField["type"]) => {
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
export const MetadataFieldComponent = ({
  metadata,
  onChangeMetadata,
  showAddSection = true,
  showFieldActions = true,
  className,
}: MetadataFieldProps) => {
  const metadataInArray = useMemo(() => {
    return Object.values(metadata || {})
      .map((s) => s!)
      .filter(Boolean);
  }, [metadata]);
  const fieldTypeState = useCopyState<string | false | 0 | null | undefined>(
    undefined
  );
  const inputFieldKey = getFieldValue("new-field-key");
  const addMetadataField = () => {
    if (!inputFieldKey?.trim()) {
      showToast("Field key is required", "error");
      return;
    }
    const selectedFieldType = fieldTypeState.get as MetadataField["type"];
    if (!selectedFieldType) {
      showToast("Field type is required", "error");
      return;
    }
    // Check if field key already exists
    if (metadata?.[inputFieldKey.trim()]) {
      showToast("Field key already exists", "error");
      return;
    }
    const defaultValue = getDefaultValueForType(selectedFieldType);
    const newField: MetadataField = {
      type: selectedFieldType,
      value: defaultValue,
      key: inputFieldKey.trim(),
    };
    onChangeMetadata({
      ...metadata,
      [inputFieldKey.trim()]: newField,
    });
    // Clear the fields
    setFieldValue("new-field-key", "");
    fieldTypeState.set(undefined);
    showToast("Field added successfully", "success");
  };
  const removeMetadataField = (key: string) => {
    const { [key]: _, ...rest } = metadata || {};
    onChangeMetadata(rest);
    showToast("Field removed successfully", "success");
  };
  const updateMetadataField = (key: string, updatedField: MetadataField) => {
    onChangeMetadata({
      ...metadata,
      [key]: updatedField,
    });
  };
  return (
    <div className={tw("flex flex-col h-full overflow-hidden", className)}>
      {/* Add new field section */}
      {showAddSection && (
        <EmptyComponent>
          <div className="bg-[--biqpod-primary-background] p-2">
            <Card>
              <div className="flex justify-between items-center p-2">
                <h3 className="font-semibold text-lg capitalize">
                  <Translate content="add new field" />
                </h3>
                <CircleTip
                  icon={allIcons.solid.faInfoCircle}
                  onClick={() => {
                    showPopup(
                      <SelectProductPopup
                        onSelectProduct={(product) => {
                          if (product.metaData) {
                            const newMetadata = { ...metadata };
                            Object.entries(
                              product.metaData as Record<string, MetadataField>
                            ).forEach(([key, field]) => {
                              if (field) {
                                newMetadata[key] = field;
                              }
                            });
                            onChangeMetadata(newMetadata);
                            showToast(
                              "Metadata imported from product",
                              "success"
                            );
                          } else {
                            showToast(
                              "Selected product has no metadata",
                              "info"
                            );
                          }
                        }}
                      />,
                      {
                        id: "select-product",
                      }
                    );
                  }}
                />
              </div>
              <Line />
              <div className="flex flex-col gap-2 p-2">
                <Field
                  inputName="new-field-key"
                  className="rounded-2xl"
                  placeholder="Enter field name"
                />
                <EnumField
                  state={fieldTypeState}
                  config={{
                    list: types,
                  }}
                  id="metadata-field-type-selector"
                />
              </div>
              <Line />
              <div className="p-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    onClick={addMetadataField}
                    disabled={!fieldTypeState.get || !inputFieldKey?.trim()}
                    className="disabled:opacity-50 p-2 rounded-full w-full disabled:cursor-not-allowed"
                    icon={allIcons.solid.faPlus}
                  >
                    <Translate content="add field" />
                  </Button>
                </motion.div>
              </div>
            </Card>
          </div>
          <Line />
        </EmptyComponent>
      )}
      {/* Existing fields */}
      <div className="flex-1 overflow-y-auto">
        {!metadataInArray || metadataInArray.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-[--biqpod-gray-opacity]">
            <Icon icon={allIcons.solid.faBoxOpen} className="mb-4 text-6xl" />
            <p className="text-lg capitalize">
              <Translate content="no metadata fields added" />
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {metadataInArray.map((field) => {
              const menu = [
                {
                  label: "Edit",
                  click() {
                    showPopup(
                      <EditValuePopup
                        field={field}
                        onChangeField={(updatedField) => {
                          updateMetadataField(field.key, updatedField);
                        }}
                      />,
                      {
                        id: "edit-value",
                      }
                    );
                  },
                  defaultIcon: allIcons.solid.faPen,
                },
                {
                  label: "Edit Type",
                  click() {
                    showPopup(
                      <EditTypePopup
                        field={field}
                        onChangeField={(updatedField) => {
                          updateMetadataField(field.key, updatedField);
                        }}
                      />,
                      {
                        id: "edit-type",
                      }
                    );
                  },
                  defaultIcon: allIcons.solid.faEdit,
                },
                {
                  label: "Remove",
                  click() {
                    removeMetadataField(field.key);
                  },
                  defaultIcon: allIcons.solid.faTrash,
                },
              ];
              return (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={tw(
                    "flex flex-col gap-2 odd:bg-[--biqpod-primary-background] px-4 py-2 border-[--biqpod-borders] border-b last:border-b-0 border-solid"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-semibold">{field.key}</span>
                      <Key
                        onClick={() => {
                          showPopup(
                            <EditTypePopup
                              field={field}
                              onChangeField={(updatedField) => {
                                updateMetadataField(field.key, updatedField);
                              }}
                            />,
                            {
                              id: "edit-type",
                            }
                          );
                        }}
                        className="inline-flex items-center gap-1 hover:bg-[--biqpod-gray-opacity-2] cursor-pointer"
                      >
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
                    {showFieldActions && (
                      <>
                        <div className="max-md:hidden md:flex">
                          {menu.map((item, menuIndex) => {
                            return (
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                key={menuIndex}
                              >
                                <CircleTip
                                  icon={item.defaultIcon}
                                  onClick={() => {
                                    item.click?.();
                                  }}
                                />
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="md:hidden max-md:flex">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <CircleTip
                              onClick={({ clientX, clientY }) => {
                                openMenu({
                                  x: clientX,
                                  y: clientY,
                                  menu,
                                });
                              }}
                              icon={allIcons.solid.faEllipsisV}
                            />
                          </motion.div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
export default MetadataFieldComponent;
