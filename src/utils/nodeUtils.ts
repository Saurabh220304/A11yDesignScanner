/**
 * nodeUtils.ts
 * Node traversal helpers and type-guards for the Figma Plugin API.
 */

/** Returns true if node can have children. */
export function isParentNode(node: BaseNode): node is ChildrenMixin & BaseNode {
  return "children" in node;
}

export function isTextNode(node: BaseNode): node is TextNode {
  return node.type === "TEXT";
}

export function isFrameNode(node: BaseNode): node is FrameNode {
  return node.type === "FRAME";
}

export function isComponentNode(node: BaseNode): node is ComponentNode {
  return node.type === "COMPONENT";
}

export function isComponentSetNode(node: BaseNode): node is ComponentSetNode {
  return node.type === "COMPONENT_SET";
}

export function isInstanceNode(node: BaseNode): node is InstanceNode {
  return node.type === "INSTANCE";
}

export function isVectorNode(node: BaseNode): node is VectorNode {
  return node.type === "VECTOR";
}

export function isRectangleNode(node: BaseNode): node is RectangleNode {
  return node.type === "RECTANGLE";
}

export function isSceneNode(node: BaseNode): node is SceneNode {
  return "visible" in node;
}

/** Iterative depth-first traversal of a node tree. Skips invisible/zero-opacity nodes. */
export function* traverseNodes(roots: readonly SceneNode[]): Generator<SceneNode> {
  const stack: SceneNode[] = [...roots].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!node.visible || node.opacity === 0) continue;
    yield node;
    if (isParentNode(node)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i] as SceneNode);
      }
    }
  }
}

/** Return the first solid fill paint from a node, or null. */
export function getSolidFill(node: SceneNode): SolidPaint | null {
  if (!("fills" in node)) return null;
  const fills = node.fills as Paint[];
  if (!Array.isArray(fills)) return null;
  for (const f of fills) {
    if (f.type === "SOLID" && (f.opacity ?? 1) > 0) return f as SolidPaint;
  }
  return null;
}

/** Walk up the tree to find the first ancestor that has a visible solid fill. */
export function getEffectiveBackground(node: SceneNode): SolidPaint | null {
  let current: BaseNode | null = node.parent;
  while (current && current.type !== "PAGE") {
    const fill = getSolidFill(current as SceneNode);
    if (fill) return fill;
    current = current.parent;
  }
  // Default to white when no background found
  return { type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1 } as SolidPaint;
}

/** Collect all interactive-looking nodes (components / instances with interaction-like names). */
export function looksInteractive(node: SceneNode): boolean {
  const interactiveTypes: NodeType[] = ["COMPONENT", "INSTANCE"];
  if (interactiveTypes.includes(node.type)) return true;
  const name = node.name.toLowerCase();
  return (
    name.includes("button") ||
    name.includes("btn") ||
    name.includes("link") ||
    name.includes("input") ||
    name.includes("checkbox") ||
    name.includes("radio") ||
    name.includes("toggle") ||
    name.includes("select") ||
    name.includes("tab") ||
    name.includes("chip") ||
    name.includes("icon") ||
    name.includes("menu item") ||
    name.includes("dropdown")
  );
}

/** Return absolute bounding box of a node. */
export function absoluteBounds(node: SceneNode): { x: number; y: number; width: number; height: number } {
  const ab = node.absoluteBoundingBox;
  if (ab) return { x: ab.x, y: ab.y, width: ab.width, height: ab.height };
  return { x: 0, y: 0, width: 0, height: 0 };
}
