from pathlib import Path
from typing import Union

import numpy as np
from PIL import Image

# Reuse your existing helpers from the background remover
from ..background_remover.trendyol_bg import (
    _crop_to_object,
    _fit_on_canvas,
    _add_outline,
    _add_drop_shadow,
    CANVAS_SIZE,
)


def build_item_from_mask(
    image_path: Union[str, Path],
    mask_path: Union[str, Path],
    out_path: Union[str, Path],
    add_style: bool = True,
) -> Path:
    """
    Take:
      - original full-body photo (image_path)
      - a binary mask image for ONE item (mask_path, 0/255)
    and produce:
      - a 1024x1024 PNG in your magazine style (out_path).
    """

    image_path = Path(image_path)
    mask_path = Path(mask_path)
    out_path = Path(out_path)

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    if not mask_path.exists():
        raise FileNotFoundError(f"Mask not found: {mask_path}")

    # 1) Load original image and mask
    img = Image.open(image_path).convert("RGBA")
    mask_img = Image.open(mask_path).convert("L")

    # Ensure same size
    if img.size != mask_img.size:
        mask_img = mask_img.resize(img.size, Image.NEAREST)

    mask_arr = np.array(mask_img)

    # Force to 0/255
    if mask_arr.dtype != np.uint8:
        mask_arr = (mask_arr > 0).astype("uint8") * 255

    alpha = Image.fromarray(mask_arr, mode="L")

    # 2) Apply mask as alpha
    rgba = img.copy()
    rgba.putalpha(alpha)

    # 3) Reuse your layout pipeline (crop + canvas + style)
    rgba = _crop_to_object(rgba, margin_ratio=0.05)
    rgba = _fit_on_canvas(rgba, canvas_size=CANVAS_SIZE, padding=40)

    if add_style:
        rgba = _add_outline(rgba, thickness=6, color=(255, 255, 255, 255))
        rgba = _add_drop_shadow(
            rgba,
            offset=(10, 10),
            blur_radius=20,
            shadow_color=(0, 0, 0, 80),
        )

    # 4) Save
    out_path.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(out_path)
    print("Saved item:", out_path)
    return out_path


if __name__ == "__main__":
    print("This module provides build_item_from_mask(). "
          "Call it from another script once you have mask PNGs.")
