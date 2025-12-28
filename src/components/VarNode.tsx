import { allIcons } from "@biqpod/app/ui/apis";
import { EmptyComponent, CircleTip, Line } from "@biqpod/app/ui/components";
import { openMenu, showPopup, showToast } from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { InputChecker } from "../Integrations/UsersAccessListForStore";
import { UpsertVar } from "./UpsertVat";
import { TreeNode, VarTreeNodeProps } from "./VarTree";
import { Icon } from "@biqpod/app/ui/shared";
export const VarTreeNode = ({
  node,
  level,
  deleteVar,
  selectedVars,
  onSelectionChange,
}: VarTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const variable = node.variable;
  const isSelected = variable?.id ? selectedVars.has(variable.id) : false;
  // Get all variable IDs in this subtree
  const getAllVariableIds = (node: TreeNode): string[] => {
    const ids: string[] = [];
    if (node.variable?.id) {
      ids.push(node.variable.id);
    }
    node.children.forEach((child) => {
      ids.push(...getAllVariableIds(child));
    });
    return ids;
  };
  const handleSelectionChange = (selected: boolean) => {
    if (variable?.id) {
      onSelectionChange(variable.id, selected);
    }
  };
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand/collapse if clicking on checkbox or actions
    if (
      (e.target as HTMLElement).closest(".selection-checkbox, .actions-menu")
    ) {
      return;
    }
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };
  return (
    <EmptyComponent>
      <div>
        <div
          className={tw(
            `flex items-center cursor-pointer gap-2 p-1 active:bg-[--biqpod-gray-opacity-2] hover:bg-[--biqpod-gray-opacity]`,
            level % 2 && "bg-[--biqpod-secondary-background]"
          )}
          onClick={handleRowClick}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {/* Selection Checkbox */}
          {variable && (
            <div className="selection-checkbox">
              <InputChecker
                checked={isSelected}
                onValueChange={(checked) => handleSelectionChange(checked)}
              />
            </div>
          )}
          {!variable && <div className="w-4" />}
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <CircleTip
              icon={
                isExpanded
                  ? allIcons.solid.faChevronDown
                  : allIcons.solid.faChevronRight
              }
              className="text-sm pointer-events-none"
            />
          )}
          {!hasChildren && <div className="w-6" />}
          {/* Type Icon */}
          {variable && (
            <Icon
              icon={
                variable.type === "string"
                  ? allIcons.solid.faQuoteLeft
                  : variable.type === "number"
                  ? allIcons.solid.faHashtag
                  : variable.type === "boolean"
                  ? allIcons.solid.faToggleOn
                  : variable.type === "array"
                  ? allIcons.solid.faList
                  : variable.type === "date"
                  ? allIcons.solid.faCalendar
                  : allIcons.solid.faQuestionCircle
              }
              className="text-sm"
            />
          )}
          {!variable && (
            <Icon
              icon={allIcons.solid.faFolder}
              className="text-[--biqpod-primary] text-sm"
            />
          )}
          {/* Name */}
          <span className="flex-1 font-medium">{node.name}</span>
          {/* Value */}
          {variable && (
            <div className="flex items-center gap-2">
              <div className="text-sm">
                {variable.type === "boolean" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      variable.value
                        ? "bg-green-500/20 text-green-600"
                        : "bg-red-500/20 text-red-600"
                    }`}
                  >
                    {variable.value ? "true" : "false"}
                  </span>
                )}
                {variable.type === "array" && Array.isArray(variable.value) && (
                  <span className="text-[--biqpod-gray-opacity-2]">
                    [{variable.value.length} items]
                  </span>
                )}
                {variable.type === "date" && (
                  <span>
                    {new Date(variable.value as number).toLocaleDateString()}
                  </span>
                )}
                {variable.type === "number" && (
                  <span className="font-mono">{variable.value}</span>
                )}
                {variable.type === "string" && (
                  <span className="max-w-xs truncate">"{variable.value}"</span>
                )}
              </div>
              {/* Actions */}
              <div className="actions-menu">
                <CircleTip
                  icon={allIcons.solid.faEllipsisVertical}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openMenu({
                      menu: [
                        {
                          label: "Add Node",
                          defaultIcon: allIcons.solid.faPlus,
                          click: () =>
                            showPopup(<UpsertVar start={variable.name} />),
                        },
                        {
                          type: "separator",
                        },
                        {
                          label: "Edit",
                          defaultIcon: allIcons.solid.faPen,
                          click: () =>
                            showPopup(<UpsertVar variable={variable} />),
                        },
                        {
                          label: "Delete",
                          defaultIcon: allIcons.solid.faTrash,
                          click: () => {
                            variable.id &&
                              deleteVar(variable.id, variable.name);
                          },
                        },
                        {
                          label: "Copy Path",
                          defaultIcon: allIcons.regular.faCopy,
                          click: () => {
                            navigator.clipboard.writeText(variable.name);
                            showToast(
                              "Variable name copied to clipboard",
                              "success"
                            );
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
          )}
        </div>
        <Line />
      </div>
      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child) => (
              <VarTreeNode
                key={child.fullPath}
                node={child}
                level={level + 1}
                deleteVar={deleteVar}
                selectedVars={selectedVars}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </EmptyComponent>
  );
};
export interface VarTreeProps {
  variables: Biqpod.Snapbuy.Var[];
  deleteVar: (varId: string, varName: string) => void;
  selectedVars: Set<string>;
  onSelectionChange: (varId: string, selected: boolean) => void;
}
