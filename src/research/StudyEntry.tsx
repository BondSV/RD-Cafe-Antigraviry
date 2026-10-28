import React, { useState } from 'react';
import { chooseUnrecorded, joinStudy, retryInitialise, startNewBrowserSession, useRecording } from './recording';
export default function StudyEntry(){
 const {ready,config,error,inactive}=useRecording();const [busy,setBusy]=useState(false);const [consent,setConsent]=useState(false);const [problem,setProblem]=useState('');
 const join=async()=>{setBusy(true);setProblem('');try{await joinStudy();}catch(e){setProblem(e instanceof Error?e.message:'Could not connect');}finally{setBusy(false);}};
 return <main className="study-entry"><article className="study-sheet">
  <h1>RainyDay Café</h1>{config?.sessionInfo&&<p className="study-session-label">{config.sessionInfo.label}{config.sessionInfo.group_label?' · '+config.sessionInfo.group_label:''}{config.sessionInfo.intake?' · '+config.sessionInfo.intake:''}</p>}<h2>{config?.testMode?'Test session':'Classroom research session'}</h2>{config?.testMode&&<p className="study-test-note"><strong>Test environment.</strong> Your runs and questionnaire responses are kept separately from the classroom research dataset. <a href="/test">Test predictions</a> · <a href="/test?session=rd-test-control">Test after-action feedback</a></p>}
  {config?.testMode?<p>This link tests {config.session==='rd-test-control'?'feedback after commitment':'predictions before commitment'}. The version stays the same across attempts.</p>:<>
  <p><strong>Your gameplay is recorded under a random code, without your name.</strong> We do not collect names, emails or student numbers. The code links your attempts during this session.</p>
  <p><strong>You choose whether to identify your code.</strong> Interviews are optional. If you choose to share your code with the interviewer, they can link your gameplay to you.</p>
  <p>{config?.participation==='voluntary'?'Contributing gameplay records is optional.':'Gameplay recording is required for this classroom session.'} We record choices, results, information viewed and timings for research. Your game version is randomly assigned and stays the same across attempts.</p></>}
  {inactive?<><p>This saved session has been cleared. Start a new session to continue with a new code.</p>{config?.open&&<button className="study-primary" onClick={startNewBrowserSession}>Start a new session</button>}</>:!ready?<p role="status">Connecting to the classroom session…</p>:config&&config.open?
   <>{config.participation==='voluntary'&&<label className="study-agreement"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to my recorded gameplay being used for this research.</span></label>}<button className="study-primary" disabled={busy||!!error||(config.participation==='voluntary'&&!consent)} onClick={join}>{busy?'Connecting…':'Continue to simulation'}</button>{config.participation==='voluntary'&&<button className="study-secondary" onClick={chooseUnrecorded}>Play without contributing gameplay data</button>}</>
   :<p>{config?'This research session has ended.':'Study recording is unavailable.'}</p>}
  {(problem||error)&&<p className="study-error" role="alert">{problem||error}</p>}
  {ready&&(error||!config)&&<button className="study-secondary" onClick={retryInitialise}>Retry connection</button>}
 </article></main>;
}
