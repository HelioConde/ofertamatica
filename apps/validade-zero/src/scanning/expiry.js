import { parseDateOnly } from '../domain/validade';
import { loadBrowserScript, TESSERACT_CDN } from './loader';

const MONTHS = ['JAN JANEIRO','FEV FEVEREIRO','MAR MARCO','ABR ABRIL','MAI MAIO','JUN JUNHO','JUL JULHO','AGO AGOSTO','SET SETEMBRO','OUT OUTUBRO','NOV NOVEMBRO','DEZ DEZEMBRO'];
const LABEL = /(?<![A-Z0-9])(?:VALIDADE|VENCIMENTO|VENCE|VENC|VAL|VTO|EXPIRATION|EXPIRY|EXP|BEST BEFORE)(?![A-Z])\s*[.:-]?\s*/g;
const MADE = /(?<![A-Z0-9])(?:FABRICACAO|FABRICA|FAB|PRODUCAO|PROD|MFG|LOTE|LOT)(?![A-Z])/;
const NUM = /^(?:(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})|(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4}|\d{2}))(?![A-Z0-9])/;
const COMPACT = /^(\d{2})(\d{2})(\d{4}|\d{2})(?![A-Z0-9])/;
const NAMED = /^(\d{1,2})\s*[-./ ]?\s*([A-Z]{3,9})\s*[-./ ]?\s*(\d{4}|\d{2})(?![A-Z0-9])/;

function isoDate(day, month, year) {
  const yyyy = Number(year) < 100 ? 2000 + Number(year) : Number(year);
  const iso = [String(yyyy).padStart(4, '0'), String(Number(month)).padStart(2, '0'), String(Number(day)).padStart(2, '0')].join('-');
  return parseDateOnly(iso) ? iso : null;
}
function atStart(text, compact = false) {
  let m = text.match(NUM);
  if (m) return { date: m[1] ? isoDate(m[3],m[2],m[1]) : isoDate(m[4],m[5],m[6]), original:m[0] };
  m = text.match(NAMED);
  if (m) return { date:isoDate(m[1],MONTHS.findIndex(x => x.split(' ').includes(m[2]))+1,m[3]), original:m[0] };
  if (compact && (m = text.match(COMPACT))) return { date:isoDate(m[1],m[2],m[3]), original:m[0] };
  return null;
}

/** Suggestions only. A labelled but unreadable expiry never falls back to a fabrication date. */
export function extractExpiryCandidates(text) {
  const lines = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().split(/[\n\r]+/).map(x=>x.trim()).filter(Boolean);
  const matches = new Map();
  let labelsSeen=0, unresolved=0;
  function add(result, labelled) {
    if (!result?.date) return;
    const old=matches.get(result.date);
    if (!old || labelled) matches.set(result.date,{...result,labelled});
  }
  for (let i=0;i<lines.length;i++) {
    const line=lines[i];
    for (const label of line.matchAll(LABEL)) {
      labelsSeen++;
      const tail=line.slice(label.index+label[0].length).trim();
      let result=atStart(tail,true);
      // Reassemble separated tokens, only immediately after a validity label.
      if (!result && (!tail || /^\d{1,2}$/.test(tail))) {
        let joined=tail;
        for(let j=i+1;j<Math.min(lines.length,i+4);j++){
          if(MADE.test(lines[j]) || [...lines[j].matchAll(LABEL)].length)break;
          joined=(joined+' '+lines[j]).trim();
          const possible=atStart(joined,true);
          if(possible && possible.original.length===joined.length){result=possible;break;}
          if(!/^[0-9A-Z ./-]+$/.test(joined))break;
        }
      }
      if(result?.date)add(result,true);else unresolved++;
    }
  }
  // Conflicting labelled values may be reviewed manually, but never auto-selected.
  if(labelsSeen) return unresolved ? [] : [...matches.values()].sort((a,b)=>a.date.localeCompare(b.date));
  // Legacy manual suggestions: only unlabelled full separated dates; no compact lot numbers.
  for(const line of lines){
    if(MADE.test(line))continue;
    const result=atStart(line);
    if(result?.date)add(result,false);
  }
  return [...matches.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

/** Require the same single, labelled candidate on two successive camera frames. */
export function advanceExpiryConsensus(previous, candidates) {
  if(candidates.length!==1 || !candidates[0].labelled)return {date:null,count:0,confirmed:false};
  const date=candidates[0].date;
  const count=previous?.date===date ? previous.count+1 : 1;
  return {date,count,confirmed:count>=2};
}

/** One lazy worker per scanner; closing terminates it, even during initial model loading. */
export function createExpirySession() {
  let workerPromise, worker, closed=false;
  return {
    async recognise(blob) {
      if(closed)throw new Error('Leitor encerrado.');
      if(!workerPromise)workerPromise=(async()=>{
        const lib=await loadBrowserScript(TESSERACT_CDN,'Tesseract');
        if(closed)throw new Error('Leitor encerrado.');
        worker=await lib.createWorker('eng');
        if(closed){await worker.terminate();throw new Error('Leitor encerrado.');}
        return worker;
      })();
      const active=await workerPromise;
      if(closed)throw new Error('Leitor encerrado.');
      const {data}=await active.recognize(blob);
      const text=data?.text||'';
      return {text,candidates:extractExpiryCandidates(text)};
    },
    close(){
      if(closed)return;
      closed=true;
      if(worker)Promise.resolve(worker.terminate()).catch(()=>{});
    }
  };
}
export async function recogniseExpiry(blob) {
  const session=createExpirySession();
  try{return await session.recognise(blob);}finally{session.close();}
}
