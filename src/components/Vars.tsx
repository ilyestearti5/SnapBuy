import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CircleTip,
  EmptyComponent,
  Field,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getFieldValue,
  openMenu,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion } from "framer-motion";
import { filterFuzzySearch, tw } from "@biqpod/app/ui/utils";
import { Biqpod } from "@biqpod/app/ui/types";
import { useEffect, useState } from "react";
import { UpsertVar } from "./UpsertVat";
import { InputChecker } from "../Integrations/UsersAccessListForStore";
import { ImportVars } from "./ImportVars";
import { ExportTypeDefinition } from "./ExportTypeDefinition";
import { VarTree } from "./VarTree";
import { CreateFirstUI } from "./CreateFirstUI";
import { useUsedBy } from "../routes/Stores/Stores";
export const Vars = () => {
  const storeId = useStoreId();
  const vars = useCopyState<Biqpod.Snapbuy.Var[]>([]);
  const searchValue = getFieldValue("search-vars");
  const filteredVars = filterFuzzySearch(
    vars.get || [],
    searchValue || "",
    "name"
  );
  const usedBy = useUsedBy();
  const [selectedVars, setSelectedVars] = useState<Set<string>>(new Set());
  const handleSelectionChange = (varId: string, selected: boolean) => {
    setSelectedVars((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(varId);
      } else {
        newSet.delete(varId);
      }
      return newSet;
    });
  };
  const handleBulkDelete = async () => {
    if (selectedVars.size === 0) return;
    const selectedVarNames = filteredVars
      .filter((v) => v.id && selectedVars.has(v.id))
      .map((v) => v.name);
    const response = await confirm({
      title: "Delete Selected Variables",
      message: `Are you sure you want to delete ${selectedVars.size} selected variable(s)?`,
      detail: `Variables: ${selectedVarNames.join(
        ", "
      )}\n\nThis action cannot be undone.`,
      type: "warning",
    });
    if (response) {
      try {
        await Promise.all(
          Array.from(selectedVars).map((varId) => snapbuyApi.var.delete(varId))
        );
        showToast(
          `Successfully deleted ${selectedVars.size} variables`,
          "success"
        );
        setSelectedVars(new Set());
        execAction("fetch-vars");
      } catch (error) {
        showToast("Failed to delete some variables", "error");
      }
    }
  };
  const handleSelectAll = (selected: boolean) => {
    const visibleVarIds = filteredVars.filter((v) => v.id).map((v) => v.id!);
    setSelectedVars((prev) => {
      const newSet = new Set(prev);
      visibleVarIds.forEach((id) => {
        if (selected) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  };
  const isAllSelected =
    filteredVars.length > 0 &&
    filteredVars.every((v) => v.id && selectedVars.has(v.id));
  const clearSelection = () => {
    setSelectedVars(new Set());
  };
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
      type: "warning",
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
        className="flex justify-between items-center gap-2 p-2"
      >
        <div className="flex flex-1 items-center gap-2">
          <Field
            inputName="search-vars"
            placeholder="Search variables..."
            className="flex-1 rounded-2xl"
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
                    label: "Import from JSON",
                    defaultIcon: allIcons.solid.faFileImport,
                    click() {
                      showPopup(<ImportVars />);
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
      <div className="flex justify-between p-2">
        {filteredVars.length > 0 && (
          <div className="flex items-center gap-2">
            <InputChecker
              checked={isAllSelected}
              onValueChange={(checked) => handleSelectAll(checked)}
              className="bg-[--biqpod-background] border-[--biqpod-borders] rounded focus:ring-[--biqpod-primary] focus:ring-2 w-4 h-4 text-[--biqpod-primary]"
              title="Select all visible variables"
            />
            <span className="text-[--biqpod-gray-opacity-2] text-sm">
              Select All
            </span>
          </div>
        )}
        <div
          className={tw(
            "flex items-center gap-2",
            selectedVars.size <= 0 && "invisible"
          )}
        >
          <span className="text-[--biqpod-gray-opacity-2] text-sm">
            {selectedVars.size} selected
          </span>
          <CircleTip
            icon={allIcons.solid.faEllipsisVertical}
            onClick={({ clientX, clientY }) => {
              openMenu({
                x: clientX,
                y: clientY,
                menu: [
                  {
                    label: "Delete Selected",
                    defaultIcon: allIcons.solid.faTrash,
                    click: handleBulkDelete,
                  },
                  {
                    label: "Clear",
                    defaultIcon: allIcons.solid.faTimes,
                    click: clearSelection,
                  },
                ],
              });
            }}
          />
        </div>
      </div>
      <Line />
      {/* Variables List */}
      <Scroll>
        {filteredVars && filteredVars.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            <VarTree
              variables={filteredVars}
              deleteVar={deleteVar}
              selectedVars={selectedVars}
              onSelectionChange={handleSelectionChange}
            />
          </motion.div>
        ) : (
          <CreateFirstUI
            photo="https://cdn3d.iconscout.com/3d/premium/thumb/variable-3d-icon-png-download-4652827.png?f=webp"
            title="No Variables Found"
            description="You have no variables yet. Create your first variable to get started."
          />
        )}
      </Scroll>
      <Line />
      {(usedBy === "owned" || usedBy === "read/edit") && (
        <div className="p-2">
          <Button
            onClick={() => {
              showPopup(<UpsertVar />);
            }}
            className="rounded-full"
            icon={allIcons.solid.faPlus}
          >
            <Translate content="create" />
          </Button>
        </div>
      )}
    </EmptyComponent>
  );
};
