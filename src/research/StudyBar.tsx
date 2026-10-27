import React, { useState } from 'react';
import { finishPlaying, flush, useRecording } from './recording';
export default function StudyBar(){
 const {participant,pending,error,storageError,phase,config}=useRecording();const [open,setOpen]=useState(false);
 if(phase==='practice'||!config?.open)return null;
 if(!participant)return <aside className="study-bar"><div className="study-bar-line"><span>{phase==='finished'?'Playing session finished':'Unrecorded play'}</span>{phase==='playing'&&<button onClick={finishPlaying}>Finish playing</button>}</div></aside>;
 return <aside className="study-bar" aria-label="Research recording"><div className="study-bar-line">
  <span>Study code <strong>{participant.code}</strong></span>
  <span role="status">{error||storageError?'Recording needs attention':pending?'Saving…':'Records saved'}</span>
  {phase==='playing'&&<button className="study-finish" onClick={finishPlaying}>Finish playing</button>}
  <button onClick={()=>setOpen(!open)} aria-expanded={open}>About recording</button>
 </div>{(error||storageError)&&<p className="study-error">{error||'Browser storage is full. Keep this tab open until all records are saved.'} Your unsent records are waiting on this device. <button onClick={()=>void flush()}>Retry saving</button></p>}
 {open&&<div className="study-controls"><p>{config.participation==='required'?'Recording is required for this classroom session.':'Your gameplay is being recorded for this classroom research session.'} Keep your study code for any later discussion. Ask the tutor about your records using this code. To switch players on a shared device, ask the tutor to start a new browser session.</p></div>}</aside>;
}
