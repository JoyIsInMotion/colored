from pathlib import Path

import io
from typing import Tuple
import numpy as np
import onnxruntime as ort
from PIL import  Image, ImageFilter, ImageChops
import cv2



CANVAS_SIZE = (1024, 1024)
SHADOW_STYLE = "magazine"  # "magazine", "soft", "ground", "none"

# Load the ONNX model once at startup
MODEL_PATH = Path(__file__).with_name("model.onnx")

ORT_SESSION = ort.InferenceSession(
    str(MODEL_PATH),
    providers=["CPUExecutionProvider"]
)


def _preprocess_image(img: Image.Image, target_size: Tuple[int, int] = (1800, 1200)) -> np.ndarray:
    """Convert PIL image to normalized tensor expected by the model."""
    if img.mode != "RGB":
        img = img.convert("RGB")

    # PIL expects size as (width, height)
    img = img.resize(target_size, Image.BILINEAR)

    arr = np.array(img).astype("float32") / 255.0  # H x W x C
    arr = np.transpose(arr, (2, 0, 1))            # -> C x H x W
    arr = np.expand_dims(arr, axis=0)             # -> 1 x C x H x W
    return arr



def _postprocess_mask(mask: np.ndarray, orig_size: Tuple[int, int]) -> np.ndarray:
    """
    Convert raw model mask to a clean uint8 alpha mask:
    - normalize 0..255
    - resize to original size
    - smooth
    - hard threshold + morphology to kill noise
    """
    # squeeze batch/channel dims
    mask = mask.squeeze()

    # normalize 0..1
    m_min = float(mask.min())
    m_max = float(mask.max())
    mask = (mask - m_min) / ((m_max - m_min) + 1e-8)

    # to 0..255 uint8
    mask = (mask * 255).astype("uint8")

    # resize to original image size
    orig_w, orig_h = orig_size
    mask = cv2.resize(mask, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)

    # smooth edges
    mask = cv2.GaussianBlur(mask, (5, 5), 0)

    # hard threshold – tune 200–240 depending on how aggressive you want
    _, mask = cv2.threshold(mask, 230, 255, cv2.THRESH_BINARY)

    # morphology: close gaps, remove small holes
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # slight dilation so we don't eat into the clothing
    mask = cv2.dilate(mask, kernel, iterations=1)
    #erode a single pixel border 
    mask = cv2.erode(mask, kernel, iterations=1)




    return mask

def _crop_to_object(rgba: Image.Image, margin_ratio: float = 0.05) -> Image.Image:
    """
    Crop the image to the non-transparent area of the alpha channel,
    with a small margin around the object.
    """
    if rgba.mode != "RGBA":
        rgba = rgba.convert("RGBA")

    alpha = np.array(rgba.split()[-1])  # H x W
    ys, xs = np.where(alpha > 0)

    # If mask is empty (edge case), just return original
    if xs.size == 0 or ys.size == 0:
        return rgba

    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()

    # Add margin as a percentage of bbox size
    bbox_w = x_max - x_min + 1
    bbox_h = y_max - y_min + 1

    mx = int(bbox_w * margin_ratio)
    my = int(bbox_h * margin_ratio)

    x_min = max(0, x_min - mx)
    y_min = max(0, y_min - my)
    x_max = min(rgba.width - 1, x_max + mx)
    y_max = min(rgba.height - 1, y_max + my)

    # right/lower are exclusive, so +1
    return rgba.crop((x_min, y_min, x_max + 1, y_max + 1))


def _fit_on_canvas(
    rgba: Image.Image,
    canvas_size: Tuple[int, int] = CANVAS_SIZE,
    padding: int = 40
) -> Image.Image:
    """
    Put the cropped item onto a fixed-size transparent canvas,
    keeping aspect ratio and centering it.
    """
    if rgba.mode != "RGBA":
        rgba = rgba.convert("RGBA")

    canvas_w, canvas_h = canvas_size
    item_w, item_h = rgba.size

    # Available size after padding
    avail_w = max(1, canvas_w - 2 * padding)
    avail_h = max(1, canvas_h - 2 * padding)

    # Scale item to fit within available area
    scale = min(avail_w / item_w, avail_h / item_h, 1.0)
    new_w = max(1, int(item_w * scale))
    new_h = max(1, int(item_h * scale))

    resized = rgba.resize((new_w, new_h), Image.LANCZOS)

    # Create transparent canvas
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    # Center on canvas
    offset_x = (canvas_w - new_w) // 2
    offset_y = (canvas_h - new_h) // 2

    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas

def _add_outline(
    rgba: Image.Image,
    thickness: int = 6,
    color=(255, 255, 255, 255)
) -> Image.Image:
    """
    Add a "magazine cutout" outline around the item using its alpha.
    """
    if rgba.mode != "RGBA":
        rgba = rgba.convert("RGBA")

    alpha = rgba.split()[-1]

    # Grow the alpha mask `thickness` times
    outline = alpha.copy()
    for _ in range(thickness):
        outline = outline.filter(ImageFilter.MaxFilter(3))

    # Outline is the grown area minus original alpha
    outline_only = ImageChops.subtract(outline, alpha)

    outline_img = Image.new("RGBA", rgba.size, color)
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))

    # Paste outline where outline_only has alpha
    out.paste(outline_img, mask=outline_only)
    # Then paste original item on top
    out.paste(rgba, mask=alpha)
    return out


def _add_drop_shadow(
    rgba: Image.Image,
    offset=(15, 15),
    blur_radius=20,
    shadow_color=(0, 0, 0, 80)
) -> Image.Image:
    """
    Adds a soft drop shadow behind the object.
    """
    if rgba.mode != "RGBA":
        rgba = rgba.convert("RGBA")

    shadow = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    alpha = rgba.split()[-1]

    shadow_layer = Image.new("RGBA", rgba.size, shadow_color)
    shadow.paste(shadow_layer, mask=alpha)

    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_radius))

    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    out.paste(shadow, offset, shadow)
    out.paste(rgba, (0, 0), rgba)
    return out


def _add_ground_shadow(
    rgba: Image.Image,
    intensity: float = 0.5,
    spread: float = 0.4
) -> Image.Image:
    """
    Create a "ground" shadow under the item.
    """
    if rgba.mode != "RGBA":
        rgba = rgba.convert("RGBA")

    arr = np.array(rgba)
    h, w = arr.shape[:2]
    alpha = arr[:, :, 3] / 255.0

    shadow = np.zeros_like(alpha)
    max_shift = int(h * spread)
    for i in range(1, max_shift):
        shifted = np.roll(alpha, i, axis=0)
        shifted[:i, :] = 0
        shadow += shifted * (1 - i / max_shift)

    shadow = np.clip(shadow * intensity, 0, 1)

    shadow_rgba = np.zeros_like(arr)
    shadow_rgba[:, :, 0:3] = 0
    shadow_rgba[:, :, 3] = (shadow * 255).astype(np.uint8)

    shadow_img = Image.fromarray(shadow_rgba, "RGBA")
    out = Image.alpha_composite(shadow_img, rgba)
    return out


def remove_background(image_bytes: bytes) -> bytes:
    """
    Takes image bytes -> runs the ONNX model -> returns PNG bytes with transparency,
    cropped and canvas-fitted, with optional shadow/outline style.
    """
    img = Image.open(io.BytesIO(image_bytes))
    orig_size = img.size

    input_tensor = _preprocess_image(img)
    input_name = ORT_SESSION.get_inputs()[0].name
    outputs = ORT_SESSION.run(None, {input_name: input_tensor})
    mask = outputs[0]

    alpha = _postprocess_mask(mask, orig_size)

    if img.mode != "RGB":
        img = img.convert("RGB")
    r, g, b = img.split()
    rgba = Image.merge("RGBA", (r, g, b, Image.fromarray(alpha)))

    # Normalize for layout
    rgba = _crop_to_object(rgba, margin_ratio=0.05)
    rgba = _fit_on_canvas(rgba, canvas_size=CANVAS_SIZE, padding=40)

    # Apply style
    if SHADOW_STYLE == "magazine":
        # white outline + subtle shadow
        rgba = _add_outline(rgba, thickness=6, color=(255, 255, 255, 255))
        rgba = _add_drop_shadow(rgba, offset=(10, 10), blur_radius=20, shadow_color=(0, 0, 0, 80))
    elif SHADOW_STYLE == "soft":
        rgba = _add_drop_shadow(rgba, offset=(10, 10), blur_radius=20, shadow_color=(0, 0, 0, 80))
    elif SHADOW_STYLE == "ground":
        rgba = _add_ground_shadow(rgba, intensity=0.6, spread=0.4)
    else:
        # "none" -> no extra styling
        pass

    out_buf = io.BytesIO()
    rgba.save(out_buf, format="PNG")
    out_buf.seek(0)
    return out_buf.read()