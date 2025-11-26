import { supabase } from "../lib/supabase";

export async function processItemImage(
  itemId: string,
  originalPath: string | null
) {
  if (!originalPath) return;

  const isLocal = window.location.hostname === "localhost";

  console.log("processItemImage ->", { itemId, originalPath, isLocal });

  try {
    if (isLocal) {
      // 🔹 DEV: call local Supabase function (served via `supabase functions serve`)
      const fnUrl =
        "http://127.0.0.1:54321/functions/v1/process-item-image";

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // using --no-verify-jwt so no Authorization here
        },
        body: JSON.stringify({
          itemId,
          originalPath,
        }),
      });

      const text = await res.text();
      console.log(
        "processItemImage LOCAL response:",
        res.status,
        res.statusText,
        text
      );

      if (!res.ok) {
        throw new Error(`Local function failed: ${res.status}`);
      }
    } else {
      // 🔹 FUTURE / PROD: remote Supabase function in the cloud
      const { data, error } = await supabase.functions.invoke(
        "process-item-image",
        {
          body: {
            itemId,
            originalPath,
          },
        }
      );

      if (error) {
        console.error("processItemImage REMOTE error:", error);
        throw error;
      }

      console.log("processItemImage REMOTE data:", data);
    }

    // tiny wait if needed
    const ATTEMPTS = 1;
    const DELAY_MS = 300;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      console.log(
        ` Waiting for image update... (${attempt + 1}/${ATTEMPTS})`
      );
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    console.log("✅ Done waiting, likely updated now.");
  } catch (e) {
    console.error("processItemImage failed:", e);
  }
}
