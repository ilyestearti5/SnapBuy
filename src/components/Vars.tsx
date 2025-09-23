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
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";
import { Nothing, SettingConfig } from "@biqpod/app/ui/types";
import { useEffect } from "react";
interface UpsertVarProps {
  variable?: SnapBuy.Var;
}
const UpsertVar = ({ variable }: UpsertVarProps) => {
  const storeId = useStoreId();
  const name = getFieldValue("var-name");
  useEffect(() => {
    setFieldValue("var-name", variable?.name || "");
  }, []);
  const value = useCopyState<string>(variable?.value || "");
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
      if (!value.get.trim()) {
        showToast("Variable value is required", "error");
        return;
      }
      const varData: SnapBuy.Var = {
        id: variable?.id || crypto.randomUUID(),
        name: name.trim(),
        value: value.get.trim(),
        storeId,
        createdAt: variable?.createdAt || Date.now(),
      };
      await snapbuyApi.upsertVar(varData);
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
  const types: (keyof SettingType)[] = [
    "array",
    "string",
    "boolean",
    "date",
    "number",
  ];
  const defaultConfig: Partial<
    Record<keyof SettingType, SettingConfig[keyof SettingConfig]>
  > = {
    string: { autoChange: true, hint: "Enter text..." },
    number: { autoChange: true, placeholder: "Enter number..." },
  };
  const selectedType = useTemp<string | Nothing>("selected-var-type");
  const type = selectedType.get as keyof SettingType | null;
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
                label: type.charAt(0).toUpperCase() + type.slice(1),
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
                fieldId="var-type"
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
          onClick={closePopup}
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
    return snapbuyApi.getVars(storeId);
  }, [storeId]);
  const searchValue = getFieldValue("search-vars");
  const filteredVars = filterFuzzySearch(vars || [], searchValue || "", "name");
  useAction(
    "fetch-vars",
    async () => {
      if (!storeId) return;
      // Re-fetch vars data
      return snapbuyApi.getVars(storeId);
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
      await snapbuyApi.deleteVar(varId);
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
                  <Card className="hover:shadow-md p-4 border transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            icon={allIcons.solid.faTag}
                            iconClassName="text-sm"
                          />
                          <h3 className="font-semibold text-lg">
                            {variable.name}
                          </h3>
                        </div>
                        <div className="flex items-start gap-2">
                          <Icon
                            icon={allIcons.solid.faFileText}
                            iconClassName="text-sm mt-1"
                          />
                          <p className="flex-1 break-words">{variable.value}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Icon
                            icon={allIcons.solid.faClock}
                            iconClassName="text-xs"
                          />
                          <span className="text-xs">
                            {new Date(variable.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <CircleTip
                          icon={allIcons.solid.faPen}
                          onClick={() =>
                            showPopup(<UpsertVar variable={variable} />)
                          }
                          className="bg-blue-100 hover:bg-blue-200"
                        />
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
