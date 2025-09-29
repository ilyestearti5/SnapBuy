import {
  Button,
  Card,
  CircleTip,
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
import { useEffect, useState } from "react";
import {
  getTemp,
  showToast,
  useFieldValue,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { ColorField } from "./ColorField";
import { motion, AnimatePresence } from "framer-motion";
import { Nothing } from "@biqpod/app/ui/types";
type MetadataField = SnapBuy.MetadataField;
interface RenderFieldProps {
  field: MetadataField;
}
const RenderField = ({ field }: RenderFieldProps) => {
  const metadataState = useFormMetadata();
  const metadata = metadataState?.get;
  // For now, just render the value as text to avoid hooks in loops
  // This will be improved later once the basic structure works
  const value = getTemp<string | number | boolean | string[] | Nothing>(
    ["magic-fields", "product-metadata-" + field.key].join(".")
  );
  useEffect(() => {
    const metadataField = metadata?.find((f) => f.key === field.key);
    if (
      metadataField &&
      metadata &&
      JSON.stringify(value) !== JSON.stringify(metadataField?.value)
    ) {
      if (!value) {
        return;
      }
      const prev = metadata;
      const index = prev.findIndex((f) => f.key === field.key);
      var result: MetadataField[] = [];
      if (index !== -1) {
        const updatedField = { ...prev[index], value };
        result = [
          ...prev.slice(0, index),
          updatedField,
          ...prev.slice(index + 1),
        ];
      } else {
        result = prev;
      }
      setFormMetadata(result);
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
    <div className="bg-[--biqpod-primary-background] p-2 border border-[--biqpod-borders] border-solid rounded-xl">
      {field.type === "colors" ? (
        <ColorField
          fieldId={"product-metadata-" + field.key}
          placeholder="Enter colors"
          hint="Add colors using the color picker, predefined colors, or type color names/hex codes"
        />
      ) : (
        <MagicField
          config={options as any}
          fieldId={"product-metadata-" + field.key}
          type={fieldType}
        />
      )}
    </div>
  );
};
export const ProductMetadata = () => {
  const metadataState = useFormMetadata();
  const metadata = metadataState?.get;
  const [newFieldKey, setNewFieldKey] = useState("");
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());
  // Use useCopyState for the field type selection with EnumField
  const fieldTypeState = useCopyState<string | false | 0 | null | undefined>(
    undefined
  );
  // Create field value state for the new field key input
  const newFieldKeyValue = useFieldValue("new-field-key");
  const addMetadataField = () => {
    // Get the field value from the form field using the hook
    const fieldKeyValue = newFieldKeyValue.get || newFieldKey;
    if (!fieldKeyValue.trim()) return;
    const selectedFieldType = fieldTypeState.get as MetadataField["type"];
    if (!selectedFieldType) {
      showToast("Field type is required", "error");
      return;
    }
    const defaultValue = getDefaultValueForType(selectedFieldType);
    const newField: MetadataField = {
      key: fieldKeyValue.trim(),
      type: selectedFieldType,
      value: defaultValue,
    };
    const updatedMetadata = [...(metadata || []), newField];
    setFormMetadata(updatedMetadata);
    // Clear the fields
    newFieldKeyValue.set("");
    setNewFieldKey("");
    fieldTypeState.set(undefined);
  };
  const removeMetadataField = (index: number) => {
    if (!metadata) return;
    const updatedMetadata = metadata.filter((_: any, i: number) => i !== index);
    setFormMetadata(updatedMetadata);
  };
  const toggleFieldExpansion = (index: number) => {
    const newExpandedFields = new Set(expandedFields);
    if (newExpandedFields.has(index)) {
      newExpandedFields.delete(index);
    } else {
      newExpandedFields.add(index);
    }
    setExpandedFields(newExpandedFields);
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
                disabled={!(newFieldKeyValue.get || newFieldKey)?.trim()}
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
        {!metadata || metadata.length === 0 ? (
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
          <div>
            <AnimatePresence>
              {metadata.map((field: MetadataField, index: number) => {
                const isExpanded = expandedFields.has(index);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2 odd:bg-[--biqpod-primary-background] p-3 border-[--biqpod-borders] border-b border-solid"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-1 items-center gap-2">
                        <motion.button
                          onClick={() => toggleFieldExpansion(index)}
                          className="flex items-center gap-2 hover:bg-[--biqpod-gray-opacity] px-4 py-1 rounded-lg transition-all duration-200 ease-in-out"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <motion.div
                            initial={false}
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <Icon
                              icon={allIcons.solid.faChevronRight}
                              iconClassName="text-sm text-[--biqpod-gray-opacity]"
                            />
                          </motion.div>
                          <span className="font-semibold">{field.key}</span>
                        </motion.button>
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
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <CircleTip
                          onClick={() => removeMetadataField(index)}
                          icon={allIcons.solid.faTrash}
                        />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                            opacity: { duration: 0.2 },
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            exit={{ y: -10 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="mt-2 pl-6"
                          >
                            <RenderField field={field} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
