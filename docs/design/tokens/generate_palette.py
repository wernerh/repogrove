#!/usr/bin/env python3
"""RepoGrove design-lane palette generator + WCAG 2.1 contrast validator.

This is the reproducible source for every color value and contrast ratio quoted in
DESIGN-SYSTEM.md — it is not wired into CI or app code (there is no app yet), it exists
so the token values in that doc can be regenerated and re-checked rather than trusted on
faith. Re-run this whenever a color token changes.

Requires: pip install --break-system-packages coloraide (not an app runtime dependency —
a design-lane authoring tool only, same category as a Figma plugin would be).

Usage: python3 docs/design/tokens/generate_palette.py
"""
from __future__ import annotations

from coloraide import Color

AA_TEXT_MIN = 4.5
AA_UI_MIN = 3.0


def hexof(oklch: str) -> str:
    return Color(oklch).convert("srgb").to_string(hex=True)


def contrast(fg: str, bg: str) -> float:
    return Color(fg).contrast(Color(bg), method="wcag21")


def build_neutral_scale(hue: int) -> dict[int, tuple[float, float, str]]:
    steps = {
        0: (99, 0.001), 10: (96, 0.003), 20: (91, 0.004), 30: (84, 0.006),
        40: (74, 0.008), 50: (62, 0.010), 60: (50, 0.010), 70: (40, 0.009),
        80: (30, 0.008), 90: (20, 0.006), 100: (12, 0.004),
    }
    out = {}
    for step, (light, chroma) in steps.items():
        h = hexof(f"oklch({light}% {chroma} {hue})")
        out[step] = (light, chroma, h)
    return out


def build_brand_scale(hue: int) -> dict[int, tuple[float, float, str]]:
    steps = {
        10: (95, 0.03), 20: (88, 0.05), 30: (80, 0.07), 40: (70, 0.10),
        50: (58, 0.13), 60: (48, 0.13), 70: (38, 0.11), 80: (28, 0.09), 90: (18, 0.06),
    }
    out = {}
    for step, (light, chroma) in steps.items():
        h = hexof(f"oklch({light}% {chroma} {hue})")
        out[step] = (light, chroma, h)
    return out


def solve_text_color(hue: float, light: float, chroma: float, bg_hex: str,
                      min_ratio: float, chroma_scale: float = 1.0,
                      max_light: float = 95) -> tuple[float, float, str, float]:
    """Raise lightness (preserving hue, scaling chroma) until contrast clears min_ratio."""
    c = round(chroma * chroma_scale, 3)
    lit = light
    hex_val = hexof(f"oklch({lit}% {c} {hue})")
    ratio = contrast(hex_val, bg_hex)
    while ratio < min_ratio and lit <= max_light:
        lit += 1
        hex_val = hexof(f"oklch({lit}% {c} {hue})")
        ratio = contrast(hex_val, bg_hex)
    return lit, c, hex_val, ratio


def main() -> None:
    neutral = build_neutral_scale(220)
    brand = build_brand_scale(205)
    bg_light = neutral[0][2]
    bg_dark = neutral[90][2]

    print("=== Neutral scale (hue 220) ===")
    for step, (l, c, h) in neutral.items():
        print(f"neutral-{step:<3} oklch({l}% {c} 220) -> {h}")

    print("\n=== Brand scale (hue 205, 'deep pond') ===")
    for step, (l, c, h) in brand.items():
        print(f"brand-{step:<3} oklch({l}% {c} 205) -> {h}")

    # Semantic + momentum base recipes (light mode), solved to clear AA_TEXT_MIN.
    recipes = [
        ("success", 145, 50, 0.16),
        ("warning", 75, 55, 0.16),
        ("error", 25, 52, 0.18),
        ("info", 240, 52, 0.14),
        ("rising", 45, 55, 0.17),
        ("active", 145, 45, 0.15),
        ("slowing", 75, 55, 0.16),
    ]

    print(f"\n=== Semantic + momentum text — light mode (bg {bg_light}) ===")
    light_results = {}
    for name, hue, light, chroma in recipes:
        l, c, h, r = solve_text_color(hue, light, chroma, bg_light, AA_TEXT_MIN)
        light_results[name] = (hue, l, c, h, r)
        print(f"{name:8} oklch({l}% {c} {hue}) -> {h}  {r:.2f}:1")

    print(f"\n=== Semantic + momentum text — dark mode (bg {bg_dark}) ===")
    for name, (hue, l0, c0, h0, r0) in light_results.items():
        l, c, h, r = solve_text_color(hue, l0, c0, bg_dark, AA_TEXT_MIN + 0.1,
                                       chroma_scale=0.92)
        print(f"{name:8} oklch({l}% {c} {hue}) -> {h}  {r:.2f}:1")

    print("\n=== Border tokens (need AA_UI_MIN 3:1 vs. their bg) ===")
    border_light = neutral[50]
    print(f"border.default light = neutral-50 {border_light[2]} "
          f"vs bg-light {bg_light}: {contrast(border_light[2], bg_light):.2f}:1")
    border_dark = neutral[60]
    print(f"border.default dark  = neutral-60 {border_dark[2]} "
          f"vs bg-dark {bg_dark}: {contrast(border_dark[2], bg_dark):.2f}:1")

    print("\n=== Core text/surface pairs ===")
    pairs = [
        ("text.default light", neutral[90][2], bg_light),
        ("text.default dark", neutral[10][2], bg_dark),
        ("text.secondary light", neutral[60][2], bg_light),
        ("text.secondary dark", neutral[40][2], bg_dark),
        ("text.brand light", brand[70][2], bg_light),
        ("text.brand dark", brand[30][2], bg_dark),
        ("cta white-on-fill light (brand-60)", "#ffffff", brand[60][2]),
        ("cta white-on-fill dark (brand-40, text flips to dark text)",
         neutral[90][2], brand[40][2]),
    ]
    for label, fg, bg in pairs:
        print(f"{label}: {fg} on {bg} = {contrast(fg, bg):.2f}:1")


if __name__ == "__main__":
    main()
