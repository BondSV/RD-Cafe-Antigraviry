import {researchApi,isTestRoute} from './api';
import {RESEARCH_VERSION} from './version';
import { create } from 'zustand';
import { GameState } from '../types/game';

export type Condition = 'control' | 'preview';
export type StudyConfig = {version:string;session:string;closesAt:string;open:boolean;noticeVersion:string;participation:'required'|'voluntary';instrumentVersion:string;questions:string[];testMode:boolean;sessionInfo:{label:string;module:string;group_label:string;intake:string}};
export type Participant = {id:string;code:string;condition:Condition;session:string;version:string;token:string;test?:boolean;noticeVersion?:string;finishedAt?:string|null};
type Event = {version:string;id:string;runId:string;pageId:string;seq:number;elapsedMs:number;clientAt:string;type:string;actions:string[];data:Record<string,unknown>};
type RecordingState = {config:StudyConfig|null;participant:Participant|null;ready:boolean;choice:'pending'|'study'|'outside-session';pending:number;error:string;storageError:boolean;inactive:boolean;phase:'playing'|'finished'|'practice'};
export const useRecording = create<RecordingState>(()=>({config:null,participant:null,ready:false,choice:'pending',pending:0,error:'',storageError:false,inactive:false,phase:'playing'}));
const PAGE=crypto.randomUUID();
let seq=0,runId='',actionIds:string[]=[],startedAt=performance.now(),busy=false;
const queues=new Map<string,Event[]>();
const participantKey=(session:string)=>'rd-study:'+session;
const queuePrefix=(p:Participant)=>'rd-outbox:'+p.session+':'+p.id+':';
const queueKey=(p:Participant)=>queuePrefix(p)+PAGE;
const storage={get:(key:string)=>{try{return localStorage.getItem(key)}catch{return null}},set:(key:string,value:string)=>{localStorage.setItem(key,value)}};
function count(){return [...queues.values()].reduce((n,q)=>n+q.length,0)}
function persist(key:string){try{const q=queues.get(key)||[];if(q.length)storage.set(key,JSON.stringify(q));else localStorage.removeItem(key);}catch{useRecording.setState({storageError:true});}useRecording.setState({pending:count()});}
export function record(type:string,data:Record<string,unknown>={}){
 const p=useRecording.getState().participant;if(!p||!runId||useRecording.getState().phase!=='playing')return;
 const key=queueKey(p);const q=queues.get(key)||[];
 q.push({version:RESEARCH_VERSION,id:crypto.randomUUID(),runId,pageId:PAGE,seq:++seq,elapsedMs:Math.round(performance.now()-startedAt),clientAt:new Date().toISOString(),type,actions:[...actionIds],data});queues.set(key,q);persist(key);void flush();
}
export function updateRecordedActions(state:GameState){actionIds=[...state.actionsTaken];}
export function beginRun(){if(runId)record('run_restarted');runId=crypto.randomUUID();actionIds=[];record('run_started');}
export function currentRun(){return runId;}
export function recordOnce(key:string,type:string,data:Record<string,unknown>={}){const id=runId+':'+key;if(seen.has(id))return;seen.add(id);record(type,data);}
const seen=new Set<string>();
export async function flush(){
 const p=useRecording.getState().participant;if(!p||busy||!navigator.onLine)return;
 busy=true;
 try{
  for(const [key,q] of queues){
   while(q.length){const batch=q.slice(0,10);const response=await fetch(researchApi('events'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+p.token},body:JSON.stringify({version:batch[0].version,events:batch}),keepalive:true});
    if(!response.ok){const b=await response.json();if(response.status===410&&b.withdrawn){clearPendingForWithdrawal();return;}throw Error(b.error||'Recording is temporarily unavailable');}
    const b=await response.json();if(!Array.isArray(b.accepted)||batch.some(e=>!b.accepted.includes(e.id)))throw Error('The server did not confirm these records');
    q.splice(0,batch.length);persist(key);
   }
  }
  useRecording.setState({error:''});
 }catch(e){useRecording.setState({error:e instanceof Error?e.message:'Recording is temporarily unavailable'});}finally{busy=false;}
}
function activate(p:Participant){
 const finished=storage.get('rd-finish:'+p.session);
 useRecording.setState({participant:p,choice:'study',error:'',phase:finished||p.finishedAt?'finished':'playing'});
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(queuePrefix(p))){const q=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(q)&&q.length)queues.set(key,q);}}}catch{useRecording.setState({storageError:true});}
 useRecording.setState({pending:count()});
 recordLifecycle();void flush();
}
let initialising:Promise<void>|null=null;
export function initialiseResearch(){
 if(initialising)return initialising;
 initialising=(async()=>{
  try{
   const r=await fetch(researchApi('config')+(new URLSearchParams(location.search).has('session')?'?session='+encodeURIComponent(new URLSearchParams(location.search).get('session')!):''),{cache:'no-store'});if(!r.ok)throw Error();const config:StudyConfig=await r.json();if(!!config.testMode!==isTestRoute)throw Error('The selected environment is unavailable. No gameplay has been recorded.');useRecording.setState({config});if(config.version!==RESEARCH_VERSION)throw Error('The game has been updated. Reload this page before joining.');
   const saved=storage.get(participantKey(config.session));
   if(saved&&JSON.parse(saved).withdrawn){useRecording.setState({inactive:true,participant:null,choice:'pending',phase:'playing',error:''});return;}
   if(!config.open){
    if(saved){const v=JSON.parse(saved);if(v.declined&&config.participation==='voluntary'){useRecording.setState({choice:'outside-session',phase:storage.get('rd-finish:'+config.session)?'finished':'playing'});return;}if(v.token&&v.noticeVersion===config.noticeVersion){
     const response=await fetch(researchApi('enrol'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v.token,noticeVersion:config.noticeVersion,session:config.session,...(config.participation==='voluntary'?{gameplayConsent:true}:{})})});
     if(response.ok){activate({...await response.json(),token:v.token});await flush();}
    }}
    useRecording.setState({participant:null,choice:'outside-session'});return;
   }
   if(saved){const v=JSON.parse(saved);if(v.declined&&config.participation==='voluntary'){useRecording.setState({choice:'outside-session',phase:storage.get('rd-finish:'+config.session)?'finished':'playing'});return;}if(v.token&&v.noticeVersion===config.noticeVersion){
    const response=await fetch(researchApi('enrol'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v.token,noticeVersion:config.noticeVersion,session:config.session,...(config.participation==='voluntary'?{gameplayConsent:true}:{})})});
    if(response.ok){const p=await response.json();activate({...p,token:v.token});}else if(response.status===410){const ended=await response.json();if(ended.withdrawn)clearPendingForWithdrawal(ended.participantId);useRecording.setState({inactive:true,participant:null,choice:'pending',phase:'playing',error:''});return;}else throw Error('Could not restore recording. Retry the connection.');
   }}
  }catch(e){useRecording.setState({error:e instanceof Error&&e.message?e.message:'Study recording could not connect. Retry the connection before continuing.'});}
  finally{useRecording.setState({ready:true});}
 })();return initialising;
}
export async function joinStudy(){
 const config=useRecording.getState().config;if(!config)throw Error('Study recording is unavailable. Please retry.');if(config.version!==RESEARCH_VERSION)throw Error('The game has been updated. Reload this page before joining.');
 const token=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
 // Persist before enrolment so a retry cannot silently assign a different version.
 const key=participantKey(config.session);const saved=storage.get(key);let previous=saved?JSON.parse(saved):null;
 const credential=previous?.token||token;
 try{storage.set(key,JSON.stringify({token:credential,noticeVersion:config.noticeVersion,session:config.session,...(config.participation==='voluntary'?{gameplayConsent:true}:{})}));}catch{throw Error('This browser cannot retain your study code. Enable browser storage or ask the tutor for help.');}
 const r=await fetch(researchApi('enrol'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:credential,noticeVersion:config.noticeVersion,session:config.session,...(config.participation==='voluntary'?{gameplayConsent:true}:{})})});
 const body=await r.json();if(!r.ok){if(r.status===410&&(body.withdrawn||body.participantId)){if(body.withdrawn)clearPendingForWithdrawal(body.participantId);useRecording.setState({inactive:true,participant:null,choice:'pending',phase:'playing',error:''});return;}throw Error(body.error||'Could not join the study');}activate({...body,token:credential});
}
export function retryInitialise(){initialising=null;useRecording.setState({ready:false,error:''});void initialiseResearch();}
let finishPromise:Promise<void>|null=null;
let lifecycle=false;
function recordLifecycle(){if(lifecycle)return;lifecycle=true;
 window.addEventListener('storage',e=>{const config=useRecording.getState().config;if(config&&e.key==='rd-finish:'+config.session&&e.newValue)useRecording.setState({phase:'finished'});});
 document.addEventListener('visibilitychange',()=>record('page_visibility',{visible:document.visibilityState==='visible'}));
 window.addEventListener('pagehide',()=>record('page_exit'));
 window.addEventListener('offline',()=>useRecording.setState({error:'You are offline. Gameplay is saved on this device and will upload when you reconnect.'}));
 window.addEventListener('online',()=>{void flush().then(()=>{if(useRecording.getState().phase==='finished')void finalisePlaying().catch(()=>{});});});
 setInterval(()=>{void flush().then(()=>{if(useRecording.getState().phase==='finished')void finalisePlaying().catch(()=>{});});},3000);
}

export function finishPlaying(){
 const config=useRecording.getState().config;if(!config||useRecording.getState().phase!=='playing'||actionIds.length!==7)return;
 if(!window.confirm('Finish your whole playing session? You can try more runs with Play Again until you finish. Afterwards you will see the post-session questionnaire.'))return;
 if(!runId)beginRun();
 storage.set('rd-finish:'+config.session,JSON.stringify({id:crypto.randomUUID(),runId,clientAt:new Date().toISOString(),actions:[...actionIds]}));
 useRecording.setState({phase:'finished'});void finalisePlaying().catch(()=>{});
}
export function finalisePlaying():Promise<void>{
 if(finishPromise)return finishPromise;
 finishPromise=(async()=>{
 const {participant,config}=useRecording.getState();if(!participant||!config)return;
 const raw=storage.get('rd-finish:'+config.session);if(!raw)return;const finish=JSON.parse(raw);
 if(storage.get('rd-finish-ack:'+config.session)===finish.id)return;
 await flush();if(count())throw Error('Gameplay records are still waiting to save');
 const response=await fetch(researchApi('finish'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+participant.token},body:raw});
 const data=await response.json();if(!response.ok){if(response.status===410&&data.withdrawn)clearPendingForWithdrawal();throw Error(data.error||'Could not confirm the end of play');}storage.set('rd-finish-ack:'+config.session,finish.id);
 })().finally(()=>{finishPromise=null;});return finishPromise;
}
export function practiceAfterFinish(){useRecording.setState({phase:'practice'});}

export function clearPendingForWithdrawal(id?:string){
 const {config,participant}=useRecording.getState();if(!config)return;
 for(const key of queues.keys())localStorage.removeItem(key);queues.clear();
 const pid=id||participant?.id;if(pid){const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('rd-outbox:'+config.session+':'+pid+':'))keys.push(key);}for(const key of keys)localStorage.removeItem(key);}
 localStorage.removeItem('rd-questionnaire:'+config.session);
 localStorage.removeItem('rd-questionnaire:'+config.session+':skipped');
 storage.set(participantKey(config.session),JSON.stringify({id:pid,noticeVersion:config.noticeVersion,withdrawn:true}));
 useRecording.setState({pending:0,error:'These research records were withdrawn.',phase:'finished'});
}

export function chooseUnrecorded(){const config=useRecording.getState().config;if(!config||config.participation!=='voluntary')return;storage.set(participantKey(config.session),JSON.stringify({declined:true}));useRecording.setState({choice:'outside-session'});}

// Retire only this classroom/test registration; never clear unrelated browser storage.
export function startNewBrowserSession(){
 const {config}=useRecording.getState();if(!config)return;
 for(const key of [participantKey(config.session),'rd-finish:'+config.session,'rd-finish-ack:'+config.session,'rd-questionnaire:'+config.session,'rd-questionnaire:'+config.session+':skipped'])localStorage.removeItem(key);
 window.location.reload();
}
