
import { updateItem } from "./items";

/**
 * Process an item's image (background removal, etc.)
 * For now it's a stub that just marks the image as ready
 */
export async function processItemImage(itemId: string, originalPath: string | null) {
  if (!originalPath) return;

  // TODO: replace this with real BRIA RMBG call
  const cutout_path = originalPath;
  const image_processing_status = "ready";

  await updateItem(itemId, {
    cutout_path,
    image_processing_status,
    cover_path: cutout_path, 
  });
}
