import React from "react";
import FieldRow from "./FieldRow";
import { formatPrice, formatDateLong } from "./formatters";

export default function ExistingItemDetails({ item }) {
  // normalize the data so both DB shape and old mock shape work
  const title = item.title || item.name || "Item";
  const imageUrl = item.image_url || item.image || null;
  const brand = item.brand || "";
  const category = item.category || "";
  const colorHex = item.color_hex || item?.color?.hex || null;
  const colorName = item?.color?.name || item.color || null;
  const season = item.season || "";
  const size = item.size ?? item.size_label ?? "";
  const price = item.price ?? item.cost ?? "";
  const purchasedAt = item.purchased_at ?? item.purchaseDate ?? "";
  const notes = item.notes ?? "";
  const typeLabel = item.type_label || item?.type?.label || "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-6 p-4">
      {/* Left: image */}
      <div className="aspect-[4/5] bg-neutral-50 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Right: data */}
      <div className="space-y-3">
        {typeLabel && <FieldRow label="Type" value={typeLabel} />}
        <FieldRow label="Brand" value={brand} />
        <FieldRow label="Category" value={category} />
        <FieldRow
          label="Color"
          value={colorName  ||""}
          swatch={colorHex}
        />
        <FieldRow label="Season" value={season} />
        <FieldRow label="Size" value={size} />
        <FieldRow label="Price" value={formatPrice(price)} />
        <FieldRow
          label="Purchased"
          value={formatDateLong(purchasedAt)}
        />

        {notes && (
          <div>
            <div className="text-xs text-neutral-500 mb-1">Notes</div>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
