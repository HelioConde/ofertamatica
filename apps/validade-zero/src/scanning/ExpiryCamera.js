import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { advanceExpiryConsensus, createExpirySession } from './expiry';
import { requestAutoFocus, cameraCapabilities, supportsTorch, applyCameraTorch } from './focus';

const MAX_FRAMES=6;
function frameBlob(video, treated=false) {
  if(!video || video.readyState<2 || !video.videoWidth || !video.videoHeight)return Promise.resolve(null);
  // Centre band matches the on-screen guide; keep fabrication and expiry labels in frame.
  const sw=Math.floor(video.videoWidth*.9),sh=Math.floor(video.videoHeight*.64);
  const sx=Math.floor((video.videoWidth-sw)/2),sy=Math.floor((video.videoHeight-sh)/2);
  const scale=Math.min(1,1280/sw,960/sh);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)return Promise.resolve(null);
  if(treated)ctx.filter='grayscale(1) contrast(1.65)';
  ctx.drawImage(video,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}

export default function ExpiryCamera({ onConfirm, onClose, initiallyOpen = false }) {
  const [open,setOpen]=useState(initiallyOpen);
  const [preview,setPreview]=useState(false);
  const [auto,setAuto]=useState(false);
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [candidates,setCandidates]=useState([]);
  const [rawText,setRawText]=useState('');
  const [torchAvailable,setTorchAvailable]=useState(false);
  const [torch,setTorch]=useState(false);
  const videoRef=useRef(null),captureRef=useRef(null),imageRef=useRef(null),streamRef=useRef(null);
  const closeRef=useRef(null),sessionRef=useRef(null),generation=useRef(0),processing=useRef(false);

  function session(){
    if(!sessionRef.current)sessionRef.current=createExpirySession();
    return sessionRef.current;
  }
  function cancelWork(){
    generation.current++;
    sessionRef.current?.close();sessionRef.current=null;
    processing.current=false;
  }
  useEffect(()=>()=>{generation.current++;sessionRef.current?.close();sessionRef.current=null;},[]);
  useEffect(()=>{if(open)closeRef.current?.focus();},[open]);

  useEffect(()=>{
    if(!preview)return undefined;
    let cancelled=false;
    const video=videoRef.current;
    setReady(false);setTorch(false);setTorchAvailable(false);
    async function openCamera(){
      try{
        if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)throw new Error('O navegador precisa de HTTPS e permissão de câmera.');
        const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
        if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}
        streamRef.current=stream;
        const track=stream.getVideoTracks()[0];
        await requestAutoFocus(track);
        if(cancelled)return;
        setTorchAvailable(supportsTorch(cameraCapabilities(track)));
        if(video){video.srcObject=stream;await video.play();}
        if(!cancelled)setReady(true);
      }catch(error){
        if(!cancelled){setMessage('Não foi possível iniciar a câmera: '+error.message+'. Você pode fotografar ou selecionar uma imagem.');setAuto(false);setPreview(false);}
      }
    }
    openCamera();
    return ()=>{
      cancelled=true;
      streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;
      if(video){video.pause();video.srcObject=null;}
    };
  },[preview]);

  useEffect(()=>{
    if(!auto||!ready||!preview)return undefined;
    let stopped=false,timer,frames=0,consensus=null,last=[];
    const id=++generation.current;
    const active=()=>!stopped && generation.current===id;
    async function tick(){
      if(!active())return;
      if(processing.current){timer=setTimeout(tick,350);return;}
      processing.current=true;setBusy(true);
      try{
        const blob=await frameBlob(videoRef.current,frames>=3);
        if(!active())return;
        if(!blob){timer=setTimeout(tick,400);return;}
        const result=await session().recognise(blob);
        if(!active())return;
        frames++;
        last=result.candidates;
        setRawText(result.text.slice(0,600));
        consensus=advanceExpiryConsensus(consensus,last);
        if(consensus.confirmed){
          setCandidates(last);setMessage('Selecione a validade correta. Confira a embalagem antes de confirmar.');
          setAuto(false);setPreview(false);return;
        }
        if(frames>=MAX_FRAMES){
          // Do not silently accept an unstable date. The manual photo path remains available.
          setCandidates([]);setAuto(false);
          setMessage('Não obtive duas leituras iguais. Aproxime a câmera e tente novamente, fotografe a data ou digite manualmente.');
          return;
        }
        setMessage(consensus.count?'Data candidata encontrada. Mantenha a embalagem parada para conferir novamente.':'Procurando a validade. Enquadre o texto VAL e a data.');
        timer=setTimeout(tick,450);
      }catch(error){
        if(active()){setAuto(false);setMessage('Não foi possível reconhecer a validade: '+error.message+'. Fotografe ou digite a data.');}
      }finally{
        if(active()){processing.current=false;setBusy(false);}
      }
    }
    tick();
    return ()=>{stopped=true;clearTimeout(timer);if(generation.current===id){generation.current++;processing.current=false;}};
  },[auto,ready,preview]);

  async function processImage(blob){
    if(!blob||!blob.type.startsWith('image/')){setMessage('Selecione uma imagem válida.');return;}
    if(blob.size>8*1024*1024){setMessage('A imagem deve ter no máximo 8 MB.');return;}
    cancelWork();const id=generation.current;
    setAuto(false);setPreview(false);setBusy(true);setCandidates([]);setRawText('');setMessage('Reconhecendo a data na imagem…');
    try{
      const result=await session().recognise(blob);
      if(generation.current!==id)return;
      setRawText(result.text.slice(0,600));setCandidates(result.candidates);
      setMessage(result.candidates.length?'Selecione a validade correta. Nenhuma data será salva sem confirmação.':'Não encontrei uma data completa confiável. Fotografe mais perto ou digite a validade manualmente.');
    }catch(error){
      if(generation.current===id)setMessage('Não foi possível processar a imagem: '+error.message+'. Preencha a data manualmente.');
    }finally{if(generation.current===id)setBusy(false);}
  }
  async function snap(){
    const blob=await frameBlob(videoRef.current);
    if(!blob){setMessage('A câmera ainda não está pronta para fotografar.');return;}
    await processImage(blob);
  }
  function start(){
    setCandidates([]);setRawText('');setMessage('Enquadre a validade impressa.');setPreview(true);setAuto(true);
  }
  function stopAuto(){
    cancelWork();setAuto(false);setBusy(false);setMessage('Leitura automática pausada. Você pode fotografar ou tentar novamente.');
  }
  function close(){
    cancelWork();setPreview(false);setAuto(false);setOpen(false);setBusy(false);setCandidates([]);setRawText('');setMessage('');onClose?.();
  }
  async function toggleTorch(){
    const track=streamRef.current?.getVideoTracks()[0];
    if(await applyCameraTorch(track,!torch))setTorch(!torch);
    else setMessage('A lanterna não está disponível neste momento.');
  }

  return <div className="expiry-scanner no-print">
    {!open ? <button type="button" className="btn btn--outline" onClick={()=>setOpen(true)}><Icon name="camera" size={17}/> Ler validade pela câmera (OCR)</button> :
      <section className="expiry-scanner__panel" aria-label="Reconhecimento da validade" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}>
        <div className="scanner-window__heading"><strong><Icon name="camera" size={20}/> Reconhecer validade</strong>
          <button ref={closeRef} type="button" className="icon-button" aria-label="Fechar leitor de validade" onClick={close}><Icon name="close" size={18}/></button>
        </div>
        <p>Enquadre a palavra VAL/VENC e a data impressa. O leitor tenta reconhecer automaticamente; confira a embalagem.</p>
        {preview && <div className="expiry-viewfinder">
          <video ref={videoRef} className="scanner-video" autoPlay playsInline muted aria-label="Câmera para validade"/>
          <div className="expiry-viewfinder__guide" aria-hidden="true"/>
        </div>}
        <div className="expiry-scanner__buttons">
          {!preview && <button type="button" className="btn btn--primary" disabled={busy} onClick={start}><Icon name="camera" size={17}/> Abrir câmera</button>}
          {preview && auto && <button type="button" className="btn btn--outline" onClick={stopAuto}>Pausar leitura automática</button>}
          {preview && !auto && <button type="button" className="btn btn--primary" disabled={!ready||busy} onClick={start}>Tentar leitura automática</button>}
          {preview && <button type="button" className="btn btn--outline" disabled={!ready||busy||auto} onClick={snap}><Icon name="camera" size={17}/> Fotografar data</button>}
          {preview && torchAvailable && <button type="button" className="btn btn--outline" aria-pressed={torch} onClick={toggleTorch}>Lanterna</button>}
          <button type="button" className="btn btn--outline" disabled={busy||auto} onClick={()=>captureRef.current?.click()}>Câmera do celular</button>
          <button type="button" className="btn btn--outline" disabled={busy||auto} onClick={()=>imageRef.current?.click()}>Selecionar imagem</button>
        </div>
        <input ref={captureRef} tabIndex={-1} className="sr-only" aria-label="Fotografar validade" type="file" accept="image/*" capture="environment" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)processImage(file);}}/>
        <input ref={imageRef} tabIndex={-1} className="sr-only" aria-label="Selecionar imagem da validade" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)processImage(file);}}/>
        {busy && <p className="ocr-progress" role="status">Analisando imagem localmente. A primeira leitura pode baixar o modelo de reconhecimento…</p>}
        {message && <p className="scanner-notice" role="status">{message}</p>}
        {candidates.length>0 && <div className="ocr-candidates">
          <strong>Datas encontradas — escolha após conferir a embalagem</strong>
          {candidates.map(item=><button type="button" key={item.date} className="ocr-candidate" onClick={()=>{onConfirm(item.date);close();}}>
            <Icon name="calendar" size={18}/><span>{item.date.split('-').reverse().join('/')}</span><small>{item.labelled?'Próxima a VAL/VENC/EXP':'Sem indicação de validade'}</small><Icon name="check" size={18}/>
          </button>)}
        </div>}
        {rawText && <details className="ocr-original"><summary>Ver texto reconhecido</summary><pre>{rawText}</pre></details>}
        <p className="scanner-hint">OCR no dispositivo, sem envio da imagem ao servidor. A primeira leitura pode exigir internet para baixar o motor e o modelo. Confirme a data antes de cadastrar o lote.</p>
      </section>}
  </div>;
}
