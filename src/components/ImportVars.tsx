import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Icon,
  Translate,
  Button,
} from "@biqpod/app/ui/components";
import {
  openPath,
  showToast,
  execAction,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { MarkDown } from "@biqpod/app/ui/shared";
import { Biqpod } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";

export const ImportVars = () => {
  const storeId = useStoreId();
  const parseJsonToVars = (
    jsonData: any,
    prefix: string = ""
  ): Biqpod.Snapbuy.Var[] => {
    const vars: Biqpod.Snapbuy.Var[] = [];
    // Process current node if it has a name and value
    if (jsonData.name && jsonData.value !== undefined) {
      const fullName = prefix ? `${prefix}.${jsonData.name}` : jsonData.name;
      const varType = Array.isArray(jsonData.value)
        ? "array"
        : typeof jsonData.value === "boolean"
        ? "boolean"
        : typeof jsonData.value === "number"
        ? "number"
        : typeof jsonData.value === "string"
        ? "string"
        : "string";
      vars.push({
        id: undefined, // Will be set by the API
        name: fullName,
        value: jsonData.value,
        storeId: storeId!,
        createdAt: Date.now(),
        type: varType as Biqpod.Snapbuy.Var["type"],
      });
    }
    // Process child nodes
    if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
      const currentPrefix = jsonData.name
        ? prefix
          ? `${prefix}.${jsonData.name}`
          : jsonData.name
        : prefix;
      jsonData.nodes.forEach((node: any) => {
        vars.push(...parseJsonToVars(node, currentPrefix));
      });
    }
    return vars;
  };
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[60vh] overflow-hidden">
      <CardHeaderForPopup title="Import Variables from JSON" />
      <Line />
      <div className="flex flex-col justify-center items-center h-full">
        <Icon
          icon={allIcons.solid.faFileImport}
          className="text-[--biqpod-primary] text-4xl"
        />
        <h3 className="font-semibold text-lg">
          <Translate content="Import Variables" />
        </h3>
        <p className="text-[--biqpod-gray-opacity-2] p-2 text-sm">
          <Translate content="Select a JSON file to import variables. The file should contain a tree structure with name, value, and nodes properties." />
        </p>
        <div className="bg-[--biqpod-secondary-background] p-4 rounded-lg w-full">
          <h4 className="font-medium">Expected JSON Structure:</h4>
          <MarkDown
            value={`\`\`\`json
{
  "name": "header",
  "value": "Hello",
  "nodes": [
    {
      "name": "ui",
      "value": true
    }
  ]
}
\`\`\``}
          />
        </div>
        <Button
          icon={allIcons.solid.faFileImport}
          className="w-fit"
          onClick={async () => {
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
              return;
            }
            const jsonContent = await fetch(file).then((s) => s.json());
            const array = parseJsonToVars(jsonContent);
            const result = array.map((varData) =>
              snapbuyApi.var.upsert(varData)
            );
            closePopup();
            await Promise.all(result);
            showToast(
              `Successfully imported ${array.length} variables`,
              "success"
            );
            execAction("fetch-vars");
            closePopup();
          }}
        >
          <Translate content="Select JSON File" />
        </Button>
      </div>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          onClick={() => closePopup()}
        >
          <Translate content="Cancel" />
        </Button>
      </div>
    </Card>
  );
};
