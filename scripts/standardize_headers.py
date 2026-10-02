"""Create non-destructive 1960x400 PNG headers using Pillow (no AI or OCR).

The entire original is the protected region: keeping it is safer than guessing
where a campaign's letters end. Only narrow edge textures are reflected outside
that region, never the title or a stretched copy of the foreground.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import unicodedata

from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageStat

SIZE = (1960, 400)
SAFE_X = (196, 1764)
RESAMPLE = Image.Resampling.LANCZOS


def fingerprint(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def detect_original_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        if image.format != 'PNG':
            raise ValueError(f'Not a PNG: {path}')
        return image.size


def calculate_proportional_scale(size: tuple[int, int]) -> tuple[float, tuple[int, int]]:
    width, height = size
    scale = min(SIZE[1] / height, (SAFE_X[1] - SAFE_X[0]) / width)
    # Raster dimensions are integers; rounding introduces at most one pixel of
    # rounding, not independent horizontal/vertical scaling.
    return scale, (max(1, round(width * scale)), max(1, round(height * scale)))


def create_canvas(color: tuple[int, int, int, int]) -> Image.Image:
    return Image.new('RGBA', SIZE, color)


def preserve_central_region(original: Image.Image, size: tuple[int, int]) -> Image.Image:
    # No crop, segmentation, sharpening, or changes to lettering.
    return original.convert('RGBA').resize(size, RESAMPLE)


def neutral_color(image: Image.Image) -> tuple[int, int, int, int]:
    rgba = image.convert('RGBA')
    mean = ImageStat.Stat(rgba.convert('RGB'), rgba.getchannel('A')).mean
    return tuple(round(value) for value in mean) + (255,)


def mirror_texture(edge: Image.Image, width: int, outer_on_left: bool) -> Image.Image:
    """Reflect a narrow edge repeatedly; nearest seam is an exact reflection.

    A mild blur grows away from the seam, suppressing visible repetitions while
    leaving the protected foreground untouched. No resized full-image background
    is used, so giant blurred campaign names are not introduced behind the art.
    """
    if width == 0:
        return Image.new('RGBA', (1, edge.height))
    result = Image.new('RGBA', (width, edge.height))
    for start in range(0, width, edge.width):
        tile = ImageOps.mirror(edge) if (start // edge.width) % 2 == 0 else edge
        if outer_on_left:
            right = width - start
            left = max(0, right - edge.width)
            result.paste(tile.crop((edge.width - (right - left), 0, edge.width, edge.height)), (left, 0))
        else:
            result.paste(tile.crop((0, 0, min(edge.width, width - start), edge.height)), (start, 0))
    blurred = result.filter(ImageFilter.GaussianBlur(12))
    ramp = Image.new('L', (width, 1))
    ramp.putdata([round(255 * min(1, ((width - 1 - x) if outer_on_left else x) / 96)) for x in range(width)])
    mask = ramp.resize((width, edge.height))
    return Image.composite(blurred, result, mask)


def extend_lateral_background(canvas: Image.Image, primary: Image.Image, position: tuple[int, int]) -> None:
    x, y = position
    band = max(1, min(96, round(primary.width * 0.08)))
    left = mirror_texture(primary.crop((0, 0, band, primary.height)), x, True)
    right_width = SIZE[0] - x - primary.width
    right = mirror_texture(primary.crop((primary.width - band, 0, primary.width, primary.height)), right_width, False)
    canvas.alpha_composite(left, (0, y))
    canvas.alpha_composite(right, (x + primary.width, y))
    # For unusually wide inputs, the width limit can leave top/bottom space.
    # Continue edge colors vertically without cropping or stretching the art.
    edge_source = canvas.copy()
    edge_source.alpha_composite(primary, position)
    if y:
        top = edge_source.crop((0, y, SIZE[0], y + 1)).resize((SIZE[0], y))
        canvas.paste(top, (0, 0))
    bottom_y = y + primary.height
    if bottom_y < SIZE[1]:
        bottom = edge_source.crop((0, bottom_y - 1, SIZE[0], bottom_y)).resize((SIZE[0], SIZE[1] - bottom_y))
        canvas.paste(bottom, (0, bottom_y))


def compose_original(canvas: Image.Image, primary: Image.Image, position: tuple[int, int]) -> Image.Image:
    result = canvas.copy()
    result.alpha_composite(primary, position)
    return result


def export_png(image: Image.Image, destination: Path) -> None:
    image.convert('RGB').save(destination, format='PNG', optimize=True)


def output_name(path: Path) -> str:
    ascii_name = unicodedata.normalize('NFKD', path.stem).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', ascii_name).strip('-') + '.png'


def process_image(source: Path, output: Path) -> dict:
    before = fingerprint(source)
    source_size = detect_original_size(source)
    scale, target_size = calculate_proportional_scale(source_size)
    with Image.open(source) as original:
        primary = preserve_central_region(original, target_size)
        transparency = original.convert('RGBA').getchannel('A').getextrema()[0] < 255
    position = ((SIZE[0] - primary.width) // 2, (SIZE[1] - primary.height) // 2)
    canvas = create_canvas(neutral_color(primary))
    extend_lateral_background(canvas, primary, position)
    result = compose_original(canvas, primary, position)
    export_png(result, output)
    x, y = position
    expected = canvas.crop((x, y, x + primary.width, y + primary.height))
    expected.alpha_composite(primary)
    with Image.open(output) as exported:
        actual = exported.crop((x, y, x + primary.width, y + primary.height)).convert('RGB')
        checks = {
            'dimensions_1960x400': exported.size == SIZE,
            'format_png': exported.format == 'PNG',
            'nonempty': exported.getbbox() is not None and output.stat().st_size > 0,
            'original_unchanged': before == fingerprint(source),
            'whole_original_in_safe_area': x >= SAFE_X[0] and x + primary.width <= SAFE_X[1],
            'uniform_scale_with_pixel_rounding': abs(target_size[0] - source_size[0] * scale) < 1.001 and abs(target_size[1] - source_size[1] * scale) < 1.001,
            'protected_region_pixel_exact': ImageChops.difference(actual, expected.convert('RGB')).getbbox() is None,
        }
    if not all(checks.values()):
        raise ValueError(f'Validation failed for {source.name}: {checks}')
    return {
        'source': source.name, 'output': output.name, 'original_size': source_size,
        'output_size': SIZE, 'scale': scale, 'primary_size': target_size,
        'primary_position': position, 'original_sha256': before,
        'output_sha256': fingerprint(output), 'checks': checks,
        'special_treatment': (['transparent input composited on matching background'] if transparency else []) +
            (['width-limited input; top/bottom background extension'] if target_size[1] < SIZE[1] else []),
    }


def write_preview(output_dir: Path, records: list[dict]) -> None:
    cards = '\n'.join(
        f'<figure><figcaption>{html.escape(r["output"])} <small>original: {html.escape(r["source"])}</small></figcaption>'
        f'<div class="art"><img src="{html.escape(r["output"])}" width="1960" height="400" alt="{html.escape(r["source"])}" loading="lazy"><span class="safe" aria-hidden="true"></span></div></figure>'
        for r in records
    )
    document = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ofertamática — headers padronizados</title><style>
body{{margin:24px auto;padding:0 16px;max-width:1200px;font-family:Arial,sans-serif;background:#f1f3f6;color:#202938}}
h1{{font-size:24px}}p{{line-height:1.5}}figure{{margin:24px 0;padding:12px;background:white;border-radius:8px}}
figcaption{{margin-bottom:8px;font-weight:bold}}small{{font-weight:normal;color:#596474}}.art{{position:relative}}img{{display:block;width:100%;height:auto}}
.safe{{display:none;position:absolute;inset:0 10%;border-left:1px dashed white;border-right:1px dashed white;pointer-events:none}}
body:has(#safe:checked) .safe{{display:block}}a{{color:#1757ad}}
</style></head><body><h1>{len(records)} headers · 1960 × 400 px</h1>
<p>Originais preservados. Arte completa com escala proporcional; fundo lateral espelhado e suavizado.
<a href="validation.json">Relatório de validação</a>.</p>
<label><input id="safe" type="checkbox"> Mostrar limites da área segura (10%–90%)</label>
{cards}</body></html>'''
    (output_dir / 'preview.html').write_text(document, encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1] / 'img')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    source_dir = args.source.resolve()
    output_dir = (args.output or source_dir / 'headers').resolve()
    if output_dir == source_dir:
        parser.error('Output must differ from source; originals cannot be overwritten.')
    sources = sorted(source_dir.glob('*.png'), key=lambda p: p.name.casefold())
    if not sources:
        parser.error('No source PNG files found.')
    names = [output_name(p) for p in sources]
    if len(set(names)) != len(names):
        parser.error('Normalized filenames collide; resolve names before processing.')
    originals = {p.name: fingerprint(p) for p in sources}
    output_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for source, name in zip(sources, names):
        records.append(process_image(source, output_dir / name))
    assert originals == {p.name: fingerprint(p) for p in sources}, 'An original was modified'
    assert len(records) == len(sources)
    report = {'processed': len(records), 'size': SIZE, 'safe_x': SAFE_X,
              'method': 'whole-original proportional fit + reflected narrow edge textures; background-only blur',
              'semantic_text_detection': False, 'records': records}
    (output_dir / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    write_preview(output_dir, records)
    print(f'Processed {len(records)} PNGs. All automatic checks passed. Preview: {output_dir / "preview.html"}')
    print('Special treatments:', {r['source']: r['special_treatment'] for r in records if r['special_treatment']})


if __name__ == '__main__':
    main()
