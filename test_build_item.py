from pathlib import Path
from ai.segmentation.extract_item import build_item_from_mask

def main():
    root = Path(__file__).resolve().parent
    img = root / "tests" / "images" / "outfit1.jpg"
    mask = root / "tests" / "images" / "outfit1_bottom_mask.png"
    out = root / "tests" / "out_items" / "outfit1_bottom.png"

    build_item_from_mask(img, mask, out, add_style=True)

if __name__ == "__main__":
    main()
