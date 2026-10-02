"""Export reviewed AI panoramas with uniform scale and a vertical scenery trim.

The input manifest references locally generated artwork, not the original PNGs.
Originals are identity references and must remain unchanged. No image generation,
mirroring, blur fill, stretching, or lettering edits occur in this exporter.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image
from standardize_headers import fingerprint, output_name

SIZE = (1960, 400)


def export_panorama(generated: Path, output: Path, crop_top: int | None = None) -> dict:
    with Image.open(generated) as image:
        source_size = image.size
        scale = SIZE[0] / image.width
        scaled_size = (SIZE[0], round(image.height * scale))
        top = (scaled_size[1] - SIZE[1]) // 2 if crop_top is None else crop_top
        if scaled_size[1] < SIZE[1] or not 0 <= top <= scaled_size[1] - SIZE[1]:
            raise ValueError(f'Invalid panoramic crop: {generated.name}')
        result = image.convert('RGB').resize(scaled_size, Image.Resampling.LANCZOS)
        result = result.crop((0, top, SIZE[0], top + SIZE[1]))
        result.save(output, format='PNG', optimize=True)
    with Image.open(output) as exported:
        if exported.size != SIZE or exported.format != 'PNG':
            raise ValueError(f'Invalid exported PNG: {output.name}')
    return {'generated_size': source_size, 'scale': scale, 'scaled_size': scaled_size,
            'crop_top': top, 'output_size': SIZE, 'output_sha256': fingerprint(output)}


def write_preview(output: Path, records: list[dict]) -> None:
    import html
    cards = '\n'.join(f'<figure><figcaption>{html.escape(r["source"])}</figcaption>'
        f'<a href="{r["output"]}"><img src="{r["output"]}" width="1960" height="400" '
        f'alt="{html.escape(r["source"])}" loading="lazy"></a></figure>' for r in records)
    document = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ofertamática — artes panorâmicas</title><style>
body{{max-width:1400px;margin:24px auto;padding:0 16px;background:#f1f3f6;color:#202938;font:16px Arial}}
figure{{margin:24px 0;padding:12px;background:white;border-radius:8px}}figcaption{{margin-bottom:8px;font-weight:bold}}
img{{display:block;width:100%;height:auto}}a{{color:#1757ad}}</style></head><body>
<h1>{len(records)} artes panorâmicas · 1960 × 400 px</h1>
<p>Composições recriadas com IA a partir da identidade dos originais. Títulos revisados visualmente.
Laterais naturais, sem espelhamento ou preenchimento borrado. Clique na arte para abrir o PNG.
<a href="validation.json">Relatório de dimensões e preservação dos originais</a>.</p>
{cards}</body></html>'''
    (output / 'preview.html').write_text(document, encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1] / 'img')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    output = (args.output or source / 'headers').resolve()
    if output == source:
        parser.error('Output cannot overwrite original images.')
    entries = json.loads(args.manifest.read_text(encoding='utf-8'))
    originals = {p.stem: p for p in source.glob('*.png')}
    if len(entries) != len(originals) or {r['name'] for r in entries} != set(originals):
        parser.error('Manifest must include each original exactly once.')
    if not all(r.get('visually_reviewed') for r in entries):
        parser.error('Every final panorama requires visual review before export.')
    hashes = {name: fingerprint(path) for name, path in originals.items()}
    previous_report = output / 'validation.json'
    if previous_report.exists():
        previous = json.loads(previous_report.read_text(encoding='utf-8'))
        for r in previous.get('records', []):
            if hashes.get(Path(r['source']).stem) != r['original_sha256']:
                parser.error(f'Original changed since previous validation: {r["source"]}')
    # Preflight every generated file before replacing any existing header.
    for r in entries:
        with Image.open(r['generated']) as image:
            image.verify()
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for r in sorted(entries, key=lambda item: item['name'].casefold()):
        original = originals[r['name']]
        filename = output_name(original)
        details = export_panorama(Path(r['generated']), output / filename, r.get('crop_top'))
        records.append({'source': original.name, 'output': filename,
                        'original_sha256': hashes[r['name']], 'visually_reviewed': True,
                        'generated_asset_id': Path(r['generated']).name, **details})
    if hashes != {name: fingerprint(path) for name, path in originals.items()}:
        raise ValueError('Original images changed during export.')
    report = {'method': 'generative-panorama', 'processed': len(records), 'size': SIZE,
              'originals_preserved': True, 'export': 'uniform scaling + vertical scenery crop',
              'semantic_text_detection': False, 'records': records}
    (output / 'validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    write_preview(output, records)
    print(f'Exported {len(records)} reviewed panoramas. Original hashes unchanged.')


if __name__ == '__main__':
    main()
