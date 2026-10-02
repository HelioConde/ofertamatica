"""Regression checks for aspect preservation, protected pixels and edge joins."""
from pathlib import Path
import tempfile
import unittest

from PIL import Image, ImageDraw

from standardize_headers import fingerprint, mirror_texture, output_name, process_image


class HeaderTests(unittest.TestCase):
    def test_protected_pixels_and_originals_at_different_aspect_ratios(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for width, height in [(2172, 724), (1916, 821), (1774, 887), (1672, 941), (4000, 200), (200, 800)]:
                source = root / f'{width}-{height}.png'
                original = Image.new('RGB', (width, height), '#315981')
                draw = ImageDraw.Draw(original)
                draw.rectangle((width // 4, height // 4, 3 * width // 4, 3 * height // 4), fill='#ffcc00')
                original.save(source)
                before = fingerprint(source)
                record = process_image(source, root / f'output-{source.name}')
                self.assertTrue(all(record['checks'].values()))
                self.assertEqual(before, fingerprint(source))
                self.assertGreaterEqual(record['primary_position'][0], 196)
                self.assertLessEqual(record['primary_position'][0] + record['primary_size'][0], 1764)

    def test_transparent_foreground_keeps_exact_composited_pixels(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'transparent.png'
            image = Image.new('RGBA', (900, 300), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((200, 30, 700, 270), fill=(255, 40, 20, 180))
            image.save(source)
            record = process_image(source, root / 'output.png')
            self.assertTrue(record['checks']['protected_region_pixel_exact'])
            self.assertTrue(record['special_treatment'])

    def test_reflected_join_does_not_have_a_color_jump(self):
        edge = Image.new('RGBA', (20, 40))
        for x in range(20):
            edge.paste((x * 10, 50, 80, 255), (x, 0, x + 1, 40))
        left = mirror_texture(edge, 200, True)
        right = mirror_texture(edge, 200, False)
        self.assertEqual(left.getpixel((199, 20)), edge.getpixel((0, 20)))
        self.assertEqual(right.getpixel((0, 20)), edge.getpixel((19, 20)))

    def test_normalized_names(self):
        self.assertEqual(output_name(Path('açougue.png')), 'acougue.png')
        self.assertEqual(output_name(Path('Verão de Ofertas.png')), 'verao-de-ofertas.png')


if __name__ == '__main__':
    unittest.main()
