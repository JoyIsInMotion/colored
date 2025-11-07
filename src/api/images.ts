// src/api/images.ts
import { supabase } from "../lib/supabase";
import { updateItem } from "./items";

/**
 * Trigger background removal for an item's image via Edge Function.
 * The Edge Function:
 *  - reads the item from Supabase
 *  - downloads original image from Storage
 *  - calls bg-service on port 9000
 *  - uploads cutout and updates DB (cutout_path, cover_path, status)
 */
export async function processItemImage(
  itemId: string,
  originalPath: string | null
) {
  if (!originalPath) return;

  try {
    // Optional: optimistically mark as "processing" in DB or UI
    await updateItem(itemId, { image_processing_status: "processing" });

    const { error } = await supabase.functions.invoke("process-item-image", {
      body: { itemId },
    });

    if (error) {
      console.error("process-item-image function error", error);
      // Optional: mark as failed or back to ready
      await updateItem(itemId, {
        image_processing_status: "ready",
      });
    }

    // No need to manually write cutout/cover paths here:
    // the Edge Function already updates the DB row.
  } catch (err) {
    console.error("Error calling process-item-image", err);
    // Fallback: make sure the item isn't stuck in "processing"
    try {
      await updateItem(itemId, { image_processing_status: "ready" });
    } catch {
      // ignore
    }
  }
}
