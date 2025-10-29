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
import { useFormMetadata, setFormMetadata } from "../../../apis/getFns";
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
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
type MetadataField = Biqpod.Snapbuy.MetadataField;
interface RenderFieldProps {
  field: MetadataField;
}
const RenderField = ({ field }: RenderFieldProps) => {
  const metadataState = useFormMetadata();
  const metadata = metadataState?.get;
  const value = getMagicField("product-metadata-" + field.key);
  useEffect(() => {
    const metadataField = metadata?.[field.key];
    if (
      metadataField &&
      metadata &&
      JSON.stringify(value) !== JSON.stringify(metadataField?.value)
    ) {
      if (!value) {
        return;
      }
      setFormMetadata({
        ...metadata,
        [field.key]: metadataField,
      });
    }
  }, [value, metadata]);
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
  // For colors type, we'll use array type but with special handling
  const fieldType = field.type === "colors" ? "array" : field.type;
  return (
    <div className="flex justify-center items-centerq bg-[--biqpod-primary-background] p-2 border border-[--biqpod-borders] border-solid rounded-xl">
      <MagicField
        config={options as any}
        fieldId={"product-metadata-" + field.key}
        type={fieldType}
      />
    </div>
  );
};
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
interface EditTypePopupProps {
  field: MetadataField;
  onChangeField?: (field: MetadataField) => void;
}
const EditTypePopup = ({ field, onChangeField }: EditTypePopupProps) => {
  const state = useCopyState<string | Nothing>(undefined);
  const isDiff = field.type !== state.get;
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
                showToast(`type modifed from ${field.type} to ${state.get}`);
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

export const ProductMetadata = () => {
  const metadataState = useFormMetadata();
  const metadata = metadataState?.get;
  const metadataInArray = useMemo(() => {
    return Object.values(metadata || {}).map((s) => s!);
  }, [metadata]);
  // Use useCopyState for the field type selection with EnumField
  const fieldTypeState = useCopyState<string | false | 0 | null | undefined>(
    undefined
  );
  // Create field value state for the new field key input
  const inputFieldKey = getFieldValue("new-field-key");
  const addMetadataField = () => {
    // Get the field value from the form field using the hook
    if (!inputFieldKey?.trim()) return;
    const selectedFieldType = fieldTypeState.get as MetadataField["type"];
    if (!selectedFieldType) {
      showToast("Field type is required", "error");
      return;
    }
    const defaultValue = getDefaultValueForType(selectedFieldType);
    const newField: MetadataField = {
      type: selectedFieldType,
      value: defaultValue,
      key: inputFieldKey,
    };
    setFormMetadata({
      ...metadata,
      [inputFieldKey]: newField,
    });
    // Clear the fields
    setFieldValue("new-field-key", "");
    fieldTypeState.set(undefined);
  };
  const removeMetadataField = (key: string) => {
    const { [key]: _, ...rest } = metadata || {};
    setFormMetadata(rest);
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
        return "string";
      default:
        return "";
    }
  };
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Add new field section */}
      <div className="bg-[--biqpod-primary-background] p-2">
        <Card>
          <h3 className="p-2 font-semibold text-lg capitalize">
            <Translate content="add new field" />
          </h3>
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
      {/* Existing fields */}
      <div className="flex-1 overflow-y-auto">
        {!metadataInArray || metadataInArray.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-[--biqpod-gray-opacity]">
            <Icon
              icon={allIcons.solid.faBoxOpen}
              iconClassName="text-6xl mb-4"
            />
            <p className="text-lg capitalize">
              <Translate content="no metadata fields added" />
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {metadataInArray.map((field, index) => {
              const menu = [
                {
                  label: "Edit",
                  click() {
                    const popupId = showPopup(
                      <Card>
                        <div className="flex justify-between items-center gap-2 p-2">
                          <h1 className="text-2xl capitalize">
                            <Translate content="edit value" />
                          </h1>
                          <div>
                            <CircleTip
                              icon={allIcons.solid.faXmark}
                              onClick={() => {
                                closePopup(popupId);
                              }}
                            />
                          </div>
                        </div>
                        <Line />
                        <div className="p-2">
                          <RenderField field={field} />
                        </div>
                      </Card>
                    );
                  },
                  defaultIcon: allIcons.solid.faPen,
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
                  key={index}
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
                          showPopup(<EditTypePopup field={field} />, {
                            id: "edit-type",
                          });
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
                    <div className="max-md:hidden md:flex">
                      {menu.map((item, index) => {
                        return (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            key={index}
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
