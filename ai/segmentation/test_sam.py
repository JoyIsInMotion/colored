import torch
import cv2
import numpy as np
from pathlib import Path
from segment_anything import sam_model_registry, SamPredictor

def test_sam():
    model_path = Path(__file__).resolve().parent / "models" / "sam_vit_h_4b8939.pth"
    sam = sam_model_registry["vit_h"](checkpoint=str(model_path))
    device = "cpu"  # force CPU for now
    sam.to(device=device)


    predictor = SamPredictor(sam)

    # Test image
    img_path = Path(__file__).resolve().parent / "../../tests/images/outfit1.jpg"
    image = cv2.imread(str(img_path))
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    predictor.set_image(image_rgb)

    h, w, _ = image_rgb.shape
    input_point = np.array([[w // 2, h // 2]])  # roughly center
    input_label = np.array([1])

    masks, scores, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True
    )

    print(f"Generated {len(masks)} masks, scores: {scores}")

    out_dir = Path(__file__).resolve().parent / "outputs"
    out_dir.mkdir(exist_ok=True, parents=True)

    for i, mask in enumerate(masks):
        mask_img = (mask * 255).astype(np.uint8)
        out_path = out_dir / f"mask_{i}.png"
        cv2.imwrite(str(out_path), mask_img)
        print("Saved", out_path)

if __name__ == "__main__":
    test_sam()
