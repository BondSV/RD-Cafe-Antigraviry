import {RESEARCH_VERSION} from './version';
import { create } from 'zustand';
import { GameState } from '../types/game';

export type Condition = 'control' | 'preview';
export type StudyConfig = {version:string;session:string;closesAt:string;open:boolean;consentVersion:string};
export type Participant = {id:string;code:string;condition:Condition;session:string;version:string;token:string;test?:boolean};
type Event = {version:string;id:string;runId:string;pageId:string;seq:number;elapsedMs:number;clientAt:string;type:string;actions:string[];data:Record<string,unknown>};
type RecordingState = {config:StudyConfig|null;participant:Participant|null;ready:boolean;choice:'pending'|'study'|'practice';pending:number;error:string;storageError:boolean};
export const useRecording = create<RecordingState>(()=>({config:null,participant:null,ready:false,choice:'pending',pending:0,error:'',storageError:false}));
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
 const p=useRecording.getState().participant;if(!p||!runId)return;
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
   while(q.length){const batch=q.slice(0,10);const response=await fetch('/api/research/events',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+p.token},body:JSON.stringify({version:batch[0].version,events:batch}),keepalive:true});
    if(!response.ok){const b=await response.json();throw Error(b.error||'Recording is temporarily unavailable');}
    const b=await response.json();if(!Array.isArray(b.accepted)||batch.some(e=>!b.accepted.includes(e.id)))throw Error('The server did not confirm these records');
    q.splice(0,batch.length);persist(key);
   }
  }
  useRecording.setState({error:''});
 }catch(e){useRecording.setState({error:e instanceof Error?e.message:'Recording is temporarily unavailable'});}finally{busy=false;}
}
function activate(p:Participant){
 useRecording.setState({participant:p,choice:'study',error:''});
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(queuePrefix(p))){const q=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(q)&&q.length)queues.set(key,q);}}}catch{useRecording.setState({storageError:true});}
 useRecording.setState({pending:count()});
 recordLifecycle();void flush();
}
let initialising:Promise<void>|null=null;
export function initialiseResearch(){
 if(initialising)return initialising;
 initialising=(async()=>{
  try{
   const r=await fetch('/api/research/config',{cache:'no-store'});if(!r.ok)throw Error();const config:StudyConfig=await r.json();useRecording.setState({config});if(config.version!==RESEARCH_VERSION)throw Error('The game has been updated. Reload this page before joining.');
   const saved=storage.get(participantKey(config.session));
   if(saved){const v=JSON.parse(saved);if(v.declined){useRecording.setState({choice:'practice'});}else if(v.token){
    const response=await fetch('/api/research/enrol',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v.token,consentVersion:config.consentVersion})});
    if(response.ok){const p=await response.json();activate({...p,token:v.token});if(!config.open){await flush();useRecording.setState({participant:null,choice:'practice'});}}else if(response.status===410){useRecording.setState({choice:'practice'});}else throw Error();
   }}else if(!config.open)useRecording.setState({choice:'practice'});
  }catch(e){useRecording.setState({error:e instanceof Error&&e.message?e.message:'Study recording could not connect. Retry, or play without recording.'});}
  finally{useRecording.setState({ready:true});}
 })();return initialising;
}
export async function joinStudy(){
 const config=useRecording.getState().config;if(!config)throw Error('Study recording is unavailable. Please retry.');if(config.version!==RESEARCH_VERSION)throw Error('The game has been updated. Reload this page before joining.');
 const token=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
 // Persist before enrolment so a retry cannot silently assign a different version.
 const key=participantKey(config.session);const saved=storage.get(key);let previous=saved?JSON.parse(saved):null;
 const credential=previous?.token||token;
 try{storage.set(key,JSON.stringify({token:credential}));}catch{throw Error('This browser cannot retain your study code. Enable browser storage or play without recording.');}
 const r=await fetch('/api/research/enrol',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:credential,consentVersion:config.consentVersion})});
 const body=await r.json();if(!r.ok)throw Error(body.error||'Could not join the study');activate({...body,token:credential});
}
export function choosePractice(){const config=useRecording.getState().config;if(config)try{storage.set(participantKey(config.session),JSON.stringify({declined:true}));}catch{}useRecording.setState({choice:'practice',error:''});}
export function retryInitialise(){initialising=null;useRecording.setState({ready:false,error:''});void initialiseResearch();}
export async function endParticipation(remove:boolean){
 const p=useRecording.getState().participant;if(!p)return;
 if(!remove){await flush();if(count())throw Error('Some records are still waiting to save. Reconnect and retry, or choose delete records.');}
 const response=await fetch('/api/research/'+(remove?'withdraw':'stop'),{method:'POST',headers:{Authorization:'Bearer '+p.token}});
 if(!response.ok)throw Error('Could not end recording. Check your connection and retry.');
 for(const key of queues.keys())localStorage.removeItem(key);queues.clear();
 storage.set(participantKey(p.session),JSON.stringify({declined:true}));
 useRecording.setState({participant:null,choice:'practice',pending:0,error:'',storageError:false});
}
let lifecycle=false;
function recordLifecycle(){if(lifecycle)return;lifecycle=true;
 document.addEventListener('visibilitychange',()=>record('page_visibility',{visible:document.visibilityState==='visible'}));
 window.addEventListener('pagehide',()=>record('page_exit'));
 window.addEventListener('online',()=>void flush());
 setInterval(()=>void flush(),3000);
}
