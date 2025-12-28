import { Biqpod } from "@biqpod/app/ui/types";
import { TreeNode } from "./VarTree";

export const buildTree = (variables: Biqpod.Snapbuy.Var[]): TreeNode[] => {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  // Sort variables by name to ensure consistent ordering
  const sortedVars = [...variables].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  sortedVars.forEach((variable) => {
    const parts = variable.name.split(".");
    let currentPath = "";
    parts.forEach((part, index) => {
      const previousPath = currentPath;
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      if (!nodeMap.has(currentPath)) {
        const node: TreeNode = {
          name: part,
          fullPath: currentPath,
          children: [],
          isExpanded: false,
          variable: index === parts.length - 1 ? variable : undefined,
        };
        nodeMap.set(currentPath, node);
        if (previousPath) {
          const parentNode = nodeMap.get(previousPath);
          if (parentNode) {
            parentNode.children.push(node);
          }
        } else {
          root.push(node);
        }
      } else if (index === parts.length - 1) {
        // Update existing node with variable data if it's the leaf
        const existingNode = nodeMap.get(currentPath);
        if (existingNode) {
          existingNode.variable = variable;
        }
      }
    });
  });
  return root;
};
