"""Generate compressed web assets (run once after logo changes)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

LOGO = ROOT / "logo weidlerstudio.png"
if not LOGO.exists():
    LOGO = ROOT / "logoweidlerstudio.png"
ICON = ROOT / "icone weidler studio.png"
KIOS = ROOT / "kios-pure-world.png"
CRIBLE = ROOT / "assets" / "cribleplus.png"
if not CRIBLE.exists():
    CRIBLE = ROOT / "assets" / "cribleplus.png"


def save_webp(img: Image.Image, path: Path, quality: int = 82) -> None:
    img.save(path, "WEBP", quality=quality, method=6)


def save_png(img: Image.Image, path: Path) -> None:
    img.save(path, "PNG", optimize=True)


def resize_contain(src: Path, max_px: int) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    img.thumbnail((max_px, max_px), Image.Resampling.LANCZOS)
    return img


def main() -> None:
    # Favicon + nav (small)
    icon_src = ICON if ICON.exists() else LOGO
    nav = resize_contain(icon_src, 72)
    save_png(nav, ASSETS / "logo-nav.png")

    fav = resize_contain(icon_src, 48)
    save_png(fav, ASSETS / "favicon.png")

    # Hero logo
    hero = resize_contain(LOGO, 640)
    save_webp(hero, ASSETS / "logo-hero.webp")
    save_png(hero, ASSETS / "logo-hero.png")

    # Kios preview
    if KIOS.exists():
        kios = Image.open(KIOS).convert("RGB")
        kios.thumbnail((960, 960), Image.Resampling.LANCZOS)
        save_webp(kios, ASSETS / "kios-pure-world.webp", quality=80)
        kios.save(ASSETS / "kios-pure-world.jpg", "JPEG", quality=82, optimize=True)

    # Crible+ preview
    if CRIBLE.exists():
        cp = Image.open(CRIBLE).convert("RGBA")
        cp.thumbnail((512, 512), Image.Resampling.LANCZOS)
        save_webp(cp, ASSETS / "cribleplus-preview.webp")
        save_png(cp, ASSETS / "cribleplus-preview.png")

    for p in sorted(ASSETS.glob("*")):
        if p.is_file():
            print(f"  {p.name}: {p.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
    print("Done.")
