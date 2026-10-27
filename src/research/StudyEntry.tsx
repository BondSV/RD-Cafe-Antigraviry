import React, { useState } from 'react';
import { choosePractice, joinStudy, retryInitialise, useRecording } from './recording';
export default function StudyEntry(){
 const {ready,config,error}=useRecording();const [agreed,setAgreed]=useState(false);const [busy,setBusy]=useState(false);const [problem,setProblem]=useState('');
 const join=async()=>{setBusy(true);setProblem('');try{await joinStudy();}catch(e){setProblem(e instanceof Error?e.message:'Could not connect');}finally{setBusy(false);}};
 return <main className="study-entry"><article className="study-sheet">
  <h1>RainyDay Café</h1><h2>Classroom research session</h2>
  <p>We are studying how students make decisions and use feedback while playing the café simulation. Taking part is optional and does not affect your assessment or marks.</p>
  <p>If you take part, the game records your choices, results, repeated attempts, information opened and interaction timings. You will be assigned one of two versions of the game for this session.</p>
  <p>We do not ask for your name, email or student number. A random code links your attempts during this classroom session. Keep the code if you are invited to discuss your experience afterwards. The code and records remain available to the research team for analysis.</p>
  <p>You can stop recording or delete your records using the study controls during play. You can also ask the tutor about participation or your records using your code. Please ask the tutor if you have any questions before starting.</p>
  {!ready?<p role="status">Connecting to the classroom session…</p>:config&&config.open?<>
   <label className="study-agreement"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/> <span>I have read this information and agree to my gameplay being recorded for this study.</span></label>
   <button className="study-primary" disabled={!agreed||busy} onClick={join}>{busy?'Joining…':'Take part and continue'}</button>
  </>:<p>{config?'This research session has ended. You can still play the game.':'Study recording is unavailable.'}</p>}
  {(problem||error)&&<p className="study-error" role="alert">{problem||error}</p>}
  {ready&&!config&&<button className="study-secondary" onClick={retryInitialise}>Retry connection</button>}
  <button className="study-secondary" disabled={busy} onClick={choosePractice}>Play without recording</button>
 </article></main>;
}
