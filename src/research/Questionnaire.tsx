import {RESEARCH_VERSION} from './version';
import React, {useEffect,useState} from 'react';
import { clearPendingForWithdrawal, finalisePlaying, practiceAfterFinish, useRecording } from './recording';
const CONSENT='questionnaire-2026-10-27-v1';
type Draft={token:string;id:string;answers:string[];agreed:boolean;submittedAt?:string;queued?:boolean;respondentCode?:string;withdrawn?:boolean};
export default function Questionnaire(){
 const {config,participant}=useRecording();const recordsWithdrawn=useRecording(s=>s.error==='These research records were withdrawn.');const key='rd-questionnaire:'+config?.session;
 const [draft,setDraft]=useState<Draft>(()=>{try{const saved=localStorage.getItem(key);if(saved)return JSON.parse(saved);}catch{}return {token:crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,''),id:crypto.randomUUID(),answers:['','','','',''],agreed:false};});
 const [agreed,setAgreed]=useState(false);const [skipped,setSkipped]=useState(()=>localStorage.getItem(key+':skipped')==='true');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const save=(next:Draft)=>{setDraft(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{setError('The draft could not be retained on this device. Keep this tab open until your response is saved.');}};
 const consent=()=>{if(agreed)save({...draft,agreed:true});};
 const submit=async()=>{
  if(busy||!draft.agreed)return;if(!draft.answers.some(a=>a.trim())){setError('Answer at least one question before submitting.');return;}
  setBusy(true);setError('');save({...draft,queued:true});
  try{
   await finalisePlaying();
   const enrol=await fetch('/api/research/questionnaire/enrol',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:draft.token,session:config!.session,consent:true,consentVersion:CONSENT,instrumentVersion:config!.instrumentVersion,gameVersion:RESEARCH_VERSION,...(participant?{gameplayToken:participant.token}:{finishContext:JSON.parse(localStorage.getItem('rd-finish:'+config!.session)||'{}')})})});
   const person=await enrol.json();if(!enrol.ok){if(enrol.status===410){clearPendingForWithdrawal();setDraft({...draft,answers:['','','','',''],queued:false,withdrawn:true});}throw Error(person.error||'Could not connect');}
   const response=await fetch('/api/research/questionnaire',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+draft.token},body:JSON.stringify({id:draft.id,instrumentVersion:config!.instrumentVersion,answers:draft.answers})});const result=await response.json();
   if(!response.ok){if(response.status===410){clearPendingForWithdrawal();setDraft({...draft,answers:['','','','',''],queued:false,withdrawn:true});}throw Error(result.error||'Could not save your response');}
   save({...draft,queued:false,submittedAt:result.submittedAt,respondentCode:person.code});
  }catch(e){setError((e instanceof Error?e.message:'Could not connect')+' Your response has not been confirmed. Keep this tab open and retry when connected.');}finally{setBusy(false);}
 };
 useEffect(()=>{if(draft.queued&&!draft.submittedAt&&!busy){const retry=()=>{if(navigator.onLine)void submit();};window.addEventListener('online',retry);const timer=window.setInterval(retry,5000);return()=>{window.removeEventListener('online',retry);window.clearInterval(timer);};}},[draft,busy]);
 useEffect(()=>{void finalisePlaying().catch(()=>{});if(draft.agreed){void fetch('/api/research/questionnaire/status',{headers:{Authorization:'Bearer '+draft.token}}).then(async r=>{if(r.status===410){clearPendingForWithdrawal();setDraft({...draft,answers:['','','','',''],queued:false,withdrawn:true});}}).catch(()=>{});}},[]);
 useEffect(()=>{if(recordsWithdrawn)setDraft(d=>({...d,answers:['','','','',''],queued:false,withdrawn:true}));},[recordsWithdrawn]);
 const skip=()=>{localStorage.setItem(key+':skipped','true');localStorage.removeItem(key);setDraft(d=>({...d,queued:false,answers:['','','','','']}));setSkipped(true);};
 return <main className="study-entry"><article className="study-sheet">
  <h1>{draft.withdrawn?'Records withdrawn':draft.submittedAt?'Response saved':skipped?'Playing session finished':'Your playing session'}</h1>
  {draft.withdrawn?<p>Your pending answers have been cleared from this device. Please ask the researcher about any record request.</p>:draft.submittedAt?<><p>Your questionnaire has been received.</p>{participant?<p>Keep your study code <strong>{participant.code}</strong> for any discussion with the researcher.</p>:<p>Keep your questionnaire reference <strong>{draft.respondentCode}</strong> for any discussion with the researcher.</p>}</>:skipped?<p>No questionnaire response was submitted.</p>:<>
   <h2>About five minutes to reflect</h2><p>Think about the whole playing session, including all your attempts, rather than only your last run. Your answers are not assessed. Please do not include anyone’s name, student number or other identifying details.</p>
   {!draft.agreed?<><p>This questionnaire is a separate research contribution. It asks about your decisions and how you interpreted the game. You may skip individual questions or the whole form.</p>
    <p>{participant?'If you agree, your answers will be linked by your study code to all recorded attempts in this classroom session.':'Your answers will use an independent random code. No unrecorded gameplay will be uploaded retrospectively.'} The research team can read and export the responses. You may request removal of linked research records until at least 14 calendar days after your final research contribution. A later interview can extend that date. Ask the researcher named in your participant information using {participant?'your study code':'the questionnaire reference shown after submission'}.</p>
    <p>The primary database and backups are currently on a server operated by the game’s developer. This is not University storage.</p>
    <label className="study-agreement"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I agree to my questionnaire answers being used for this research{participant?' and linked to my recorded gameplay for this session':''}.</span></label>
    <button className="study-primary" disabled={!agreed} onClick={consent}>Open questionnaire</button>
   </>:<form onSubmit={e=>{e.preventDefault();void submit();}}>
    {(config?.questions||[]).map((q,i)=><label className="questionnaire-question" key={q}><span>{i+1}. {q}</span><textarea rows={5} maxLength={2000} value={draft.answers[i]} onChange={e=>{const answers=[...draft.answers];answers[i]=e.target.value;save({...draft,answers,queued:false});}} disabled={busy}/><small>{draft.answers[i].length}/2,000 characters. Optional.</small></label>)}
    <button className="study-primary" disabled={busy}>{busy?'Saving response…':draft.queued?'Retry submission':'Submit questionnaire'}</button>
   </form>}
   {!draft.agreed&&<button className="study-secondary" disabled={busy} onClick={skip}>Skip questionnaire</button>}
  </>}
  {error&&<p className="study-error" role="alert">{error}</p>}
  {(skipped||draft.submittedAt||draft.withdrawn)&&<button className="study-primary" onClick={practiceAfterFinish}>Continue with unrecorded practice</button>}
 </article></main>;
}
