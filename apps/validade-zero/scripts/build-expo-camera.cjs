const { execFileSync }=require('node:child_process');
const { existsSync, rmSync }=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=path.join(root,'expo-camera-web');
const out=path.join(root,'public','static','expo-camera');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const url=(process.env.PUBLIC_URL||'/validade-zero').replace(/\/$/,'');
if(!existsSync(path.join(app,'node_modules','expo','bin','cli'))){
 execFileSync(npm,['install','--no-audit','--no-fund'],{cwd:app,stdio:'inherit'});
}
rmSync(out,{recursive:true,force:true});
execFileSync(process.execPath,[path.join(app,'node_modules','expo','bin','cli'),'export','--platform','web','--output-dir',out],{
 cwd:app,stdio:'inherit',env:{...process.env,EXPO_NO_TELEMETRY:'1',VZ_CAMERA_BASE:url+'/static/expo-camera'}
});
if(!existsSync(path.join(out,'index.html')))throw new Error('Expo Camera web export missing index.html');
