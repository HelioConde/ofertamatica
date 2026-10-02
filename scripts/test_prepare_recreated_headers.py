import tempfile
import unittest
from pathlib import Path
from PIL import Image
from prepare_recreated_headers import export_panorama


class PanoramaExportTests(unittest.TestCase):
    def test_uniform_scale_and_scenery_crop_preserve_center(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / 'source.png', Path(temp) / 'output.png'
            image = Image.new('RGB', (980, 400), 'red')
            image.paste('blue', (0, 100, 980, 300))
            image.save(source)
            original_bytes = source.read_bytes()
            record = export_panorama(source, output)
            with Image.open(output) as exported:
                self.assertEqual(exported.size, (1960, 400))
                self.assertEqual(exported.getpixel((980, 200)), (0, 0, 255))
            self.assertEqual(record['scale'], 2)
            self.assertEqual(record['scaled_size'], (1960, 800))
            self.assertEqual(record['crop_top'], 200)
            self.assertEqual(source.read_bytes(), original_bytes)

    def test_rejects_short_canvas_instead_of_stretching_or_filling(self):
        with tempfile.TemporaryDirectory() as temp:
            source, output = Path(temp) / 'source.png', Path(temp) / 'output.png'
            Image.new('RGB', (1960, 200), 'green').save(source)
            with self.assertRaises(ValueError):
                export_panorama(source, output)
            self.assertFalse(output.exists())

    def test_rejects_crop_outside_generated_canvas(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / 'source.png'
            Image.new('RGB', (1960, 600)).save(source)
            for top in (-1, 201):
                with self.assertRaises(ValueError):
                    export_panorama(source, Path(temp) / 'output.png', top)


if __name__ == '__main__':
    unittest.main()
