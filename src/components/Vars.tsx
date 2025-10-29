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
  Line,
  MagicField,
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
  showPopup,
  showToast,
  useAction,
  useAsyncMemo,
  useMagicField,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";
import { Biqpod, FullTypes, Nothing } from "@biqpod/app/ui/types";
import { useEffect } from "react";
interface UpsertVarProps {
  variable?: Biqpod.Snapbuy.Var;
}
const UpsertVar = ({ variable }: UpsertVarProps) => {
  const storeId = useStoreId();
  const name = getFieldValue("var-name");
  useEffect(() => {
    setFieldValue("var-name", variable?.name || "");
  }, []);
  const value = useMagicField<number | string | boolean | string[]>(
    "var-value"
  );
  const selectedType = useTemp<string | Nothing>("selected-var-type");
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
      const varData: Biqpod.Snapbuy.Var = {
        id: variable?.id || crypto.randomUUID(),
        name: name.trim(),
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
  ];
  const defaultConfig: any = {
    string: { autoChange: true, hint: "Enter text..." },
    number: { autoChange: true, placeholder: "Enter number..." },
  };

  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title={variable ? "Edit Variable" : "Add Variable"} />
      <Line />
      <div className="flex flex-col gap-4 h-full">
        <div className="p-2">
          <Field inputName="var-name" placeholder="Enter Variable Name" />
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
                ...defaultConfig[type],
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
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          onClick={() => {
            closePopup();
          }}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          icon={
            upsertAction?.status === "loading"
              ? allIcons.solid.faSpinner
              : variable
              ? allIcons.solid.faPen
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
export const Vars = () => {
  const storeId = useStoreId();
  const vars = useAsyncMemo(async () => {
    if (!storeId) return [];
    return snapbuyApi.var.getAll(storeId);
  }, [storeId]);
  const searchValue = getFieldValue("search-vars");
  const filteredVars = filterFuzzySearch(vars || [], searchValue || "", "name");
  useAction(
    "fetch-vars",
    async () => {
      if (!storeId) return;
      // Re-fetch vars data
      return snapbuyApi.var.getAll(storeId);
    },
    [storeId]
  );
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
            className="rounded-full"
          />
        </div>
        <Button
          icon={allIcons.solid.faPlus}
          onClick={() => showPopup(<UpsertVar />)}
          className="rounded-full w-fit"
        >
          <Translate content="add" />
        </Button>
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
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="flex items-center gap-1 bg-[--biqpod-gray-opacity] px-2 py-1 rounded-full text-xs">
                            {variable.type === "string" && (
                              <Icon
                                icon={allIcons.solid.faQuoteLeft}
                                iconClassName="text-xs"
                              />
                            )}
                            {variable.type === "number" && (
                              <Icon
                                icon={allIcons.solid.faHashtag}
                                iconClassName="text-xs"
                              />
                            )}
                            {variable.type === "boolean" && (
                              <Icon
                                icon={allIcons.solid.faCheck}
                                iconClassName="text-xs"
                              />
                            )}
                            {variable.type === "array" && (
                              <Icon
                                icon={allIcons.solid.faList}
                                iconClassName="text-xs"
                              />
                            )}
                            {variable.type === "date" && (
                              <Icon
                                icon={allIcons.solid.faCalendar}
                                iconClassName="text-xs"
                              />
                            )}
                            <span className="capitalize">
                              {variable.type.toString()}
                            </span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {variable.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Icon
                              icon={allIcons.solid.faClock}
                              iconClassName="text-xs text-[--biqpod-secondary-content]"
                            />
                            <span className="text-[--biqpod-secondary-content] text-xs">
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
                                  click: () =>
                                    deleteVar(variable.id, variable.name),
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
            <Icon icon={allIcons.solid.faCodeBranch} iconClassName="text-6xl" />
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
