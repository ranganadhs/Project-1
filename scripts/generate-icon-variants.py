#!/usr/bin/env python3
"""
Derives the iOS dark and tinted app-icon variants from assets/icon.png.

WHY THIS EXISTS
iOS 18+ shows three icons: light, dark, and tinted. Given only `light`, the
system derives the other two itself — and it derives `tinted` from LUMINANCE,
so artwork on a light plate becomes a near-solid pale tile with the mark barely
visible. Supplying them is the difference between a considered icon and a
washed one.

WHAT EXPO DOES WITH THEM
From @expo/prebuild-config, plugins/icons/withIosIcons.js:

    removeTransparency: appearance !== 'dark',
    backgroundColor:    appearance !== 'dark' ? '#ffffff' : undefined

So `dark` keeps its alpha and iOS composites its own backdrop behind it, while
`light` and `tinted` are FLATTENED ONTO WHITE. The tinted output below is
therefore fully opaque — a dark plate carrying a light glyph — so Expo's forced
white never shows and luminance carries the mark.

NEVER PRE-ROUND THE SOURCE
Both platforms apply their own corner mask. Rounding the artwork yourself puts
your corners inside theirs, with visible double corners and transparent slivers.
assets/icon.png must stay a full-bleed square.

LIMITATION
Assumes the source is artwork on a SOLID plate, which is the common case. An
icon with a photographic or gradient background should have its dark and tinted
variants drawn by hand — check the output before trusting it.

Usage: pnpm icons
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SIZE = 1024

# How sharply opacity climbs away from the plate colour. Higher makes the mark's
# anti-aliased edge more opaque; too high and the plate itself starts to show.
EDGE_GAIN = 3


def plate_colour(im: Image.Image) -> tuple[int, int, int]:
    """The four corners agree on the plate colour for any centred mark."""
    w, h = im.size
    samples = [im.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    return tuple(sum(s[i] for s in samples) // len(samples) for i in range(3))


def alpha_from_plate(im: Image.Image, plate: tuple[int, int, int]) -> Image.Image:
    """
    Opacity as distance from the plate colour.

    A pixel that IS the plate becomes fully transparent; one maximally unlike it
    stays opaque. Anti-aliased edges land in between, which is what stops the
    mark growing a hard fringe where it met the plate.
    """
    diff = ImageChops.difference(im, Image.new("RGB", im.size, plate))
    r, g, b = diff.split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b).point(
        lambda p: min(255, p * EDGE_GAIN)
    )


def main() -> None:
    source = ASSETS / "icon.png"
    if not source.exists():
        raise SystemExit(f"missing {source} — the light icon is the input, not an output")

    src = Image.open(source).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    plate = plate_colour(src)
    alpha = alpha_from_plate(src, plate)

    # DARK — the artwork on transparency. iOS supplies the backdrop, so shipping
    # our own plate here would sit a bright tile inside the system's dark one.
    dark = src.convert("RGBA")
    dark.putalpha(alpha)
    dark.save(ASSETS / "ios-icon-dark.png")

    # TINTED — OPAQUE, because Expo flattens this one onto white.
    #
    # iOS builds its tint from LUMINANCE: brighter pixels take more ink. So the
    # mark has to end up bright and everything else dark.
    #
    # Three steps, and the order matters:
    #   1. luminance, NOT inverted — it preserves relative brightness INSIDE the
    #      mark, which is what keeps a two-tone logo legible. For a mark that is
    #      a coloured disc carrying a lighter glyph, inverting makes the DISC the
    #      ink and punches the glyph out as a hole — the opposite of the
    #      identity.
    #   2. multiply by the alpha mask, which drops the plate to black however
    #      light it was. This is what stops a white plate reading as solid ink.
    #   3. autocontrast, to stretch what survives across the full range —
    #      without it a mid-tone mark yields a grey-on-grey tile with no read.
    #
    # Handles both shapes: a single-tone mark becomes
    # a bright glyph on black, and a two-tone one keeps its internal contrast,
    # so the brighter element stays the ink.
    gray = src.convert("L")
    tinted = ImageOps.autocontrast(ImageChops.multiply(gray, alpha)).convert("RGB")
    tinted.save(ASSETS / "ios-icon-tinted.png")

    coverage = sum(alpha.getdata()) / (SIZE * SIZE * 255)
    print(f"plate {plate}  mark covers {coverage:.1%} of the canvas")
    print("wrote ios-icon-dark.png, ios-icon-tinted.png — open both before trusting them")


if __name__ == "__main__":
    main()
