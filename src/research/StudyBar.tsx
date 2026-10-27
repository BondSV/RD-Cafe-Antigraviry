import React, { useState } from 'react';
import { endParticipation, flush, useRecording } from './recording';
export default function StudyBar(){
 const {participant,pending,error,storageError}=useRecording();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [problem,setProblem]=useState('');
 if(!participant)return null;
 const end=async(remove:boolean)=>{setBusy(true);setProblem('');try{await endParticipation(remove);}catch(e){setProblem(e instanceof Error?e.message:'Could not end recording');}finally{setBusy(false);}};
 return <aside className="study-bar" aria-label="Research recording"><div className="study-bar-line">
  <span>Study code <strong>{participant.code}</strong></span>
  <span role="status">{error||storageError?'Recording needs attention':pending?'Saving…':'Records saved'}</span>
  <button onClick={()=>setOpen(!open)} aria-expanded={open}>Study controls</button>
 </div>{(error||storageError)&&<p className="study-error">{error||'Browser storage is full. Keep this tab open until all records are saved.'} Your unsent records are waiting on this device. <button onClick={()=>void flush()}>Retry saving</button></p>}
 {open&&<div className="study-controls"><p>Keep your study code for any later discussion. Recording applies only to this classroom session. To switch players on a shared device, ask the tutor to start a new browser session.</p>
  <button disabled={busy} onClick={()=>void end(false)}>Stop recording, keep saved records</button>
  <button disabled={busy} onClick={()=>void end(true)}>Delete my records and stop recording</button>
  {problem&&<p className="study-error" role="alert">{problem}</p>}
 </div>}</aside>;
}
