import ResearchSessions from './ResearchSessions';
import React, { useState,useEffect } from 'react';
import { metricLabels } from '../data/labels';
import { SCORE_METRIC_KEYS } from '../engine/getSystemScore';
import { actions } from '../data/actions';

type Run={id:string;participant_id:string;started_at:string;action_count:number;status:string};
type Person={id:string;condition:string;created_at:string;stopped:number;session:string};
type ResearchEvent={id:string;type:string;elapsed_ms:number;client_at:string;data:any};
export default function ResearchDashboard(){
 const [details,setDetails]=useState<any>({});const [classroom,setClassroom]=useState('');
 const [key,setKey]=useState('');const [people,setPeople]=useState<Person[]>([]);const [runs,setRuns]=useState<Run[]>([]);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [filter,setFilter]=useState('');const [run,setRun]=useState('');const [events,setEvents]=useState<ResearchEvent[]>([]);const [index,setIndex]=useState(0);
 const request=async(path:string)=>{const r=await fetch('/api/research/admin/'+path+(classroom?'?session='+encodeURIComponent(classroom):''),{headers:{Authorization:'Bearer '+key},cache:'no-store'});if(!r.ok){const b=await r.json();throw Error(b.error||'Could not load research data');}return r;};
 const refresh=async()=>{setBusy(true);setError('');try{const r=await request('summary');const d=await r.json();setDetails(d);const p=d.participants.filter((p:any)=>!classroom||p.session===classroom);setPeople(p);setRuns(d.runs.filter((r:any)=>p.some((p:any)=>p.id===r.participant_id)));setLoaded(true);}catch(e){setError(e instanceof Error?e.message:'Could not connect');}finally{setBusy(false);}};
 useEffect(()=>{if(loaded)void refresh();},[classroom]);
 const replay=async(id:string)=>{setRun(id);setIndex(0);setError('');try{const r=await request('replay/'+id);const d=await r.json();setEvents(d.events.filter((e:ResearchEvent)=>['candidate_opened','candidate_cancelled','action_committed','feedback_shown','feedback_dismissed','summary_shown','run_restarted'].includes(e.type)));}catch(e){setError(String(e));}};
 const download=async(path:string,name:string)=>{setError('');try{const r=await request(path);const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(String(e));}};
 const remove=async(person:Person)=>{if(!window.confirm('Delete all gameplay records for study code '+person.id.slice(0,8).toUpperCase()+'? This also removes this participant from server backups.'))return;setError('');try{const r=await fetch('/api/research/admin/withdraw',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({participantId:person.id})});if(!r.ok)throw Error('Records could not be deleted');setRun('');setEvents([]);await refresh();}catch(e){setError(String(e));}};
 const selected=events[index];const snapshot=selected?.data.prediction||selected?.data.snapshot;const title=selected?.data.actionId?actions.find(a=>a.id===selected.data.actionId)?.title:null;
 return <main className="research-dashboard"><h1>RainyDay Café research</h1>
 {!loaded?<form className="research-login" onSubmit={e=>{e.preventDefault();void refresh();}}><label htmlFor="research-key">Researcher access key</label><input id="research-key" type="password" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" required/><button className="study-primary" disabled={busy}>{busy?'Connecting…':'Open research records'}</button><p>Access is restricted to the research team. The key stays in this tab and is not included in downloads.</p></form>:<>
  <div className="research-toolbar"><button className="study-primary" onClick={()=>void refresh()} disabled={busy}>Refresh records</button><button onClick={()=>void download('export','rainyday-research.json')}>Download full JSON</button><button onClick={()=>void download('turns.csv','rainyday-turns.csv')}>Download decisions CSV</button><button onClick={()=>void download('events.csv','rainyday-events.csv')}>Download events CSV</button><button onClick={()=>void download('questionnaires.csv','rainyday-questionnaires.csv')}>Download questionnaires CSV</button><button onClick={()=>{setLoaded(false);setKey('');setPeople([]);setRuns([]);setEvents([]);}}>Lock records</button></div>
  <ResearchSessions data={details} accessKey={key} onRefresh={refresh} selected={classroom} onSelect={setClassroom}/>
  <p>{people.length} {people.length===1?'participant':'participants'} · {runs.length} {runs.length===1?'run':'runs'} · {runs.filter(r=>r.status==='completed').length} completed runs · {(details.sessionFinishes||[]).length} finished playing sessions. Test records are excluded.</p>
  <label htmlFor="code-filter">Find a study code</label><input id="code-filter" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Enter the eight-character code" autoComplete="off"/>
  <div className="research-table-wrap"><table><thead><tr><th>Study code</th><th>Version</th><th>Runs</th><th>Completed</th><th>Replay</th><th>Records</th></tr></thead><tbody>
   {people.filter(p=>p.id.replace(/-/g,'').toUpperCase().startsWith(filter.replace(/-/g,'').toUpperCase())).map(p=>{const own=runs.filter(r=>r.participant_id===p.id);return <tr key={p.id}><td>{p.id.slice(0,8).toUpperCase()}{p.stopped?' (stopped)':''}</td><td>{p.condition==='preview'?'Predictions':'After-action feedback'}</td><td>{own.length}</td><td>{own.filter(r=>r.status==='completed').length}</td><td>{own.length?<select aria-label={'Replay run for '+p.id.slice(0,8)} value={own.some(r=>r.id===run)?run:''} onChange={e=>void replay(e.target.value)}><option value="" disabled>Select a run</option>{own.map((r,i)=><option key={r.id} value={r.id}>Run {i+1}: {r.action_count}/7 decisions, {r.status.replace(/_/g,' ')}</option>)}</select>:'No run started'}</td><td><button className="study-secondary" onClick={()=>void remove(p)}>Delete records</button></td></tr>;})}
  </tbody></table></div>
  {!people.length&&<p>No participant records yet. Records appear when a student enters a recorded classroom session.</p>}
  {run&&<section className="research-replay"><h2>Decision replay</h2><p>This reconstructs the recorded decisions, predictions and feedback. It does not reproduce the original customer animation.</p>
   {events.length>0?<><label htmlFor="replay-event">Recorded moment</label><select id="replay-event" value={index} onChange={e=>setIndex(Number(e.target.value))}>{events.map((e,i)=><option value={i} key={e.id}>{i+1}. {(e.elapsed_ms/1000).toFixed(1)}s: {e.type.replace(/_/g,' ')}{e.data.actionId?' – '+actions.find(a=>a.id===e.data.actionId)?.title:''}</option>)}</select>
   <div className="research-toolbar"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button disabled={index===events.length-1} onClick={()=>setIndex(i=>i+1)}>Next</button></div>
   <h3>{selected.type.replace(/_/g,' ')}{title?' · '+title:''}</h3>
   {snapshot&&<><p>{selected.data.prediction?'Predicted':'Recorded'} System Score: <strong>{snapshot.score.toFixed(1)}</strong></p><dl className="study-metrics">{SCORE_METRIC_KEYS.map(k=><div key={k}><dt>{metricLabels[k]}</dt><dd>{Math.round(snapshot.displayMetrics[k])}</dd></div>)}</dl><p>{snapshot.history.at(-1)?.eventText}</p><h3>Interventions in this state</h3><ol>{snapshot.actionsTaken.map((id:string)=><li key={id}>{actions.find(a=>a.id===id)?.title}</li>)}</ol></>}
   </>:<p>No decision events in this run yet.</p>}
  </section>}
 </>}{error&&<p className="study-error" role="alert">{error}</p>}
 </main>;
}
