import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { actions } from '../data/actions';
import { applyActionEngine } from '../engine/applyAction';
import { getSystemScore, SCORE_METRIC_KEYS } from '../engine/getSystemScore';
import { normaliseForDisplay } from '../engine/normaliseForDisplay';
import { metricLabels } from '../data/labels';
import { recordOnce, useRecording } from './recording';

export default function CandidateDialog(){
 const state=useGameStore();const {participant}=useRecording();const ref=useRef<HTMLDialogElement>(null);
 const candidate=actions.find(a=>a.id===state.selectedActionId);const preview=participant?.condition==='preview';
 const predicted=candidate&&preview?applyActionEngine(state,candidate):null;
 useEffect(()=>{const dialog=ref.current;if(!candidate||!dialog)return;dialog.showModal();recordOnce('candidate:'+state.selectionId,'candidate_opened',{actionId:candidate.id});return()=>{dialog.close();};},[state.selectionId,candidate?.id]);
 if(!candidate)return null;
 return <dialog ref={ref} className="study-dialog" aria-labelledby="candidate-heading" onCancel={e=>{e.preventDefault();state.cancelSelection();}}>
  <div className="study-dialog-body"><h2 id="candidate-heading">{candidate.title}</h2><p>{candidate.description}</p>
   {predicted?<section className="study-prediction"><h3>Predicted consequences</h3><dl className="study-metrics">
    {SCORE_METRIC_KEYS.map(key=>{const before=normaliseForDisplay(key,state.metrics[key]);const after=normaliseForDisplay(key,predicted.metrics[key]);const delta=Math.round(after)-Math.round(before);return <div key={key}><dt>{metricLabels[key]}</dt><dd>{Math.round(before)} → <strong>{Math.round(after)}</strong> <span className={delta>0?'study-good':delta<0?'study-bad':''}>({delta>0?'+':''}{delta})</span></dd></div>;})}
   </dl><p className="study-score-line">System Score: {getSystemScore(state.metrics).toFixed(1)} → <strong>{getSystemScore(predicted.metrics).toFixed(1)}</strong></p>
   <p>{predicted.history[predicted.history.length-1]?.eventText}</p></section>:<p className="study-commit-note">Apply this intervention to the café? It uses one turn and cannot be undone during this run.</p>}
  </div><div className="study-dialog-actions"><button className="study-secondary" onClick={state.cancelSelection}>Choose another</button><button className="study-primary" onClick={()=>state.applyAction(candidate.id)}>Apply intervention</button></div>
 </dialog>;
}
