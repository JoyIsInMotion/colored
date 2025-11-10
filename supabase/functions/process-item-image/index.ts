// @ts-nocheck
import { serve } from "https://deno.land/std/http/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ——— CORS headers ———
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ——— Background-removal service ———
const BG_SERVICE_URL =
  Deno.env.get("BG_SERVICE_URL") ??
  "http://host.docker.internal:9000/remove-background";

// ——— Storage bucket ———
const BUCKET = "wardrobe";

// ——— Main handler ———
serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // --- Read env vars safely ---
    const supabaseUrl = Deno.env.get("EDGE_DB_URL");
    const supabaseKey = Deno.env.get("EDGE_DB_SERVICE_ROLE_KEY");

    console.log("USING_DB_URL", Deno.env.get("EDGE_DB_URL"));


    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return new Response("Server misconfigured (missing env)", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Parse body ---
    const { itemId } = await req.json();
    console.log("FUNCTION CALLED for itemId:", itemId);

    if (!itemId) {
      return new Response("Missing itemId", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // --- 1) Fetch item ---
    const { data: item, error: itemErr } = await supabase
      .from("items")
      .select("id, original_path")
      .eq("id", itemId)
      .single();

    if (itemErr || !item?.original_path) {
      console.error("Item fetch error", itemErr);
      return new Response("Item not found or no original_path", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // --- 2) Get signed URL ---
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.original_path, 60);

    if (signErr || !signed?.signedUrl) {
      console.error("Sign error", signErr);
      return new Response("Cannot sign image", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const imgResp = await fetch(signed.signedUrl);
    if (!imgResp.ok) {
      console.error("Download error", await imgResp.text());
      return new Response("Cannot download image", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const imgArrayBuf = await imgResp.arrayBuffer();

    // --- 3) Call background-removal service ---
    let cutoutBytes: Uint8Array | null = null;
    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([imgArrayBuf], {
          type: imgResp.headers.get("content-type") ?? "image/jpeg",
        }),
        "item.jpg",
      );

      const bgResp = await fetch(BG_SERVICE_URL, {
        method: "POST",
        body: form,
      });

      if (bgResp.ok) {
        const outBuf = await bgResp.arrayBuffer();
        cutoutBytes = new Uint8Array(outBuf);
      } else {
        console.error("bg-service error", bgResp.status, await bgResp.text());
      }

      console.log("🧠 Calling background remover at", BG_SERVICE_URL);

    } catch (err) {
      console.error("bg-service call failed", err);
    }

    // --- 4) Upload cutout or keep original ---
    let finalPath = item.original_path;

    if (cutoutBytes) {
      const cutoutPath = item.original_path.replace(
        /(\.[^./]+)?$/,
        "-cutout.png",
      );

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(cutoutPath, cutoutBytes, {
          upsert: true,
          contentType: "image/png",
        });

      if (uploadErr) {
        console.error("Upload cutout failed, keeping original", uploadErr);
      } else {
        finalPath = cutoutPath;
      }
    }

    // --- 5) Update DB row ---
    await supabase
      .from("items")
      .update({
        cutout_path: finalPath,
        cover_path: finalPath,
        image_processing_status: "ready",
      })
      .eq("id", itemId);

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    console.error("Function error", e);
    try {
      const { itemId } = await req.json();
      if (itemId) {
        const supabaseUrl = Deno.env.get("EDGE_DB_URL");
        const supabaseKey = Deno.env.get("EDGE_DB_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from("items")
            .update({ image_processing_status: "ready" })
            .eq("id", itemId);
        }
      }
    } catch (_) {}
    return new Response("Internal error, fallback to original if possible", {
      status: 200,
      headers: corsHeaders,
    });
  }
});
