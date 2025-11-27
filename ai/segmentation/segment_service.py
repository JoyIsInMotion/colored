import torch
import cv2
import numpy as np
from pathlib import Path
from segment_anything import sam_model_registry, SamPredictor

from .extract_item import build_item_from_mask


def classify_mask(mask: np.ndarray) -> str:
    """
    Roughly classify a mask as top / bottom / shoes / full_body / accessory
    based on its vertical position and height.
    """
    ys, xs = np.where(mask > 0)
    if len(ys) == 0:
        return "unknown"

    y_min, y_max = ys.min(), ys.max()
    height = mask.shape[0]

    rel_mid = (y_min + y_max) / 2 / height   # 0 = top, 1 = bottom
    rel_size = (y_max - y_min) / height      # how tall the mask is

    if rel_size > 0.8:
        return "full_body"
    elif rel_mid < 0.35:
        return "top"
    elif rel_mid < 0.65:
        return "bottom"
    elif rel_mid > 0.65:
        return "shoes"
    else:
        return "accessory"


def segment_outfit(image_path: str):
    """
    Runs SAM on a full-body photo and extracts each detected region as
    a styled, magazine-ready PNG using build_item_from_mask().
    """
    image_path = Path(image_path).resolve()
    out_dir = image_path.parent / "out_items_auto"
    out_dir.mkdir(exist_ok=True, parents=True)

    # ---- load model ----
    model_path = Path(__file__).resolve().parent / "models" / "sam_vit_h_4b8939.pth"
    sam = sam_model_registry["vit_h"](checkpoint=str(model_path))
    device = "cpu"  # force CPU until your GPU is supported by PyTorch
    sam.to(device=device)

    predictor = SamPredictor(sam)

    # ---- load image ----
    image = cv2.imread(str(image_path))
    if image is None:
        raise FileNotFoundError(f"Could not open {image_path}")
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    predictor.set_image(image_rgb)

    # ---- run segmentation (grid of points) ----
    h, w, _ = image_rgb.shape
    grid_points = []
    step = 200  # adjust to control granularity / number of proposals
    for y in range(step // 2, h, step):
        for x in range(step // 2, w, step):
            grid_points.append([x, y])

    masks = []
    for pt in grid_points:
        input_point = np.array([pt])
        input_label = np.array([1])
        m, scores, _ = predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=True,
        )
        best_mask = m[np.argmax(scores)]
        masks.append(best_mask)

    print(f"Generated {len(masks)} raw masks.")

    # ---- deduplicate overlapping masks ----
    combined_masks: list[np.ndarray] = []
    for m in masks:
        if not combined_masks:
            combined_masks.append(m)
            continue

        overlap = any(
            np.mean(
                cv2.bitwise_and(
                    (m > 0).astype(np.uint8) * 255,
                    (cm > 0).astype(np.uint8) * 255,
                )
            )
            > 5
            for cm in combined_masks
        )
        if not overlap:
            combined_masks.append(m)

    print(f"{len(combined_masks)} unique items detected.")

    # ---- export each item ----
    for i, mask in enumerate(combined_masks):
        label = classify_mask(mask)

        mask_img = (mask * 255).astype(np.uint8)
        mask_path = out_dir / f"{label}_{i}.png"
        cv2.imwrite(str(mask_path), mask_img)

        item_path = out_dir / f"{label}_{i}_styled.png"
        build_item_from_mask(image_path, mask_path, item_path, add_style=True)

    print(f"✅ All items saved to {out_dir}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        img_path = Path(sys.argv[1])
    else:
        img_path = Path(__file__).resolve().parents[2] / "tests" / "images" / "outfit1.jpg"

    segment_outfit(img_path)
