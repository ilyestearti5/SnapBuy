import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Key,
  Line,
  MagicField,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  openMenu,
  setFieldValue,
  setMagicField,
  showPopup,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
  useMagicField,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";
import { Biqpod, FullTypes, Nothing } from "@biqpod/app/ui/types";
import { useEffect, useMemo } from "react";
interface UpsertVarProps {
  variable?: Biqpod.Snapbuy.Var;
}
const UpsertVar = ({ variable }: UpsertVarProps) => {
  const storeId = useStoreId();
  const selectedType = useTemp<string | Nothing>("selected-var-type");
  const name = getFieldValue("var-name");
  useEffect(() => {
    setFieldValue("var-name", variable?.name || "");
    selectedType.set(variable?.type);
    setMagicField("var-value", variable?.value);
  }, []);
  const value = useMagicField<number | string | boolean | string[]>(
    "var-value"
  );
  const type = selectedType.get as Biqpod.Snapbuy.Var["type"] | Nothing;
  const upsertAction = useAction(
    "upsert-var",
    async () => {
      if (!storeId) {
        showToast("Store ID not found", "error");
        return;
      }
      if (!name?.trim()) {
        showToast("Variable name is required", "error");
        return;
      }
      if (value.get === null || value.get === undefined) {
        showToast("Variable value is required", "error");
        return;
      }
      if (!type) {
        showToast("Variable type is required", "error");
        return;
      }
      // Check if name contains uppercase characters
      const hasUppercase = /[A-Z]/.test(name);
      if (hasUppercase) {
        const confirmed = await confirm({
          title: "Uppercase Characters Detected",
          message:
            "The variable name contains uppercase characters. It will be converted to lowercase.",
          detail: "Do you want to continue?",
        });
        if (!confirmed) {
          return;
        }
      }
      const varData: Biqpod.Snapbuy.Var = {
        id: variable?.id,
        name: hasUppercase ? name.trim().toLowerCase() : name.trim(),
        value: value.get,
        storeId,
        createdAt: variable?.createdAt || Date.now(),
        type,
      };
      await snapbuyApi.var.upsert(varData);
      showToast(
        variable
          ? "Variable updated successfully"
          : "Variable created successfully",
        "success"
      );
      execAction("fetch-vars");
      closePopup();
    },
    [storeId, name, value.get, variable]
  );
  const types: FullTypes.Data[] = [
    "array",
    "string",
    "boolean",
    "date",
    "number",
    "colors",
    "color",
  ];
  const defaultConfig: any = {
    string: { autoChange: true, hint: "Enter text..." },
    number: { autoChange: true, placeholder: "Enter number..." },
  };
  const vars = useAsyncMemo(async () => {
    if (!storeId) {
      return [];
    }
    return snapbuyApi.var.getAll(storeId);
  }, [storeId]);
  var fullVarObject = useAsyncMemo(async () => {
    if (!vars) return null;
    var object: Record<string, any> = {};
    vars.forEach((v) => {
      v.name.split(".").reduce((acc, part, index, arr) => {
        if (index === arr.length - 1) {
          acc[part] = v.value;
        } else {
          acc[part] = acc[part] || {};
        }
        return acc[part];
      }, object);
    });
    return object;
  }, [vars]);
  const propositions = useMemo(() => {
    if (!fullVarObject) {
      return [];
    }
    const getPaths = (obj: any, prefix: string = ""): string[] => {
      const paths: string[] = [];
      for (const key in obj) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          // Check if this object has any non-object properties (i.e., it's a parent of leaf values)
          const hasNonObject = Object.values(obj[key]).some(
            (val) =>
              typeof val !== "object" || val === null || Array.isArray(val)
          );
          if (hasNonObject) {
            paths.push(newPrefix);
          }
          paths.push(...getPaths(obj[key], newPrefix));
        }
      }
      return paths;
    };
    return getPaths(fullVarObject);
  }, [fullVarObject]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title={variable ? "Edit Variable" : "Add Variable"} />
      <Line />
      <div className="flex flex-col h-full">
        <div className="p-2">
          <Field
            inputName="var-name"
            controls={{
              "[a-z]+(\\.[a-z]+)*": {
                succ: "Valid variable name",
                err: "Avoid using dots in variable names",
              },
            }}
            propositions={propositions}
            placeholder="Enter Name"
            className="rounded-xl"
          />
        </div>
        <Line />
        <div className="p-2">
          <EnumField
            id="selected-type"
            state={selectedType}
            config={{
              list: types.map((type) => ({
                label:
                  type.toString().charAt(0).toUpperCase() +
                  type.toString().slice(1),
                value: type,
              })),
            }}
          />
        </div>
        <Line />
        {type && (
          <EmptyComponent>
            <div className="p-2">
              <MagicField
                fieldId={"var-value"}
                config={defaultConfig[type] || {}}
                type={type}
              />
            </div>
            <Line />
          </EmptyComponent>
        )}
      </div>
      <div className="flex justify-end gap-2 p-2">
        <Button
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          onClick={() => {
            closePopup();
          }}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          className="rounded-full"
          rightIcon={
            upsertAction?.status === "loading"
              ? allIcons.solid.faSpinner
              : variable
              ? allIcons.solid.faPenAlt
              : allIcons.solid.faPlus
          }
          iconClassName={
            upsertAction?.status === "loading" ? "animate-spin" : ""
          }
          onClick={() => execAction("upsert-var")}
          disabled={upsertAction?.status === "loading"}
        >
          <Translate content={variable ? "update" : "create"} />
        </Button>
      </div>
    </Card>
  );
};
const ExportTypeDefinition = () => {
  const storeId = useStoreId();
  const selectedLang = useTemp<string>("selected-export-lang");
  const generatedCode = useTemp<string>("generated-type-code");
  const vars = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.var.getAll(storeId);
  }, [storeId]);
  const fullVarObject = useAsyncMemo(async () => {
    if (!vars) return null;
    const object: Record<string, any> = {};
    vars.forEach((v) => {
      v.name.split(".").reduce((acc, part, index, arr) => {
        if (index === arr.length - 1) {
          acc[part] = v.value;
        } else {
          acc[part] = acc[part] || {};
        }
        return acc[part];
      }, object);
    });
    return object;
  }, [vars]);
  const languages = [
    {
      label: "TypeScript",
      value: "typescript",
      icon: allIcons.brands.faNodeJs,
    },
    { label: "JavaScript", value: "javascript", icon: allIcons.brands.faJs },
    { label: "C++", value: "cpp", icon: allIcons.solid.faCode },
    { label: "Java", value: "java", icon: allIcons.brands.faJava },
    { label: "C#", value: "csharp", icon: allIcons.solid.faCode },
    { label: "Python", value: "python", icon: allIcons.brands.faPython },
    { label: "Go", value: "go", icon: allIcons.solid.faCode },
    { label: "Rust", value: "rust", icon: allIcons.solid.faCode },
  ];
  const getTypeFromValue = (value: any): string => {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  };
  const generateTypeDefinition = (lang: string, obj: any) => {
    const generateTS = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "{\n";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}"${key}"?: ${generateTS(value, indent + 2)};\n`;
        } else if (type === "array") {
          const arrValue = value as any[];
          if (arrValue.length > 0) {
            const elemType = getTypeFromValue(arrValue[0]);
            result += `${spaces}"${key}"?: ${
              elemType === "object" ? "any" : elemType
            }[];\n`;
          } else {
            result += `${spaces}"${key}"?: any[];\n`;
          }
        } else {
          result += `${spaces}"${key}"?: ${type};\n`;
        }
      }
      result += " ".repeat(indent - 2) + "}";
      return result;
    };
    const generateJava = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}public static class ${
            key.charAt(0).toUpperCase() + key.slice(1)
          } ${generateJava(value, indent + 2)}\n`;
          result += `${spaces}public ${
            key.charAt(0).toUpperCase() + key.slice(1)
          } ${key};\n`;
        } else if (type === "array") {
          result += `${spaces}public Object[] ${key};\n`;
        } else {
          const javaType =
            type === "number"
              ? "double"
              : type === "boolean"
              ? "boolean"
              : "String";
          result += `${spaces}public ${javaType} ${key};\n`;
        }
      }
      return result;
    };
    const generateCpp = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "{\n";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}struct ${generateCpp(
            value,
            indent + 2
          )} ${key};\n`;
        } else if (type === "array") {
          result += `${spaces}std::vector<std::any> ${key};\n`;
        } else {
          const cppType =
            type === "number"
              ? "double"
              : type === "boolean"
              ? "bool"
              : "std::string";
          result += `${spaces}${cppType} ${key};\n`;
        }
      }
      result += " ".repeat(indent - 2) + "}";
      return result;
    };
    const generateCSharp = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "{\n";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}public class ${
            key.charAt(0).toUpperCase() + key.slice(1)
          } ${generateCSharp(value, indent + 2)}\n`;
          result += `${spaces}public ${
            key.charAt(0).toUpperCase() + key.slice(1)
          }? ${key.charAt(0).toUpperCase() + key.slice(1)} { get; set; }\n`;
        } else if (type === "array") {
          result += `${spaces}public object[]? ${
            key.charAt(0).toUpperCase() + key.slice(1)
          } { get; set; }\n`;
        } else {
          const csType =
            type === "number"
              ? "double"
              : type === "boolean"
              ? "bool"
              : "string";
          result += `${spaces}public ${csType}? ${
            key.charAt(0).toUpperCase() + key.slice(1)
          } { get; set; }\n`;
        }
      }
      result += " ".repeat(indent - 2) + "}";
      return result;
    };
    const generatePython = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}${key}: Optional[Dict] = None\n`;
        } else if (type === "array") {
          result += `${spaces}${key}: Optional[List] = None\n`;
        } else {
          const pyType =
            type === "number" ? "float" : type === "boolean" ? "bool" : "str";
          result += `${spaces}${key}: Optional[${pyType}] = None\n`;
        }
      }
      return result;
    };
    const generateGo = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "{\n";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        const goKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (type === "object" && value !== null) {
          result += `${spaces}${goKey} struct ${generateGo(
            value,
            indent + 2
          )} \`json:"${key}"\`\n`;
        } else if (type === "array") {
          result += `${spaces}${goKey} []interface{} \`json:"${key}"\`\n`;
        } else {
          const goType =
            type === "number"
              ? "float64"
              : type === "boolean"
              ? "bool"
              : "string";
          result += `${spaces}${goKey} ${goType} \`json:"${key}"\`\n`;
        }
      }
      result += " ".repeat(indent - 2) + "}";
      return result;
    };
    const generateRust = (obj: any, indent = 2): string => {
      const spaces = " ".repeat(indent);
      let result = "{\n";
      for (const [key, value] of Object.entries(obj)) {
        const type = getTypeFromValue(value);
        if (type === "object" && value !== null) {
          result += `${spaces}pub ${key}: Option<Box<struct ${generateRust(
            value,
            indent + 2
          )}>>,\n`;
        } else if (type === "array") {
          result += `${spaces}pub ${key}: Option<Vec<serde_json::Value>>,\n`;
        } else {
          const rustType =
            type === "number" ? "f64" : type === "boolean" ? "bool" : "String";
          result += `${spaces}pub ${key}: Option<${rustType}>,\n`;
        }
      }
      result += " ".repeat(indent - 2) + "}";
      return result;
    };
    if (!obj) return "";
    switch (lang) {
      case "typescript":
        return `interface Var ${generateTS(obj)}`;
      case "javascript":
        return `/**\n * @typedef {Object} Var\n${Object.entries(obj)
          .map(([key, value]) => {
            const type = getTypeFromValue(value);
            const jsType =
              type === "object" ? "Object" : type === "array" ? "Array" : type;
            return ` * @property {${jsType}} ${key}`;
          })
          .join("\n")}\n */`;
      case "cpp":
        return `struct Var ${generateCpp(obj)};`;
      case "java":
        return `public class Var {\n${generateJava(obj)}}`;
      case "csharp":
        return `public class Var ${generateCSharp(obj)}`;
      case "python":
        return `from typing import Optional, Dict, List\n\nclass Var:\n${generatePython(
          obj
        )}`;
      case "go":
        return `type Var struct ${generateGo(obj)}`;
      case "rust":
        return `#[derive(Serialize, Deserialize)]\npub struct Var ${generateRust(
          obj
        )}`;
      default:
        return "";
    }
  };
  useEffect(() => {
    if (selectedLang.get && fullVarObject) {
      const code = generateTypeDefinition(selectedLang.get, fullVarObject);
      generatedCode.set(code);
    }
  }, [selectedLang.get, fullVarObject]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title="Export Type Definition" />
      <Line />
      <div className="flex flex-col gap-4 h-full">
        <div className="p-4">
          <h3 className="mb-3 font-semibold text-sm">
            <Translate content="Select Programming Language" />
          </h3>
          <div className="gap-2 grid grid-cols-2 md:grid-cols-4">
            {languages.map((lang) => (
              <Card
                key={lang.value}
                className={`p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedLang.get === lang.value
                    ? "border-2 border-[--biqpod-primary] bg-[--biqpod-primary]/10"
                    : "border hover:border-[--biqpod-primary]/30"
                }`}
                onClick={() => selectedLang.set(lang.value)}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Icon icon={lang.icon} className="text-2xl" />
                  <span className="font-medium text-sm">{lang.label}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <Line />
        {generatedCode.get && (
          <MarkDown
            value={
              "```" + selectedLang.get + "\n" + generatedCode.get + "\n```"
            }
          />
        )}
      </div>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          onClick={() => closePopup()}
        >
          <Translate content="Close" />
        </Button>
      </div>
    </Card>
  );
};
export const Vars = () => {
  const storeId = useStoreId();
  const vars = useCopyState<Biqpod.Snapbuy.Var[]>([]);
  const searchValue = getFieldValue("search-vars");
  const filteredVars = filterFuzzySearch(
    vars.get || [],
    searchValue || "",
    "name"
  );
  useAction(
    "fetch-vars",
    async () => {
      if (!storeId) return;
      // Re-fetch vars data
      var list = await snapbuyApi.var.getAll(storeId);
      vars.set(list || []);
    },
    [storeId]
  );
  const user = useUser();
  useEffect(() => {
    if (storeId && user) {
      execAction("fetch-vars");
    }
  }, [user, storeId]);
  const deleteVar = async (varId: string, varName: string) => {
    const response = await confirm({
      title: "Delete Variable",
      message: `Are you sure you want to delete "${varName}"?`,
      detail: "This action cannot be undone.",
    });
    if (response) {
      await snapbuyApi.var.delete(varId);
      showToast("Variable deleted successfully", "success");
      execAction("fetch-vars");
    }
  };
  return (
    <EmptyComponent>
      {/* Search and Add Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center gap-2 p-4"
      >
        <div className="flex-1">
          <Field
            inputName="search-vars"
            placeholder="Search variables..."
            className="rounded-2xl"
          />
        </div>
        <div>
          <CircleTip
            icon={allIcons.solid.faEllipsisV}
            onClick={({ clientX, clientY }) => {
              openMenu({
                x: clientX,
                y: clientY,
                menu: [
                  {
                    label: "Add",
                    defaultIcon: allIcons.solid.faPlus,
                    click() {
                      showPopup(<UpsertVar />);
                    },
                  },
                  {
                    label: "Export Type",
                    defaultIcon: allIcons.solid.faFileExport,
                    click() {
                      showPopup(<ExportTypeDefinition />);
                    },
                  },
                ],
              });
            }}
          />
        </div>
      </motion.div>
      <Line />
      {/* Variables List */}
      <Scroll>
        {filteredVars && filteredVars.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-2 p-4"
          >
            <AnimatePresence>
              {filteredVars.map((variable, index) => (
                <motion.div
                  key={variable.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg p-4 border hover:border-[--biqpod-primary]/30 transition-all duration-200">
                    <div className="flex justify-between items-center gap-4">
                      {/* Left Section - Name and Type */}
                      <div className="flex flex-1 items-center gap-3 min-w-0">
                        <Key className="flex items-center gap-1">
                          {variable.type === "string" && (
                            <Icon
                              icon={allIcons.solid.faQuoteLeft}
                              className="text-xs"
                            />
                          )}
                          {variable.type === "number" && (
                            <Icon
                              icon={allIcons.solid.faHashtag}
                              className="text-xs"
                            />
                          )}
                          {variable.type === "boolean" && (
                            <Icon
                              icon={allIcons.solid.faCheck}
                              className="text-xs"
                            />
                          )}
                          {variable.type === "array" && (
                            <Icon
                              icon={allIcons.solid.faList}
                              className="text-xs"
                            />
                          )}
                          {variable.type === "date" && (
                            <Icon
                              icon={allIcons.solid.faCalendar}
                              className="text-xs"
                            />
                          )}
                          <span className="capitalize">
                            {variable.type.toString()}
                          </span>
                        </Key>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {variable.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Icon
                              icon={allIcons.solid.faClock}
                              className="text-[--biqpod-gray-opacity-2] text-xs"
                            />
                            <span className="text-[--biqpod-gray-opacity-2] text-xs">
                              {new Date(
                                variable.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Center Section - Value */}
                      <div className="flex-1 min-w-0 max-w-md">
                        <div className="text-[--biqpod-text-color] text-sm break-words">
                          {variable.type === "boolean" && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                variable.value
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-red-500/20 text-red-600"
                              }`}
                            >
                              {variable.value ? "True" : "False"}
                            </span>
                          )}
                          {variable.type === "array" &&
                            Array.isArray(variable.value) && (
                              <div className="flex flex-wrap gap-1">
                                {variable.value
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <span
                                      key={index}
                                      className="bg-[--biqpod-secondary-background] px-2 py-1 rounded text-[--biqpod-secondary-content] text-xs"
                                    >
                                      {String(item)}
                                    </span>
                                  ))}
                                {variable.value.length > 3 && (
                                  <span className="text-[--biqpod-secondary-content] text-xs">
                                    +{variable.value.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          {variable.type === "date" && (
                            <span className="font-medium">
                              {new Date(
                                variable.value as number
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {variable.type === "number" && (
                            <span className="font-mono font-medium">
                              {variable.value}
                            </span>
                          )}
                          {variable.type === "string" && (
                            <p className="truncate">{variable.value}</p>
                          )}
                        </div>
                      </div>
                      {/* Right Section - Actions */}
                      <div className="flex-shrink-0">
                        <CircleTip
                          icon={allIcons.solid.faEllipsisVertical}
                          onClick={(e) => {
                            openMenu({
                              menu: [
                                {
                                  label: "Edit",
                                  defaultIcon: allIcons.solid.faPen,
                                  click: () =>
                                    showPopup(
                                      <UpsertVar variable={variable} />
                                    ),
                                },
                                {
                                  label: "Delete",
                                  defaultIcon: allIcons.solid.faTrash,
                                  click: () => {
                                    variable.id &&
                                      deleteVar(variable.id, variable.name);
                                  },
                                },
                              ],
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col justify-center items-center gap-4 p-8 w-full h-full"
          >
            <Icon icon={allIcons.solid.faCodeBranch} className="text-6xl" />
            <div className="text-center">
              <h3 className="mb-2 font-semibold text-xl">
                <Translate content="No Variables" />
              </h3>
              <p className="mb-4">
                <Translate content="Create your first variable to get started" />
              </p>
              <Button
                icon={allIcons.solid.faPlus}
                onClick={() => showPopup(<UpsertVar />)}
              >
                <Translate content="Add Variable" />
              </Button>
            </div>
          </motion.div>
        )}
      </Scroll>
    </EmptyComponent>
  );
};
