import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

let sequence=0;
export default forwardRef(function ExpoCameraFrame({mode,onReady,onBarcode,onError},ref){
 const frame=useRef(null),callbacks=useRef({onReady,onBarcode,onError});
 const pending=useRef(new Map());
 const [channel]=useState(()=>String(Date.now())+'-'+(++sequence));
 const [status,setStatus]=useState('Carregando Expo Camera…');
 useEffect(()=>{callbacks.current={onReady,onBarcode,onError};},[onReady,onBarcode,onError]);
 useEffect(()=>{
  const requests=pending.current;
  const timer=setTimeout(()=>{
   setStatus('Expo Camera não respondeu. Você pode voltar ao leitor padrão.');
   callbacks.current.onError?.('Expo Camera não respondeu.');
  },20000);
  function receive(event){
   if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
   const data=event.data;
   if(data?.source!=='vz-expo-camera'||data.channel!==channel)return;
   if(data.type==='mounted'){clearTimeout(timer);setStatus('Aguardando acesso à câmera Expo…');}
   if(data.type==='ready'){clearTimeout(timer);setStatus('Expo Camera ativo');callbacks.current.onReady?.();}
   if(data.type==='error'){setStatus(data.message||'Falha na câmera Expo.');callbacks.current.onError?.(data.message);}
   if(data.type==='barcode'&&mode==='ean'&&/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(data.code))callbacks.current.onBarcode?.(data.code);
   if(data.type==='photo'||data.type==='capture-error'){
    const request=requests.get(data.id);
    if(!request)return;
    requests.delete(data.id);clearTimeout(request.timer);
    if(data.type==='photo'&&data.blob instanceof Blob&&data.blob.type.startsWith('image/')&&data.blob.size<=8*1024*1024)request.resolve(data.blob);
    else request.reject(new Error(data.message||'Captura inválida.'));
   }
  }
  window.addEventListener('message',receive);
  return ()=>{clearTimeout(timer);window.removeEventListener('message',receive);for(const request of requests.values()){clearTimeout(request.timer);request.reject(new Error('Câmera encerrada.'));}requests.clear();};
 },[channel,mode]);
 useImperativeHandle(ref,()=>({capture(){
  return new Promise((resolve,reject)=>{
   const target=frame.current?.contentWindow;
   if(!target){reject(new Error('Câmera Expo não disponível.'));return;}
   const id=String(++sequence);
   const timer=setTimeout(()=>{pending.current.delete(id);reject(new Error('Tempo limite da captura Expo.'));},10000);
   pending.current.set(id,{resolve,reject,timer});
   target.postMessage({source:'vz-expo-host',channel,type:'capture',id},window.location.origin);
  });
 }}),[channel]);
 const url=(process.env.PUBLIC_URL||'').replace(/\/$/,'')+'/static/expo-camera/index.html?mode='+mode+'&channel='+encodeURIComponent(channel);
 return <div className="vz-expo-camera"><iframe ref={frame} title={mode==='ean'?'Expo Camera para EAN':'Expo Camera para validade'} src={url} allow="camera" /><p role="status">{status}</p></div>;
});
