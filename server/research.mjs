import {setupQuestionnaire,INSTRUMENT,QUESTIONS} from './questionnaire.mjs';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, timingSafeEqual, randomInt, randomUUID } from 'node:crypto';
import { mkdirSync, chmodSync, existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconstruct, describe, actions, metricLabels, SCORE_METRIC_KEYS } from './game.mjs';

const VERSION=process.env.RELEASE_VERSION || 'research-2026-10-28-v2';
// The operational rules and programmed observations are unchanged in these releases.
const COMPATIBLE_VERSIONS=new Set([VERSION,'research-2026-10-28-v1','research-2026-10-28-v2']);
const SESSION=process.env.STUDY_SESSION || 'rd-2026-10-28';
const CLOSES=process.env.STUDY_CLOSES || '2026-10-29T00:00:00Z';
const KEY=process.env.RESEARCH_ADMIN_KEY || '';
if(KEY.length<32)throw Error('A researcher access key of at least 32 characters is required');
const DATA=process.env.RESEARCH_DATA || './research-data';
process.umask(0o077);
mkdirSync(DATA,{recursive:true,mode:0o700});
const db=new DatabaseSync(join(DATA,'research.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS participants(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,session TEXT NOT NULL,condition TEXT NOT NULL,created_at TEXT NOT NULL,test INTEGER NOT NULL DEFAULT 0,stopped INTEGER NOT NULL DEFAULT 0,withdrawn INTEGER NOT NULL DEFAULT 0,consent_version TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,participant_id TEXT NOT NULL REFERENCES participants(id),started_at TEXT NOT NULL,updated_at TEXT NOT NULL,action_count INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'incomplete');
CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,participant_id TEXT NOT NULL REFERENCES participants(id),run_id TEXT NOT NULL REFERENCES runs(id),page_id TEXT NOT NULL,seq INTEGER NOT NULL,elapsed_ms REAL NOT NULL,client_at TEXT NOT NULL,received_at TEXT NOT NULL,type TEXT NOT NULL,version TEXT NOT NULL,data TEXT NOT NULL,input_hash TEXT NOT NULL,UNIQUE(page_id,seq));
CREATE INDEX IF NOT EXISTS events_participant ON events(participant_id,run_id);
CREATE INDEX IF NOT EXISTS runs_participant ON runs(participant_id);`);
// Preserve earlier opt-in records accurately when updating an existing database.
const participantColumns=new Set(db.prepare('PRAGMA table_info(participants)').all().map(c=>c.name));
if(!participantColumns.has('notice_version'))db.exec("ALTER TABLE participants ADD COLUMN notice_version TEXT NOT NULL DEFAULT ''");
if(!participantColumns.has('participation_mode'))db.exec("ALTER TABLE participants ADD COLUMN participation_mode TEXT NOT NULL DEFAULT 'optional'");
const study=setupQuestionnaire(db,{session:SESSION,closes:CLOSES,notice:'2026-10-28-required-v2',version:VERSION});
chmodSync(join(DATA,'research.sqlite'),0o600);
const hash=s=>createHash('sha256').update(s).digest('hex');
const uuid=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/i.test(s);
const actionId=s=>actions.some(a=>a.id===s);
const now=()=>new Date().toISOString();
const types=new Set(['run_started','candidate_opened','candidate_cancelled','action_committed','feedback_shown','feedback_dismissed','summary_shown','run_restarted','page_visibility','page_exit','category_toggled','metric_toggled','node_tooltip','case_toggled','tab_changed','section_visibility','simulation_sample','card_visibility']);
function admin(req){const supplied=req.headers.authorization?.replace(/^Bearer /,'')||'';return KEY.length>=32&&Buffer.byteLength(supplied)===Buffer.byteLength(KEY)&&timingSafeEqual(Buffer.from(supplied),Buffer.from(KEY));}
function participant(req){const token=req.headers.authorization?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{64}$/.test(token))return null;return db.prepare('SELECT * FROM participants WHERE token_hash=? AND withdrawn=0 AND stopped=0').get(hash(token));}
function send(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(typeof data==='string'?data:JSON.stringify(data));}
async function body(req){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>524288)throw Error('Request too large');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
function fields(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw Error('Unexpected event fields');}
function validate(e){
 fields(e,['version','id','runId','pageId','seq','elapsedMs','clientAt','type','actions','data']);
 if(!COMPATIBLE_VERSIONS.has(e.version)||!uuid(e.id)||!uuid(e.runId)||!uuid(e.pageId)||!Number.isSafeInteger(e.seq)||e.seq<1||!Number.isFinite(e.elapsedMs)||e.elapsedMs<0||e.elapsedMs>172800000||typeof e.clientAt!=='string'||!Number.isFinite(Date.parse(e.clientAt))||!types.has(e.type))throw Error('Invalid event');
 const state=reconstruct(e.actions);const d=e.data||{};
 const keys={run_started:[],candidate_opened:['actionId'],candidate_cancelled:['actionId'],action_committed:['actionId'],feedback_shown:['turn'],feedback_dismissed:['turn'],summary_shown:[],run_restarted:[],page_visibility:['visible'],page_exit:[],category_toggled:['category','open'],metric_toggled:['metric','open'],node_tooltip:['node','open'],case_toggled:['open'],tab_changed:['tab'],section_visibility:['section','visible'],simulation_sample:['orders','lost'],card_visibility:['actionId','visible']}[e.type];
 fields(d,keys);if(keys.some(k=>!(k in d)))throw Error('Missing event field');
 for(const k of ['open','visible'])if(k in d&&typeof d[k]!=='boolean')throw Error('Invalid visibility');
 if('actionId'in d&&!actionId(d.actionId))throw Error('Invalid intervention');
 if('turn'in d&&(!Number.isInteger(d.turn)||d.turn<1||d.turn>7||d.turn!==e.actions.length))throw Error('Invalid turn');
 if('category'in d&&!['Space & Equipment','Staff & Processes','Menu & Stock','Organisational','Revenue'].includes(d.category))throw Error('Invalid category');
 if('metric'in d&&!['Service Speed','Orders Completed per Hour','Order Processing','Queue Flow','Service Consistency','Stock Availability','Cost Efficiency','Waste Control'].includes(d.metric))throw Error('Invalid metric');
 if('node'in d&&!['orderPoint','preparation','inventory','financials','quality','staffing'].includes(d.node))throw Error('Invalid node');
 if('tab'in d&&!['map','actions','case'].includes(d.tab))throw Error('Invalid tab');
 if('section'in d&&!['case','simulation','metrics','system-map','interventions'].includes(d.section))throw Error('Invalid section');
 for(const k of ['orders','lost'])if(k in d&&(!Number.isFinite(d[k])||d[k]<0||d[k]>100000))throw Error('Invalid simulation count');
 if(e.type==='run_started'&&e.actions.length!==0)throw Error('Run must start empty');
 if(e.type==='action_committed'&&(e.actions.length===0||e.actions.at(-1)!==d.actionId))throw Error('Invalid commitment');
 if(e.type==='summary_shown'&&e.actions.length!==7)throw Error('Incomplete summary');
 return {state,data:d};
}
function backup(){
 const dir=join(DATA,'backups');mkdirSync(dir,{recursive:true,mode:0o700});
 const stamp=now().slice(0,13).replaceAll(':','');const file=join(dir,`research-${stamp}.sqlite`);
 const temp=file+'.next';if(existsSync(temp))return;
 db.exec(`VACUUM INTO '${temp.replaceAll("'","''")}'`);chmodSync(temp,0o600);renameSync(temp,file);
}
function eraseFromBackups(id){
 const dir=join(DATA,'backups');if(!existsSync(dir))return;
 for(const name of readdirSync(dir).filter(n=>n.endsWith('.sqlite'))){const copy=new DatabaseSync(join(dir,name));try{copy.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE');study.erase(copy,{participantId:id});copy.prepare('DELETE FROM events WHERE participant_id=?').run(id);copy.prepare('DELETE FROM runs WHERE participant_id=?').run(id);copy.prepare('UPDATE participants SET stopped=1,withdrawn=1 WHERE id=?').run(id);copy.exec('COMMIT; VACUUM;');}finally{copy.close();}}
}
function exportData(selected=''){
 const people=db.prepare('SELECT id,session,condition,created_at,consent_version,notice_version,participation_mode,stopped FROM participants WHERE test=0 AND withdrawn=0 ORDER BY created_at').all().filter(p=>!selected||p.session===selected);
 const peopleIds=new Set(people.map(p=>p.id));
 const runs=db.prepare('SELECT r.* FROM runs r JOIN participants p ON p.id=r.participant_id WHERE p.test=0 AND p.withdrawn=0 ORDER BY r.started_at').all().filter(r=>peopleIds.has(r.participant_id));
 const events=db.prepare('SELECT e.id,e.participant_id,e.run_id,e.page_id,e.seq,e.elapsed_ms,e.client_at,e.received_at,e.type,e.version,e.data FROM events e JOIN participants p ON p.id=e.participant_id WHERE p.test=0 AND p.withdrawn=0 ORDER BY e.received_at,e.page_id,e.seq').all().filter(e=>peopleIds.has(e.participant_id)).map(e=>({...e,data:JSON.parse(e.data)}));
 return {...study.extras(selected),exportedAt:now(),version:VERSION,session:selected||null,defaultSession:SESSION,catalogue:actions,metricLabels,scoredMetrics:SCORE_METRIC_KEYS,initialState:describe(reconstruct([])),protocol:{assignment:'balanced random, fixed per participant',identification:'classroom session only',timing:'browser elapsed/visibility, not attention',animation:'illustrative and stochastic; replay reconstructs decisions and feedback'},participants:people,runs,events};
}
const csvCell=x=>'"'+String(/^(?:\s*[=+\-@]|[\t\r])/.test(String(x??''))?"'"+x:x??'').replaceAll('"','""')+'"';
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');const path=url.pathname;
  if(await study.route(req,res,url,{send,body,admin,participant,fields,backup,reconstruct,eraseBackups:criteria=>{
   if(criteria.participantId)eraseFromBackups(criteria.participantId);
   if(criteria.respondentId){const dir=join(DATA,'backups');if(existsSync(dir))for(const name of readdirSync(dir).filter(n=>n.endsWith('.sqlite'))){const c=new DatabaseSync(join(dir,name));try{study.erase(c,criteria);c.exec('VACUUM');}finally{c.close();}}}
  }}))return;
  if(req.method==='GET'&&path==='/api/research/health')return send(res,200,{ok:db.prepare('SELECT 1 AS ready').get().ready===1,version:VERSION});
  if(req.method==='GET'&&path==='/api/research/config'){const s=study.session(url.searchParams.get('session'));if(!s)return send(res,404,{error:'Classroom session not found. Ask the tutor for the correct link.'});return send(res,200,{version:VERSION,session:s.id,sessionInfo:s,closesAt:s.closes_at,open:study.open(s),noticeVersion:s.notice_version,participation:s.recording_required?'required':'voluntary',instrumentVersion:s.instrument_version,questionnaireConsentVersion:'questionnaire-2026-10-27-v1',questions:QUESTIONS});}
  if(req.method==='POST'&&path==='/api/research/enrol'){
   const b=await body(req);fields(b,['token','session','noticeVersion','gameplayConsent','test','condition']);
   const selected=study.session(b.session);
   if(!selected||!/^[a-f0-9]{64}$/.test(b.token)||b.noticeVersion!==selected.notice_version)return send(res,400,{error:'Invalid enrolment'});
   if(selected&&!selected.recording_required&&b.gameplayConsent!==true)return send(res,400,{error:'Gameplay research permission is required for recording'});
   const isTest=b.test===true;if((isTest||b.condition!==undefined)&&!admin(req))return send(res,403,{error:'Not authorised'});
   db.exec('BEGIN IMMEDIATE');
   try{
    let p=db.prepare('SELECT * FROM participants WHERE token_hash=?').get(hash(b.token));
    if(p&&(p.withdrawn||p.stopped||p.session!==selected.id)){db.exec('ROLLBACK');return send(res,410,{error:'Participation ended',withdrawn:!!p.withdrawn,participantId:p.id});}
    if(!p){
     if(!study.open(selected)&&!isTest){db.exec('ROLLBACK');return send(res,410,{error:'This classroom session has ended'});}
     const rows=db.prepare('SELECT condition,COUNT(*) AS n FROM participants WHERE session=? AND test=? GROUP BY condition').all(selected.id,isTest?1:0);
     const counts=Object.fromEntries(rows.map(r=>[r.condition,r.n]));const a=counts.control||0,bn=counts.preview||0;
     const condition=isTest&&['control','preview'].includes(b.condition)?b.condition:a<bn?'control':bn<a?'preview':randomInt(2)?'control':'preview';
     let id=randomUUID();while(db.prepare('SELECT id FROM participants WHERE substr(id,1,8)=?').get(id.slice(0,8)))id=randomUUID();db.prepare('INSERT INTO participants(id,token_hash,session,condition,created_at,test,consent_version,notice_version,participation_mode) VALUES(?,?,?,?,?,?,?,?,?)').run(id,hash(b.token),selected.id,condition,now(),isTest?1:0,selected.recording_required?'':selected.notice_version,selected.notice_version,selected.recording_required?'required':'voluntary');p=db.prepare('SELECT * FROM participants WHERE id=?').get(id);
    }
    db.prepare('UPDATE participants SET notice_version=?,participation_mode=? WHERE id=?').run(selected.notice_version,selected.recording_required?'required':'voluntary',p.id);
    db.exec('COMMIT');return send(res,200,{noticeVersion:selected.notice_version,finishedAt:db.prepare('SELECT finished_at FROM session_finishes WHERE participant_id=?').get(p.id)?.finished_at||null,id:p.id,code:p.id.slice(0,8).toUpperCase(),condition:p.condition,session:p.session,version:VERSION,test:!!p.test});
   }catch(error){db.exec('ROLLBACK');throw error;}
  }
  if(path.startsWith('/api/research/admin/')){
   if(!admin(req))return send(res,401,{error:'Researcher key required'});
   if(req.method==='GET'&&path==='/api/research/admin/export')return send(res,200,exportData(url.searchParams.get('session')||''));
   if(req.method==='GET'&&path==='/api/research/admin/summary')return send(res,200,{...study.extras(url.searchParams.get('session')||''),participants:db.prepare('SELECT id,condition,created_at,session,stopped FROM participants WHERE test=0 AND withdrawn=0 ORDER BY created_at').all(),runs:db.prepare('SELECT r.* FROM runs r JOIN participants p ON p.id=r.participant_id WHERE p.test=0 AND p.withdrawn=0 ORDER BY r.started_at').all()});
   if(req.method==='GET'&&path.startsWith('/api/research/admin/replay/')){const id=path.split('/').at(-1);const run=db.prepare('SELECT r.* FROM runs r JOIN participants p ON p.id=r.participant_id WHERE r.id=? AND p.test=0 AND p.withdrawn=0').get(id);if(!run)return send(res,404,{error:'Run not found'});return send(res,200,{run,events:db.prepare('SELECT id,type,elapsed_ms,client_at,data FROM events WHERE run_id=? ORDER BY received_at,page_id,seq').all(id).map(e=>({...e,data:JSON.parse(e.data)}))});}

   if(req.method==='POST'&&path==='/api/research/admin/backup'){backup();return send(res,200,{ok:true});}
   if(req.method==='POST'&&path==='/api/research/admin/withdraw'){
    const b=await body(req);fields(b,['participantId']);if(!uuid(b.participantId))return send(res,400,{error:'Invalid participant'});
    db.exec('BEGIN IMMEDIATE');study.erase(db,{participantId:b.participantId});db.prepare('DELETE FROM events WHERE participant_id=?').run(b.participantId);db.prepare('DELETE FROM runs WHERE participant_id=?').run(b.participantId);db.prepare('UPDATE participants SET stopped=1,withdrawn=1 WHERE id=?').run(b.participantId);db.exec('COMMIT');eraseFromBackups(b.participantId);db.exec('PRAGMA wal_checkpoint(TRUNCATE)');backup();return send(res,200,{ok:true});
   }

   if(req.method==='POST'&&path==='/api/research/admin/test-cleanup'){
    db.exec('BEGIN IMMEDIATE');db.exec("DELETE FROM questionnaires WHERE respondent_id IN (SELECT id FROM respondents WHERE test=1); DELETE FROM respondents WHERE test=1; DELETE FROM session_finishes WHERE participant_id IN (SELECT id FROM participants WHERE test=1); DELETE FROM events WHERE participant_id IN (SELECT id FROM participants WHERE test=1); DELETE FROM runs WHERE participant_id IN (SELECT id FROM participants WHERE test=1); DELETE FROM participants WHERE test=1;");db.exec('COMMIT');return send(res,200,{ok:true});
   }
   if(req.method==='GET'&&['/api/research/admin/turns.csv','/api/research/admin/events.csv'].includes(path)){
    const data=exportData(url.searchParams.get('session')||'');const people=Object.fromEntries(data.participants.map(p=>[p.id,p]));
    let rows;
    if(path.endsWith('/turns.csv')){const keys=['waitingTime','throughput','backlog','congestion','serviceConsistency','stockAvailability','financialResults','wasteTracker'];rows=[['participant','condition','run','turn','action','elapsed_ms','score','outcome',...keys,'feedback']];for(const e of data.events.filter(e=>e.type==='action_committed')){const s=e.data.snapshot;rows.push([e.participant_id,people[e.participant_id].condition,e.run_id,s.actionsTaken.length,e.data.actionId,e.elapsed_ms,s.score,s.outcome??'',...keys.map(k=>s.metrics[k]),s.history.at(-1).eventText]);}}
    else rows=[['participant','condition','run','page','sequence','event','elapsed_ms','client_at','received_at','version','data'],...data.events.map(e=>[e.participant_id,people[e.participant_id].condition,e.run_id,e.page_id,e.seq,e.type,e.elapsed_ms,e.client_at,e.received_at,e.version,JSON.stringify(e.data)])];
    return send(res,200,rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="rainyday-'+(path.endsWith('/turns.csv')?'turns':'events')+'.csv"'});
   }
   return send(res,404,{error:'Not found'});
  }
  if(req.method==='POST'&&path==='/api/research/events'){
   const p=participant(req);if(!p){const token=req.headers.authorization?.replace(/^Bearer /,'')||'';const old=db.prepare('SELECT withdrawn FROM participants WHERE token_hash=?').get(hash(token));return old?.withdrawn?send(res,410,{error:'These records were withdrawn',withdrawn:true}):send(res,401,{error:'Participant session unavailable'});}
   const b=await body(req);fields(b,['version','events']);if(!COMPATIBLE_VERSIONS.has(b.version))return send(res,409,{error:'The game has been updated. Reload to continue recording.'});
   if(!Array.isArray(b.events)||b.events.length<1||b.events.length>10)return send(res,400,{error:'Invalid batch'});
   const prepared=b.events.map(e=>({event:e,...validate(e)}));
   db.exec('BEGIN IMMEDIATE');
   try{
    if(db.prepare('SELECT id FROM session_finishes WHERE participant_id=?').get(p.id))throw Error('This playing session has finished');
    if(!db.prepare('SELECT id FROM participants WHERE id=? AND stopped=0 AND withdrawn=0').get(p.id))throw Error('Participation has ended');
    for(const {event:e,state,data} of prepared){
     const inputHash=hash(JSON.stringify(e));const duplicate=db.prepare('SELECT input_hash,participant_id FROM events WHERE id=?').get(e.id);
     if(duplicate){if(duplicate.input_hash!==inputHash||duplicate.participant_id!==p.id)throw Error('Conflicting duplicate');continue;}
     let run=db.prepare('SELECT * FROM runs WHERE id=?').get(e.runId);
     if(!run){if(e.type!=='run_started')throw Error('Missing run start');db.prepare('INSERT INTO runs(id,participant_id,started_at,updated_at) VALUES(?,?,?,?)').run(e.runId,p.id,now(),now());run=db.prepare('SELECT * FROM runs WHERE id=?').get(e.runId);}
     if(run.participant_id!==p.id)throw Error('Invalid run owner');
     if(e.type==='action_committed'&&state.actionsTaken.length!==run.action_count+1)throw Error('Non-sequential action');
     const last=db.prepare("SELECT data FROM events WHERE run_id=? AND type='action_committed' ORDER BY rowid DESC LIMIT 1").get(e.runId);
     const previous=last?JSON.parse(last.data).snapshot.actionsTaken:[];
     if(e.type==='action_committed'&&!previous.every((id,i)=>state.actionsTaken[i]===id))throw Error('Changed action history');
     if(e.type!=='action_committed'&&e.type!=='run_started'&&JSON.stringify(state.actionsTaken)!==JSON.stringify(previous))throw Error('Stale run state');
     if(['candidate_opened','candidate_cancelled'].includes(e.type)&&(state.actionsTaken.includes(data.actionId)||state.actionsTaken.length>=7))throw Error('Unavailable candidate');
     const saved={...data};
     if(['run_started','action_committed','feedback_shown','feedback_dismissed','summary_shown','candidate_opened','candidate_cancelled'].includes(e.type))saved.snapshot=describe(state);
     if(e.type==='candidate_opened'&&p.condition==='preview'){
      if(state.actionsTaken.includes(data.actionId)||state.actionsTaken.length>=7)throw Error('Unavailable candidate');
      saved.prediction=describe(reconstruct([...state.actionsTaken,data.actionId]));
     }
     db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(e.id,p.id,e.runId,e.pageId,e.seq,e.elapsedMs,e.clientAt,now(),e.type,e.version,JSON.stringify(saved),inputHash);
     const status=e.type==='summary_shown'?'completed':e.type==='run_restarted'?(state.actionsTaken.length===7?'completed':'restarted'):state.actionsTaken.length===7?'decisions_complete':run.status;
     db.prepare('UPDATE runs SET updated_at=?,action_count=?,status=? WHERE id=?').run(now(),state.actionsTaken.length,status,e.runId);
    }
    db.exec('COMMIT');return send(res,200,{accepted:b.events.map(e=>e.id)});
   }catch(error){db.exec('ROLLBACK');throw error;}
  }
  if(req.method==='POST'&&['/api/research/stop','/api/research/withdraw'].includes(path))return send(res,403,{error:'Please ask the tutor about record requests using your study code.'});
  return send(res,404,{error:'Not found'});
 }catch(error){if(!res.headersSent)send(res,400,{error: 'The record could not be saved: '+(error instanceof Error?error.message:'invalid request')});else res.end();}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(Number(process.env.PORT||8091),'0.0.0.0',()=>{console.log('RainyDay research service ready: '+VERSION);});
backup();setInterval(()=>{try{backup();}catch{console.error('Research backup failed');}},3600000).unref();
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
