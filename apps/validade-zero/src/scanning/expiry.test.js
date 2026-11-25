import { extractExpiryCandidates, advanceExpiryConsensus, createExpirySession } from './expiry';
import { scannedGtin, cameraError } from './barcode';

test('identifica datas de validade com formatos brasileiros e internacionais', () => {
  expect(extractExpiryCandidates('FAB 01/10/2026\nVAL 30/11/2026')).toEqual([
    { date:'2026-11-30', labelled:true, original:'30/11/2026' }
  ]);
  expect(extractExpiryCandidates('VENC: 05.12.26')).toEqual([
    { date:'2026-12-05', labelled:true, original:'05.12.26' }
  ]);
  expect(extractExpiryCandidates('EXP: 2027-01-31')).toEqual([
    { date:'2027-01-31', labelled:true, original:'2027-01-31' }
  ]);
});

test('não inventa ano, descarta impossíveis e sinaliza datas sem rótulo', () => {
  expect(extractExpiryCandidates('VENC 31/02/2027; 10/2027')).toEqual([]);
  expect(extractExpiryCandidates('LOTE A2 FAB 07/07/2026')).toEqual([]);
  expect(extractExpiryCandidates('01/12/2028')).toEqual([
    { date:'2028-12-01', labelled:false, original:'01/12/2028' }
  ]);
});

test('deduplica e prioriza marcações de VAL', () => {
  const candidates = extractExpiryCandidates('01/11/2026\nVAL: 01/11/2026\nEXP 20/12/2026');
  expect(candidates).toHaveLength(2);
  expect(candidates[0].date).toBe('2026-11-01');
  expect(candidates[0].labelled).toBe(true);
});

test('reconhece EANs e UPC apenas numéricos, com zeros preservados', () => {
  expect(scannedGtin('0789012345678')).toBe('0789012345678');
  expect(scannedGtin('12345678')).toBe('12345678');
  expect(scannedGtin('1234')).toBeNull();
  expect(scannedGtin('A12345678')).toBeNull();
  expect(cameraError({ name:'NotAllowedError' })).toMatch(/Permissão/);
});

test('oito formatos de validade do laboratório, incluindo datas compactas e meses',()=>{
 const samples=[
 ['FAB: 01/07/26\nVAL: 30/06/27\nLOT: 07/26 OP5','2027-06-30'],
 ['VAL 240427\nLOT 2409261','2027-04-24'],
 ['FAB21/07/26\nVAL21/01/27','2027-01-21'],
 ['L06 M35 150526 A\nVENCE:\n15/05/27','2027-05-15'],
 ['FAB: 29 SET 26\nVAL: 28 SET 27','2027-09-28'],
 ['FAB: 20/08/2026 VAL: 20/08/2027','2027-08-20'],
 ['FAB: 15 DEZ 25\nVAL:\n08\nJUN\n27','2027-06-08'],
 ['L:VS19726622P3 16:46\nVAL:12/05/27','2027-05-12']
 ];
 for(const [text,date] of samples)expect(extractExpiryCandidates(text).map(x=>x.date)).toEqual([date]);
});
test('não promove fabricação, lote ou rótulo ilegível a validade',()=>{
 for(const text of ['FAB21/07/26\nLOTE 240427','VAL 31/02/27\nFAB 10/01/27','VAL 08 JUNXYZ 27','VAL 240427A','VAL 15/05/27\nVAL 1205/27','VAL:\nLOTE 240427','VAL 0B JUR 27'])expect(extractExpiryCandidates(text)).toEqual([]);
 expect(extractExpiryCandidates('VAL 29/02/24')[0].date).toBe('2024-02-29');
});
test('leitura contínua exige duas sugestões rotuladas iguais e consecutivas',()=>{
 const a=[{date:'2027-06-08',labelled:true}],b=[{date:'2027-06-09',labelled:true}];
 const first=advanceExpiryConsensus(null,a);
 expect(first.confirmed).toBe(false);
 expect(advanceExpiryConsensus(first,a).confirmed).toBe(true);
 expect(advanceExpiryConsensus(first,b).confirmed).toBe(false);
 expect(advanceExpiryConsensus(first,[]).count).toBe(0);
 expect(advanceExpiryConsensus(first,[...a,...b]).confirmed).toBe(false);
 expect(advanceExpiryConsensus(first,[{...a[0],labelled:false}]).confirmed).toBe(false);
});
test('reaproveita um único worker por sessão e encerra ao fechar',async()=>{
 const recognise=jest.fn().mockResolvedValue({data:{text:'VAL 30/06/27'}});
 const terminate=jest.fn().mockResolvedValue();
 const createWorker=jest.fn().mockResolvedValue({recognize:recognise,terminate});
 window.Tesseract={createWorker};
 try{
  const session=createExpirySession();
  await session.recognise(new Blob(['1']));
  await session.recognise(new Blob(['2']));
  expect(createWorker).toHaveBeenCalledTimes(1);
  expect(recognise).toHaveBeenCalledTimes(2);
  session.close();session.close();
  expect(terminate).toHaveBeenCalledTimes(1);
  await expect(session.recognise(new Blob())).rejects.toThrow('encerrado');
 }finally{delete window.Tesseract;}
});
