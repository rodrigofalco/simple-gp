#!/usr/bin/env python3
import sys
from PIL import Image

def reduce_png_size(input_path, output_path):
    """Reduce PNG size to half by resizing to 50% dimensions"""
    img = Image.open(input_path)
    new_width = img.width // 2
    new_height = img.height // 2
    resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    resized.save(output_path, 'PNG', optimize=True)
    print(f"Reduced {input_path} -> {output_path} ({img.width}x{img.height} to {new_width}x{new_height})")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reduce_png.py <input.png> <output.png>")
        sys.exit(1)

    reduce_png_size(sys.argv[1], sys.argv[2])
