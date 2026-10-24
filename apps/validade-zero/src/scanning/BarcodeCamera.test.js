import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarcodeCamera from './BarcodeCamera';
import { startBarcodeScanner } from './barcode';
import { readBarcodeFromPhoto } from './photoBarcode';

jest.mock('./barcode', () => ({
  startBarcodeScanner: jest.fn(),
  cameraError: error => error?.message || 'Falha na câmera'
}));
jest.mock('./photoBarcode', () => ({ readBarcodeFromPhoto: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  startBarcodeScanner.mockResolvedValue(jest.fn());
});

test('oferece captura com câmera traseira e retorna ao vídeo ao vivo', async () => {
  const detected = jest.fn();
  render(<BarcodeCamera onDetected={detected} onClose={jest.fn()}/>);
  const input = screen.getByLabelText('Foto do código EAN');
  expect(input).toHaveAttribute('type', 'file');
  expect(input).toHaveAttribute('accept', 'image/*');
  expect(input).toHaveAttribute('capture', 'environment');
  const photo = screen.getByRole('button', { name: 'Tirar foto do EAN' });
  fireEvent.click(photo);
  expect(screen.getByRole('button', { name: 'Voltar ao leitor ao vivo' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Visualização da câmera para código de barras')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar ao leitor ao vivo' }));
  expect(screen.getByLabelText('Visualização da câmera para código de barras')).toBeInTheDocument();
  await waitFor(() => expect(startBarcodeScanner).toHaveBeenCalledTimes(2));
  expect(detected).not.toHaveBeenCalled();
});

test('foto decodificada preenche EAN pela mesma callback do scanner ao vivo', async () => {
  const detected = jest.fn();
  readBarcodeFromPhoto.mockResolvedValue('7894900102960');
  render(<BarcodeCamera onDetected={detected} onClose={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Tirar foto do EAN' }));
  const file = new File(['imagem'], 'ean.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Foto do código EAN'), { target: { files: [file] } });
  await waitFor(() => expect(detected).toHaveBeenCalledWith('7894900102960'));
  expect(readBarcodeFromPhoto).toHaveBeenCalledWith(file);
});

test('se foto falhar, explica como tentar novamente sem enviar dados', async () => {
  readBarcodeFromPhoto.mockResolvedValue(null);
  render(<BarcodeCamera onDetected={jest.fn()} onClose={jest.fn()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Tirar foto do EAN' }));
  fireEvent.change(screen.getByLabelText('Foto do código EAN'),
    { target: { files: [new File(['imagem'], 'ean.png', { type: 'image/png' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível reconhecer o EAN');
  expect(screen.getByRole('button', { name: 'Voltar ao leitor ao vivo' })).toBeInTheDocument();
});
