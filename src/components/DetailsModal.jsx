import React, { useState } from "react";
import AddItemForm from "./AddItemForm";
import ExistingItemDetails from "./ExistingItemDetails";
import { deleteItem } from "../api/items";

export default function DetailsModal({ item, onClose, onCreated, onUpdated, onDeleted }) {
  
  const isNew = item?.isNew;
  const [isEditing, setIsEditing] = useState(isNew ? true : false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const title = isNew
    ? "Add New Item"
    : isEditing
      ? `Edit ${item.title || "Item"}`
      : (item.title || item.name || "Item");

  async function handleDelete() {
    if (!item?.id) return;
    // optional safety: confirm()
    const ok = window.confirm(
      `Delete "${item.title || "this item"}"? This can't be undone.`
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setError("");
      await deleteItem(item.id);

      // tell parent so it can remove from list
      if (onDeleted) onDeleted(item.id);

      // close modal
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to delete item.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-0 sm:p-6 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* Body */}
        {isEditing ? (
          <AddItemForm
            initialItem={isNew ? null : item}
            onClose={onClose}
            onCreated={(newItem) => {
              // new item added
              if (onCreated) onCreated(newItem);
            }}
            onUpdated={(savedItem) => {
              // existing item updated
              if (onUpdated) onUpdated(savedItem);
            }}
          />
        ) : (
          <ExistingItemDetails item={item} />
        )}
        {/* Footer */}
        {!isEditing && !isNew && (
          <div className="px-4 pb-4 flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl border"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit
            </button>
            <button
              className="px-3 py-2 rounded-xl border text-red-600 border-red-200 disabled:opacity-50"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "🗑️ Delete"}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
