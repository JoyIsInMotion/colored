import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type ItemRow     = Database["public"]["Tables"]["items"]["Row"];
type ItemInsert  = Database["public"]["Tables"]["items"]["Insert"];
type ItemCategory = Database["public"]["Enums"]["item_category"];

type ItemTypeRow  = Database["public"]["Tables"]["item_types"]["Row"];
type ItemTypeAliasRow = Database["public"]["Tables"]["item_type_aliases"]["Row"];

export type ItemView = ItemRow & {
  image_url?: string | null;
  type_label?: string | null; 
  category_label?: string | null;
};



async function buildImageUrl(it: ItemRow, expiresIn = 3600): Promise<string | null> {
  const path = it.cutout_path || it.cover_path || it.original_path;
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("wardrobe")
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("createSignedUrl failed", error);
    return null;
  }

  // bust cache each time we refresh the item
  const freshUrl = data.signedUrl + `&cb=${Date.now()}`;
  return freshUrl;
}

async function enrichItem(it: ItemRow): Promise<ItemView> {
  const image_url = await buildImageUrl(it);

  let type_label: string | null = null;
  if (it.type_id) {
    const { data } = await supabase
      .from("item_types")
      .select("label")
      .eq("id", it.type_id)
      .single();
    type_label = data?.label ?? null;
  }

  return { ...it, image_url, type_label };
}


export async function uploadWardrobeImage(userId: string, file: File): Promise<string> {
  if (!userId) throw new Error("No userId");
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${userId}/items/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("wardrobe").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return path;
}

export async function createItem(
  userId: string,
  item: Omit<ItemInsert, "user_id">
): Promise<ItemView> {
  const payload: ItemInsert = { ...item, user_id: userId };
  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return enrichItem(data!);
}

export async function listMyItems(userId: string): Promise<ItemView[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const items = data ?? [];
  return Promise.all(items.map(enrichItem));
}

export async function listMyItemsCurrent(): Promise<ItemView[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not signed in");
  return listMyItems(userId);
}

export async function updateItem(
  itemId: string,
  patch: Partial<ItemInsert>
): Promise<ItemView> {
  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return enrichItem(data!);
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw error;
}

export const CATEGORIES: ItemCategory[] = [
  "top","bottom","dress","outerwear","shoes","accessory","other",
];

export async function listItemTypes(category?: ItemCategory): Promise<ItemTypeRow[]> {
  let query = supabase.from("item_types").select("*").order("sort");
  if (category) query = query.eq("category_slug", category);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function resolveTypeByAlias(alias: string): Promise<ItemTypeRow | null> {
  const { data, error } = await supabase
    .from("item_type_aliases")
    .select(`
      type_id,
      item_types!inner(id, slug, label, category_slug, sort)
    `)
    .eq("alias", alias)
    .maybeSingle();

  if (error || !data?.item_types) return null;
  return data.item_types as ItemTypeRow;
}
export { enrichItem };