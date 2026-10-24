import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { cameraError, startBarcodeScanner } from './barcode';
import { readBarcodeFromPhoto } from './photoBarcode';

export default function BarcodeCamera({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const detectedRef = useRef(onDetected);
  const cameraControls = useRef(null);
  const photoInputRef = useRef(null);
  const liveStopRef = useRef(null);
  const mountedRef = useRef(true);
  const [photoMode, setPhotoMode] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [status, setStatus] = useState('Solicitando permissão para abrir a câmera…');
  const [error, setError] = useState('');
  const [focusInfo, setFocusInfo] = useState('');
  const [canRefocus, setCanRefocus] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  useEffect(() => { detectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => {
    if (photoMode) return undefined;
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
      else { stop = cleanup; liveStopRef.current = cleanup; setStatus('Enquadre o EAN no centro. Ao reconhecer, a câmera fecha automaticamente.'); }
    }).catch(cause => {
      if (!disposed) {
        setError(cameraError(cause));
        setStatus('');
      }
    });
    return () => { disposed = true; cameraControls.current = null; liveStopRef.current = null; stop(); };
  }, [photoMode]);

  function takePhoto() {
    if (photoBusy) return;
    // Liberar o vídeo para a câmera nativa do aparelho poder ajustar o foco.
    liveStopRef.current?.();
    setPhotoMode(true);
    setError('');
    setStatus('Use a câmera do celular para fotografar o EAN, ou escolha uma imagem.');
    photoInputRef.current?.click();
  }

  async function onPhotoChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setError('');
    setStatus('Analisando o EAN na foto…');
    try {
      const code = await readBarcodeFromPhoto(file);
      if (!mountedRef.current) return;
      if (code) { detectedRef.current(code); return; }
      setError('Não foi possível reconhecer o EAN na foto. Fotografe de perto, sem reflexos, ou digite o número.');
    } catch (cause) {
      if (mountedRef.current) setError(cause?.message || 'Não foi possível analisar a foto.');
    } finally {
      if (mountedRef.current) { setPhotoBusy(false); setStatus(''); }
    }
  }

  function backToLive() {
    setPhotoMode(false);
    setError('');
    setStatus('Solicitando permissão para abrir a câmera…');
  }
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
    <div className="scanner-photo-actions">
      <button type="button" className="btn btn--primary" onClick={takePhoto}
        disabled={photoBusy}><Icon name="camera" size={18}/> Tirar foto do EAN</button>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
        onChange={onPhotoChosen} aria-label="Foto do código EAN" className="scanner-photo-input"/>
    </div>
    {!photoMode && <>
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
      </div>
    </>}
    {photoMode && <div className="scanner-photo-mode">
      <p>Use o foco da câmera nativa do celular. A foto é lida aqui no aparelho, sem envio ao servidor.</p>
      <button type="button" className="btn btn--outline" disabled={photoBusy} onClick={backToLive}>
        Voltar ao leitor ao vivo
      </button>
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
