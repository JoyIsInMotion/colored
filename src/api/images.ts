import { supabase } from "../lib/supabase";

export async function processItemImage(itemId: string, originalPath: string | null) {
  if (!originalPath) return;

  const isLocal = window.location.hostname === "localhost";
  const fnUrl = isLocal
    ? "http://127.0.0.1:54321/functions/v1/process-item-image"
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-item-image`;

  console.log("processItemImage ->", fnUrl, itemId);

  try {
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
    });

    console.log("processItemImage response:", res.status, res.statusText);
    const text = await res.text();
    console.log("processItemImage response:", res.status, text);

    //  Wait/poll for a short while to let the backend finish writing the new image
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(` Waiting for image update... (${attempt + 1}/5)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
    }

    console.log("✅ Done waiting, likely updated now.");
  } catch (e) {
    console.error("processItemImage failed:", e);
  }
}
