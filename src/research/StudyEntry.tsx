import React, { useState } from 'react';
import { chooseUnrecorded, joinStudy, retryInitialise, useRecording } from './recording';
export default function StudyEntry(){
 const {ready,config,error}=useRecording();const [busy,setBusy]=useState(false);const [consent,setConsent]=useState(false);const [problem,setProblem]=useState('');
 const join=async()=>{setBusy(true);setProblem('');try{await joinStudy();}catch(e){setProblem(e instanceof Error?e.message:'Could not connect');}finally{setBusy(false);}};
 return <main className="study-entry"><article className="study-sheet">
  <h1>RainyDay Café</h1>{config?.sessionInfo&&<p className="study-session-label">{config.sessionInfo.label}{config.sessionInfo.group_label?' · '+config.sessionInfo.group_label:''}{config.sessionInfo.intake?' · '+config.sessionInfo.intake:''}</p>}<h2>Classroom research session</h2>
  <p>{config?.participation==='voluntary'?'Contributing gameplay records to this classroom research session is optional.':'Gameplay recording is required for this classroom research session.'} We are studying how students make decisions and use feedback while playing the café simulation.</p>
  <p>The game records your choices, results, repeated attempts, information opened and interaction timings. You will be assigned one of two versions of the game for this session.</p>
  <p>We do not ask for your name, email or student number. A random code links your attempts during this classroom session. Keep the code if you are invited to discuss your experience afterwards. The code and records remain available to the research team for analysis.</p>
  <p>Please ask the tutor if you have questions about the recording or your records. Use your study code when discussing any record request with the tutor.</p>
  {!ready?<p role="status">Connecting to the classroom session…</p>:config&&config.open?
   <>{config.participation==='voluntary'&&<label className="study-agreement"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to my recorded gameplay being used for this research.</span></label>}<button className="study-primary" disabled={busy||!!error||(config.participation==='voluntary'&&!consent)} onClick={join}>{busy?'Connecting…':'Continue to simulation'}</button>{config.participation==='voluntary'&&<button className="study-secondary" onClick={chooseUnrecorded}>Play without contributing gameplay data</button>}</>
   :<p>{config?'This research session has ended.':'Study recording is unavailable.'}</p>}
  {(problem||error)&&<p className="study-error" role="alert">{problem||error}</p>}
  {ready&&(error||!config)&&<button className="study-secondary" onClick={retryInitialise}>Retry connection</button>}
 </article></main>;
}
