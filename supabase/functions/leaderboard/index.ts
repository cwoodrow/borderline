import games from './game-data.json' with {type:'json'};
import {scoreDrawing} from './geometry.js';
import {validateDrawing,validateNickname,validateUUID} from './validation.js';
const origins=new Set(['https://cwoodrow.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const url=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const gameById=games as Record<string,{borders:number[][][];bounds:number[][];tolerance:number;revision:string}>;
async function db(path:string,body?:unknown){
  const response=await fetch(`${url}/rest/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok){const detail=await response.json().catch(()=>({}));const known=['attempt_expired','attempt_not_found','invalid_nickname','request_conflict'].find(code=>String(detail.message||'').includes(code));console.error('Database request failed',response.status);throw Error(known||'database_unavailable');}
  return response.json();
}
async function clientHash(request:Request){
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(serviceKey),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
async function readBody(request:Request){
  if(!request.body)throw Error('invalid_request');
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1500000){await reader.cancel();throw Error('drawing_too_large');}chunks.push(value);}
  const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(data));}catch{throw Error('invalid_request');}
}
Deno.serve(async request=>{
  const origin=request.headers.get('origin')||'';
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!origins.has(origin))return reply({error:'origin_not_allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try{
    if(request.method==='GET'){
      const id=new URL(request.url).searchParams.get('map')||'',game=gameById[id];if(!Object.hasOwn(gameById,id))return reply({error:'unknown_map'},400);
      const entries=await db(`leaderboard_entries?map_id=eq.${id}&revision=eq.${game.revision}&select=nickname,score,created_at&order=score.desc,created_at.asc,id.asc&limit=3`);
      return reply({map:id,entries});
    }
    if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
    if(!await db('rpc/leaderboard_allow',{p_client:await clientHash(request)}))return reply({error:'rate_limited'},429);
    const body=await readBody(request);
    if(!body||typeof body!=='object')throw Error('invalid_request');
    if(body.action==='evaluate'){
      const game=gameById[body.map];if(!Object.hasOwn(gameById,body.map))throw Error('unknown_map');
      const requestId=validateUUID(body.requestId),drawing=validateDrawing(body.strokes,game);
      const {score}=scoreDrawing(drawing,game.borders,game.tolerance);
      return reply(await db('rpc/leaderboard_evaluate',{p_request:requestId,p_map:body.map,p_revision:game.revision,p_score:score}));
    }
    if(body.action==='claim'){
      const attemptId=validateUUID(body.attemptId),nickname=validateNickname(body.nickname);
      const attempts=await db(`leaderboard_attempts?id=eq.${attemptId}&select=map_id,revision&limit=1`);
      const attempt=attempts[0];if(!attempt||!Object.hasOwn(gameById,attempt.map_id)||gameById[attempt.map_id].revision!==attempt.revision)throw Error('attempt_expired');
      return reply(await db('rpc/leaderboard_claim',{p_attempt:attemptId,p_name:nickname}));
    }
    throw Error('invalid_request');
  }catch(error){
    const message=error instanceof Error?error.message:'unavailable';
    const allowed=['invalid_request','invalid_drawing','drawing_too_large','drawing_outside_map','invalid_nickname','unknown_map','attempt_expired','attempt_not_found','request_conflict'];
    return reply({error:allowed.includes(message)?message:'unavailable'},allowed.includes(message)?400:503);
  }
});
