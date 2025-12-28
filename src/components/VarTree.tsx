import { Biqpod } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { buildTree } from "./utils";
import { VarTreeNode, VarTreeProps } from "./VarNode";

export const VarTree = ({
  variables,
  deleteVar,
  selectedVars,
  onSelectionChange,
}: VarTreeProps) => {
  const tree = useMemo(() => buildTree(variables), [variables]);
  return (
    <div className="flex flex-col gap-1">
      {tree.map((node) => (
        <VarTreeNode
          key={node.fullPath}
          node={node}
          level={0}
          deleteVar={deleteVar}
          selectedVars={selectedVars}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  );
};
export interface TreeNode {
  name: string;
  fullPath: string;
  variable?: Biqpod.Snapbuy.Var;
  children: TreeNode[];
  isExpanded?: boolean;
}
export interface VarTreeNodeProps {
  node: TreeNode;
  level: number;
  deleteVar: (varId: string, varName: string) => void;
  selectedVars: Set<string>;
  onSelectionChange: (varId: string, selected: boolean) => void;
}
