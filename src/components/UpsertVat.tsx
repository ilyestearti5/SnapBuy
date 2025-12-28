import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Field,
  EnumField,
  EmptyComponent,
  MagicField,
  Button,
  Translate,
  Line,
} from "@biqpod/app/ui/components";
import {
  useTemp,
  getFieldValue,
  setFieldValue,
  setMagicField,
  useMagicField,
  useAction,
  showToast,
  execAction,
  closePopup,
  useAsyncMemo,
  confirm,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing, FullTypes } from "@biqpod/app/ui/types";
import { useEffect, useMemo } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
interface UpsertVarProps {
  variable?: Biqpod.Snapbuy.Var;
  start?: string;
}
export const UpsertVar = ({ start, variable }: UpsertVarProps) => {
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
      setFieldValue("var-name", name.toLowerCase().trim());
      const fullName = start
        ? start + "." + name.toLowerCase().trim()
        : name.toLowerCase().trim();
      const varData: Biqpod.Snapbuy.Var = {
        id: variable?.id,
        name: fullName,
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
      <CardHeaderForPopup
        title={
          variable
            ? "Edit Variable"
            : start
            ? "Add Node Variable"
            : "Add Variable"
        }
      />
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
