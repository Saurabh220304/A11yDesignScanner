/**
 * layoutUtils.ts
 * Bounding box, auto-layout detection, and overflow helpers.
 */

/** Return true if a frame/component has auto-layout enabled. */
export function hasAutoLayout(node: FrameNode | ComponentNode): boolean {
  return node.layoutMode !== "NONE";
}

/** Return true if a frame has a fixed pixel width (no horizontal auto-layout stretch). */
export function hasFixedWidth(node: SceneNode): boolean {
  if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") return false;
  const f = node as FrameNode;
  return f.layoutMode === "NONE" || f.layoutSizingHorizontal === "FIXED";
}

/** Return true if a frame has a fixed pixel height (no vertical auto-layout stretch). */
export function hasFixedHeight(node: SceneNode): boolean {
  if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") return false;
  const f = node as FrameNode;
  return f.layoutMode === "NONE" || f.layoutSizingVertical === "FIXED";
}

/**
 * Check whether two bounding boxes overlap or are closer than `gap` pixels.
 */
export function areTooClose(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  gap: number
): boolean {
  const aRight  = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight  = b.x + b.width;
  const bBottom = b.y + b.height;

  const horizontalGap = Math.max(0, Math.max(a.x, b.x) - Math.min(aRight, bRight));
  const verticalGap   = Math.max(0, Math.max(a.y, b.y) - Math.min(aBottom, bBottom));

  // If they overlap in one axis, only the other axis gap matters
  const effectiveGap  = Math.min(horizontalGap, verticalGap);
  return effectiveGap < gap;
}

/** Sort nodes in reading order (top-to-bottom, left-to-right). */
export function readingOrder(
  nodes: SceneNode[]
): SceneNode[] {
  return [...nodes].sort((a, b) => {
    const ab = a.absoluteBoundingBox;
    const bb = b.absoluteBoundingBox;
    if (!ab || !bb) return 0;
    if (Math.abs(ab.y - bb.y) > 10) return ab.y - bb.y;
    return ab.x - bb.x;
  });
}
