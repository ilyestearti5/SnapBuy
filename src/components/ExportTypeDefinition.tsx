import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Translate,
  Icon,
  Button,
} from "@biqpod/app/ui/components";
import { useTemp, useAsyncMemo, closePopup } from "@biqpod/app/ui/hooks";
import { MarkDown } from "@biqpod/app/ui/shared";
import { useEffect } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";

export const ExportTypeDefinition = () => {
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
