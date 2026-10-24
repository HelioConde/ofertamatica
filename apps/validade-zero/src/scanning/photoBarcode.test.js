import { decodeBarcodeFromImageElement, readBarcodeFromPhoto } from './photoBarcode';
import { loadBrowserScript } from './loader';

jest.mock('./loader', () => ({
  ZXING_CDN: 'https://test.invalid/zxing.js',
  loadBrowserScript: jest.fn()
}));

afterEach(() => {
  delete window.BarcodeDetector;
  jest.clearAllMocks();
});

test('prefere BarcodeDetector nativo quando lê um EAN válido na foto', async () => {
  window.BarcodeDetector = class {
    static getSupportedFormats = async () => ['ean_13'];
    detect = async () => [{ rawValue: '7894900102960' }];
  };
  expect(await decodeBarcodeFromImageElement({ naturalWidth: 400, naturalHeight: 600 }))
    .toBe('7894900102960');
  expect(loadBrowserScript).not.toHaveBeenCalled();
});

test('usa ZXing quando o detector nativo não funciona', async () => {
  window.BarcodeDetector = class {
    static getSupportedFormats = async () => ['ean_13'];
    detect = async () => { throw new Error('unsupported image'); };
  };
  const decodeFromImageElement = jest.fn().mockResolvedValue({ getText: () => '7894900102960' });
  loadBrowserScript.mockResolvedValue({
    BrowserMultiFormatReader: class { decodeFromImageElement = decodeFromImageElement; }
  });
  const result = await decodeBarcodeFromImageElement({ naturalWidth: 700, naturalHeight: 600 });
  expect(result).toBe('7894900102960');
  expect(decodeFromImageElement).toHaveBeenCalledTimes(1);
});

test('tenta foto girada quando o EAN está na vertical', async () => {
  const decodeFromImageElement = jest.fn().mockRejectedValue(new Error('not found'));
  const decodeFromCanvas = jest.fn().mockReturnValue({ getText: () => '7894900102960' });
  loadBrowserScript.mockResolvedValue({
    BrowserMultiFormatReader: class {
      decodeFromImageElement = decodeFromImageElement;
      decodeFromCanvas = decodeFromCanvas;
    }
  });
  const ctx = { save: jest.fn(), translate: jest.fn(), rotate: jest.fn(),
    drawImage: jest.fn(), restore: jest.fn() };
  const spy = jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(ctx);
  try {
    expect(await decodeBarcodeFromImageElement({ naturalWidth: 1200, naturalHeight: 1600 }))
      .toBe('7894900102960');
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(decodeFromCanvas).toHaveBeenCalledTimes(1);
  } finally { spy.mockRestore(); }
});

test('recusa arquivo não fotográfico antes de ler qualquer dado', async () => {
  await expect(readBarcodeFromPhoto(new File(['arquivo'], 'dados.txt', { type: 'text/plain' })))
    .rejects.toThrow('Selecione uma foto');
  expect(loadBrowserScript).not.toHaveBeenCalled();
});
