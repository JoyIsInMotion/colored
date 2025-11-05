import io
from typing import Tuple
import numpy as np
import onnxruntime as ort
from PIL import Image
import cv2

# Load the ONNX model once at startup
ORT_SESSION = ort.InferenceSession(
    "model.onnx",
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


def remove_background(image_bytes: bytes) -> bytes:
    """
    Takes image bytes -> runs the ONNX model -> returns PNG bytes with transparency.
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

    out_buf = io.BytesIO()
    rgba.save(out_buf, format="PNG")
    out_buf.seek(0)
    return out_buf.read()