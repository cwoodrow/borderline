import {LEADERBOARD_CONFIG} from './leaderboard-config.js';
const copy={
 en:{open:'World top 3',title:'World podium',loading:'Loading the podium…',empty:'No scores yet. Set the first record!',unavailable:'The world podium is unavailable. Your local best is safe.',retry:'Try again',checking:'Checking your score for the world top 3…',qualified:'A place on the podium!',prompt:'Enter your name or nickname to publish your score.',label:'Name / nickname',save:'Save my score',skip:'Not now',close:'Close',saving:'Saving…',saved:'Your score is on the podium!',missed:'The podium has changed. Your score no longer qualifies.',notQualified:'Score verified. Keep going for the top 3!',invalid:'Use 1–20 letters, numbers, spaces, apostrophes, dots or hyphens.',rate:'Too many attempts. Wait a minute and try again.',expired:'This attempt has expired. Submit your drawing again.',privacy:'Your nickname and score will be public. No account required.',rules:'Ties: the first published score keeps its place.',pending:'Enter my nickname',large:'Your drawing is too large or too far outside the map to submit.',score:'Verified score'},
 fr:{open:'Top 3 mondial',title:'Podium mondial',loading:'Chargement du podium…',empty:'Aucun score pour le moment. À vous le premier record !',unavailable:'Le podium mondial est indisponible. Votre record local est conservé.',retry:'Réessayer',checking:'Vérification de votre score pour le top 3 mondial…',qualified:'Une place sur le podium !',prompt:'Entrez votre nom ou pseudo pour publier votre score.',label:'Nom / pseudo',save:'Enregistrer mon score',skip:'Plus tard',close:'Fermer',saving:'Enregistrement…',saved:'Votre score est sur le podium !',missed:'Le podium a changé. Votre score ne suffit plus à y entrer.',notQualified:'Score vérifié. Continuez pour atteindre le top 3 !',invalid:'Utilisez 1 à 20 lettres, chiffres, espaces, apostrophes, points ou tirets.',rate:'Trop de tentatives. Patientez une minute avant de réessayer.',expired:'Cette tentative a expiré. Envoyez à nouveau votre tracé.',privacy:'Votre pseudo et votre score seront publics. Aucun compte nécessaire.',rules:'En cas d’égalité, le premier score publié garde sa place.',pending:'Saisir mon pseudo',large:'Votre tracé est trop volumineux ou trop éloigné de la carte pour être envoyé.',score:'Score vérifié'},
};
export function createLeaderboard(){
 const $=id=>document.getElementById(id),dialog=$('podium-dialog');
 let current=null,sequence=0,loadSequence=0,entries=[],listState='idle',status='',pending=null,submission=null,busy=false,formError='';
 const t=key=>copy[document.documentElement.lang==='fr'?'fr':'en'][key];
 const mapName=()=>current?.names[document.documentElement.lang==='fr'?1:0]||'';
 async function api(body,map){
   const response=await fetch(`${LEADERBOARD_CONFIG.url}/functions/v1/leaderboard${body?'':`?map=${encodeURIComponent(map)}`}`,{method:body?'POST':'GET',headers:{apikey:LEADERBOARD_CONFIG.publishableKey,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
   let data;try{data=await response.json();}catch{throw Error('unavailable');}
   if(!response.ok)throw Error(data.error||'unavailable');return data;
 }
 function errorKey(error){return error.message==='rate_limited'?'rate':error.message==='invalid_nickname'?'invalid':error.message==='attempt_expired'?'expired':['drawing_too_large','drawing_outside_map','invalid_drawing'].includes(error.message)?'large':'unavailable';}
 function translate(){
   $('podium-open-label').textContent=t('open');$('podium-title').textContent=t(pending?'qualified':'title');$('podium-map').textContent=mapName();
   $('podium-close').setAttribute('aria-label',t('close'));
   $('podium-list-status').textContent=listState==='loading'?t('loading'):listState==='error'?t('unavailable'):entries.length?'':t('empty');
   $('podium-reload').textContent=t('retry');$('podium-reload').hidden=listState!=='error';
   $('podium-rules').textContent=t('rules');$('nickname-prompt').textContent=t('prompt');$('nickname-label').textContent=t('label');$('nickname-privacy').textContent=t('privacy');
   $('nickname-score').textContent=pending?`${t('score')} : ${pending.score}%`:'';
   $('nickname-save').textContent=t(busy?'saving':'save');$('nickname-save').disabled=busy;
   $('nickname-skip').textContent=t('skip');$('nickname-form').hidden=!pending;
   $('nickname-error').textContent=formError?t(formError):'';
   $('world-score-status').textContent=status?t(status):'';
   $('world-score-retry').textContent=t(pending?'pending':'retry');$('world-score-retry').hidden=busy||!submission||(!pending&&!['unavailable','rate','expired'].includes(status));
 }
 async function refresh(){
   if(!current)return;const ticket=++loadSequence,map=current.id;listState='loading';translate();
   try{const data=await api(null,map);if(ticket!==loadSequence)return;
     if(!Array.isArray(data.entries))throw Error('unavailable');entries=data.entries.slice(0,3);listState='ready';
     $('podium-list').replaceChildren();for(const [i,entry] of entries.entries()){
       const row=document.createElement('li'),rank=document.createElement('span'),name=document.createElement('span'),score=document.createElement('strong');
       rank.textContent=['🥇','🥈','🥉'][i];name.textContent=String(entry.nickname);score.textContent=`${entry.score}%`;row.append(rank,name,score);$('podium-list').append(row);
     }
   }catch{if(ticket!==loadSequence)return;listState='error';}
   translate();
 }
 function open(){if(!dialog.open)dialog.showModal();translate();void refresh();if(pending)$('nickname').focus();}
 async function evaluate(){
   if(!submission||busy)return;const ticket=sequence,body=submission;busy=true;status='checking';translate();
   try{const result=await api(body);if(ticket!==sequence)return;
     pending=result.qualified?{attemptId:result.attemptId,score:result.score}:null;
     status=pending?'qualified':'notQualified';formError='';if(pending){$('nickname').value='';open();}
   }catch(error){if(ticket!==sequence)return;status=errorKey(error);}
   finally{if(ticket===sequence){busy=false;translate();}}
 }
 $('podium-open').onclick=open;$('podium-close').onclick=()=>dialog.close();$('nickname-skip').onclick=()=>dialog.close();$('podium-reload').onclick=refresh;
 $('world-score-retry').onclick=()=>pending?open():evaluate();
 $('nickname-form').addEventListener('submit',async event=>{
   event.preventDefault();if(!pending||busy)return;
   const nickname=$('nickname').value.normalize('NFC').trim();
   if(!/^[\p{L}\p{N} _.'’\-]{1,20}$/u.test(nickname)){formError='invalid';translate();return;}
   const ticket=sequence,attempt=pending;busy=true;formError='';translate();
   try{const result=await api({action:'claim',attemptId:attempt.attemptId,nickname});if(ticket!==sequence)return;
     pending=null;status=result.accepted?'saved':'missed';await refresh();
   }catch(error){if(ticket!==sequence)return;formError=errorKey(error);status=formError;if(formError==='expired'){pending=null;if(submission)submission.requestId=crypto.randomUUID();}}
   finally{if(ticket===sequence){busy=false;translate();}}
 });
 return {
   setMap(config){sequence++;loadSequence++;current=config;entries=[];listState='idle';pending=null;submission=null;busy=false;status='';formError='';$('podium-list').replaceChildren();dialog.close();translate();},
   submit(config,strokes){if(current?.id!==config.id)return;sequence++;pending=null;busy=false;formError='';submission={action:'evaluate',map:config.id,requestId:crypto.randomUUID(),strokes:structuredClone(strokes)};void evaluate();},
   translate,
 };
}
