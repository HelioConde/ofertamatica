import React, { useEffect, useRef, useState } from 'react';
import { registerRootComponent } from 'expo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const params=new URLSearchParams(window.location.search);
const mode=params.get('mode')==='expiry'?'expiry':'ean';
const channel=params.get('channel')||'';
const formats={barcodeTypes:['ean13','ean8','upc_a','upc_e']};
const send=(type,extra={})=>window.parent.postMessage({source:'vz-expo-camera',channel,type,...extra},window.location.origin);
function App(){
 const [permission,requestPermission]=useCameraPermissions();
 const [torch,setTorch]=useState(false);
 const [failed,setFailed]=useState(false);
 const camera=useRef(null),ready=useRef(false),capturing=useRef(false),detected=useRef(false);
 useEffect(()=>{
  send('mounted',{engine:'expo-camera'});
  function receive(event){
   if(event.origin!==window.location.origin||event.source!==window.parent)return;
   const data=event.data;
   if(data?.source!=='vz-expo-host'||data.channel!==channel||data.type!=='capture'||mode!=='expiry')return;
   if(!ready.current||capturing.current){send('capture-error',{id:data.id,message:'Câmera ainda não está pronta.'});return;}
   capturing.current=true;
   (async()=>{
    try{
     const photo=await camera.current.takePictureAsync({base64:true,quality:.85});
     const uri=photo?.base64?'data:image/jpeg;base64,'+photo.base64:photo?.uri;
     if(typeof uri!=='string'||!uri.startsWith('data:image/'))throw new Error('Imagem indisponível.');
     const blob=await (await fetch(uri)).blob();
     if(blob.size>8*1024*1024)throw new Error('Imagem acima do limite.');
     send('photo',{id:data.id,blob});
    }catch(error){send('capture-error',{id:data.id,message:error.message||'Falha na captura.'});}
    finally{capturing.current=false;}
   })();
  }
  window.addEventListener('message',receive);
  return ()=>window.removeEventListener('message',receive);
 },[]);
 function onBarcode(event){
  const code=String(event?.data||'').trim();
  if(!detected.current&&/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)){
   detected.current=true;send('barcode',{code});
  }
 }
 async function allow(){
  try{
   const result=await requestPermission();
   if(!result.granted)send('error',{message:'Permissão de câmera negada.'});
  }catch(error){send('error',{message:error.message||'Permissão indisponível.'});}
 }
 if(failed)return <View style={styles.center}><Text style={styles.text}>Não foi possível abrir a câmera Expo. Volte ao leitor padrão.</Text></View>;
 if(!permission)return <View style={styles.center}><Text style={styles.text}>Verificando acesso à câmera…</Text></View>;
 if(!permission.granted)return <View style={styles.center}><Text style={styles.text}>Permita o acesso à câmera para continuar.</Text><Pressable accessibilityRole="button" onPress={allow} style={styles.button}><Text style={styles.buttonText}>Permitir câmera Expo</Text></Pressable></View>;
 return <View style={styles.container}>
  <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch}
   barcodeScannerSettings={mode==='ean'?formats:undefined}
   onBarcodeScanned={mode==='ean'?onBarcode:undefined}
   onCameraReady={()=>{ready.current=true;send('ready');}}
   onMountError={error=>{ready.current=false;setFailed(true);send('error',{message:error?.message||'Falha ao iniciar câmera Expo.'});}}/>
  <View pointerEvents="none" style={[styles.guide,mode==='expiry'?styles.expiry:styles.ean]}/>
  <Pressable accessibilityRole="button" accessibilityLabel={torch?'Desligar lanterna Expo':'Ligar lanterna Expo'} onPress={()=>setTorch(value=>!value)} style={styles.torch}><Text style={styles.buttonText}>{torch?'Desligar luz':'Ligar luz'}</Text></Pressable>
 </View>;
}
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:'#18181b'},
 center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#18181b',padding:20,gap:12},
 text:{color:'white',textAlign:'center',fontSize:15},
 button:{minHeight:44,padding:12,borderRadius:8,backgroundColor:'#1d63e9'},
 buttonText:{color:'white',fontWeight:'700'},
 guide:{position:'absolute',left:'5%',right:'5%',borderWidth:2,borderColor:'#fff',borderRadius:8},
 ean:{top:'35%',bottom:'35%'},expiry:{top:'18%',bottom:'18%'},
 torch:{position:'absolute',bottom:10,right:10,minHeight:44,justifyContent:'center',paddingHorizontal:12,backgroundColor:'#242428',borderRadius:8}
});
registerRootComponent(App);
