import { loadBrowserScript, ZXING_CDN } from './loader';
import { scannedGtin } from './barcode';

const FORMATS = ['ean_13', 'ean_8', 'upc_a'];

// Processa a imagem no aparelho, sem enviar arquivos a um servidor.
export async function decodeBarcodeFromImageElement(image) {
  if (!image) return null;
  const Native = window.BarcodeDetector;
  if (Native) {
    try {
      const supported = Native.getSupportedFormats ? await Native.getSupportedFormats() : FORMATS;
      const formats = FORMATS.filter(format => supported.includes(format));
      if (formats.length) {
        const matches = await new Native({ formats }).detect(image);
        const value = matches.map(match => scannedGtin(match.rawValue)).find(Boolean);
        if (value) return value;
      }
    } catch { /* Usar outro decodificador. */ }
  }

  const ZXing = await loadBrowserScript(ZXING_CDN, 'ZXingBrowser');
  const reader = new ZXing.BrowserMultiFormatReader();
  try {
    const result = await reader.decodeFromImageElement(image);
    return scannedGtin(typeof result?.getText === 'function' ? result.getText() : result?.text);
  } catch { return null; }
}

export async function readBarcodeFromPhoto(file) {
  if (!file || !(file.type || '').startsWith('image/')) {
    throw new Error('Selecione uma foto do código de barras.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('A foto é muito grande. Use uma imagem de até 25 MB.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Não foi possível abrir a foto.'));
      image.src = url;
    });
    return await decodeBarcodeFromImageElement(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}
