import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { cameraError, startBarcodeScanner } from './barcode';

export default function BarcodeCamera({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const detectedRef = useRef(onDetected);
  const cameraControls = useRef(null);
  const [status, setStatus] = useState('Solicitando permissão para abrir a câmera…');
  const [error, setError] = useState('');
  const [focusInfo, setFocusInfo] = useState('');
  const [canRefocus, setCanRefocus] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  useEffect(() => { detectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => {
    let disposed = false;
    let stop = () => {};
    startBarcodeScanner(videoRef.current, code => {
      if (!disposed) detectedRef.current(code);
    }, options => {
      if (disposed) return;
      cameraControls.current = options;
      setCanRefocus(options.focusSupported);
      setFocusInfo(options.autofocus
        ? 'Foco automático contínuo ativado. Mantenha o EAN no centro.'
        : 'Foco manual indisponível neste navegador. Ajuste a distância ou use o zoom, se disponível.');
      setZoom(options.zoom);
      setTorchSupported(options.torch);
    }).then(cleanup => {
      if (disposed) cleanup();
      else { stop = cleanup; setStatus('Enquadre o EAN no centro. Ao reconhecer, a câmera fecha automaticamente.'); }
    }).catch(cause => {
      if (!disposed) {
        setError(cameraError(cause));
        setStatus('');
      }
    });
    return () => { disposed = true; cameraControls.current = null; stop(); };
  }, []);
  async function refocus() {
    const ready = await cameraControls.current?.refocus?.();
    setFocusInfo(ready
      ? 'Foco solicitado novamente. Mantenha o código imóvel por um instante.'
      : 'Foco manual indisponível neste navegador. Experimente ajustar a distância ou o zoom.');
  }

  async function changeZoom(value) {
    const requested = Number(value);
    if (!Number.isFinite(requested)) return;
    const changed = await cameraControls.current?.setZoom?.(requested);
    if (changed) setZoom(current => current ? { ...current, value: requested } : current);
    else setFocusInfo('O dispositivo não conseguiu aplicar o zoom. Experimente alterar a distância.');
  }

  async function toggleTorch() {
    const next = !torchOn;
    if (await cameraControls.current?.setTorch?.(next)) setTorchOn(next);
    else setFocusInfo('Não foi possível controlar a lanterna neste navegador.');
  }

  return <section className="scanner-window" aria-label="Leitor de EAN">
    <div className="scanner-window__heading"><strong><Icon name="scan" size={20}/> Ler EAN pela câmera</strong>
      <button type="button" className="icon-button" aria-label="Fechar leitor de EAN" onClick={onClose}><Icon name="close" size={18}/></button>
    </div>
    <div className="barcode-viewfinder">
      <video className="scanner-video" ref={videoRef} autoPlay playsInline muted aria-label="Visualização da câmera para código de barras"/>
      <div className="barcode-viewfinder__guide" aria-hidden="true"><span/></div>
    </div>
    {focusInfo && <p className="scanner-focus-info" role="status">{focusInfo}</p>}
    {(canRefocus || zoom || torchSupported) && <div className="scanner-controls" aria-label="Ajustes da câmera para leitura do EAN">
      {canRefocus && <button type="button" className="btn btn--outline" onClick={refocus}>
        <Icon name="scan" size={17}/> Reajustar foco
      </button>}
      {zoom && <label className="scanner-zoom">Zoom <input type="range" min={zoom.min} max={zoom.max}
        step="0.1" value={zoom.value} aria-label="Zoom da câmera"
        onChange={event => changeZoom(event.target.value)}/><strong>{zoom.value.toFixed(1)}×</strong></label>}
      {torchSupported && <button type="button" className="btn btn--outline" aria-pressed={torchOn}
        onClick={toggleTorch}>{torchOn ? 'Desligar luz' : 'Ligar luz'}</button>}
    </div>}
    {status && <p role="status">{status}</p>}
    {error && <p className="scanner-error" role="alert">{error}</p>}
    <details className="scanner-tips">
      <summary>Dicas para melhorar a leitura do EAN</summary>
      <p className="scanner-hint">Mantenha o código EAN inteiro dentro da moldura e evite reflexos. Se estiver borrado, afaste o celular alguns centímetros, use zoom quando disponível ou ajuste a iluminação. Quando reconhecido, o código é consultado automaticamente.</p>
    </details>
    <button type="button" className="btn btn--outline" onClick={onClose}>Voltar para digitação</button>
  </section>;
}
