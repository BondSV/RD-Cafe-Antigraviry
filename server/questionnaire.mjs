import {randomUUID,createHash} from 'node:crypto';
export const INSTRUMENT='2026-10-27-v1';
export const QUESTIONS=[
'Describe a decision you made and what you expected would happen. What happened instead, if anything?',
'Describe an outcome that surprised you, if there was one. What do you think caused it?',
'What, if anything, did you change about your approach as you played? What prompted that change?',
'What information did you use when choosing your actions? Describe how it influenced a particular decision.',
'Was there anything you found difficult to explain, confusing or unhelpful? Please describe it. You may add anything else about your experience here.'
];
const hash=s=>createHash('sha256').update(s).digest('hex');
const now=()=>new Date().toISOString();
const validToken=t=>typeof t==='string'&&/^[a-f0-9]{64}$/.test(t);
export function setupQuestionnaire(db,defaults){
 db.exec(`CREATE TABLE IF NOT EXISTS classroom_sessions(id TEXT PRIMARY KEY,label TEXT NOT NULL,module TEXT NOT NULL DEFAULT '',group_label TEXT NOT NULL DEFAULT '',intake TEXT NOT NULL DEFAULT '',opens_at TEXT,closes_at TEXT,enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,notice_version TEXT NOT NULL,instrument_version TEXT NOT NULL,recording_required INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS respondents(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,session TEXT NOT NULL REFERENCES classroom_sessions(id),participant_id TEXT REFERENCES participants(id),condition TEXT NOT NULL,assignment_basis TEXT NOT NULL,game_version TEXT NOT NULL,consent_version TEXT NOT NULL,consented_at TEXT NOT NULL,withdrawn INTEGER NOT NULL DEFAULT 0,test INTEGER NOT NULL DEFAULT 0,final_contribution_at TEXT NOT NULL,finish_context TEXT NOT NULL DEFAULT '{}');
 CREATE UNIQUE INDEX IF NOT EXISTS respondents_player ON respondents(session,participant_id) WHERE participant_id IS NOT NULL;
 CREATE TABLE IF NOT EXISTS questionnaires(id TEXT PRIMARY KEY,respondent_id TEXT UNIQUE NOT NULL REFERENCES respondents(id),session TEXT NOT NULL,instrument_version TEXT NOT NULL,answers TEXT NOT NULL,submitted_at TEXT NOT NULL,input_hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS session_finishes(id TEXT PRIMARY KEY,participant_id TEXT UNIQUE NOT NULL REFERENCES participants(id),session TEXT NOT NULL,finished_at TEXT NOT NULL,client_at TEXT NOT NULL,context TEXT NOT NULL);`);
 db.prepare('INSERT OR IGNORE INTO classroom_sessions(id,label,closes_at,created_at,notice_version,instrument_version) VALUES(?,?,?,?,?,?)').run(defaults.session,'Classroom session',defaults.closes,now(),defaults.notice,INSTRUMENT);
 for(const row of db.prepare('SELECT DISTINCT session FROM participants').all())db.prepare('INSERT OR IGNORE INTO classroom_sessions(id,label,enabled,created_at,notice_version,instrument_version) VALUES(?,?,0,?,?,?)').run(row.session,'Earlier classroom session',now(),'not-recorded',INSTRUMENT);
 const columns=new Set(db.prepare('PRAGMA table_info(respondents)').all().map(c=>c.name));if(!columns.has('finish_context'))db.exec("ALTER TABLE respondents ADD COLUMN finish_context TEXT NOT NULL DEFAULT '{}'");
 const sessionColumns=new Set(db.prepare('PRAGMA table_info(classroom_sessions)').all().map(c=>c.name));if(!sessionColumns.has('recording_required'))db.exec('ALTER TABLE classroom_sessions ADD COLUMN recording_required INTEGER NOT NULL DEFAULT 1');
 db.prepare("UPDATE classroom_sessions SET notice_version=? WHERE recording_required=1 AND notice_version='2026-10-28-required-v2'").run(defaults.notice);
 const session=id=>db.prepare('SELECT * FROM classroom_sessions WHERE id=?').get(id||defaults.session);
 const open=s=>!!s&&!!s.enabled&&(!s.opens_at||Date.now()>=Date.parse(s.opens_at))&&(!s.closes_at||Date.now()<Date.parse(s.closes_at));
 const respondent=req=>{const t=req.headers.authorization?.replace(/^Bearer /,'')||'';return validToken(t)?db.prepare('SELECT * FROM respondents WHERE token_hash=?').get(hash(t)):null;};
 function extras(selected=''){
  const sessions=db.prepare('SELECT * FROM classroom_sessions ORDER BY created_at').all();
  const respondents=db.prepare("SELECT id,session,participant_id,condition,assignment_basis,game_version,consent_version,consented_at,final_contribution_at,finish_context FROM respondents WHERE withdrawn=0 AND test=0 AND (?='' OR session=?) AND (participant_id IS NULL OR participant_id IN (SELECT id FROM participants WHERE test=0 AND withdrawn=0)) ORDER BY consented_at").all(selected,selected);
  const questionnaires=db.prepare("SELECT q.* FROM questionnaires q JOIN respondents r ON r.id=q.respondent_id WHERE r.withdrawn=0 AND r.test=0 AND (?='' OR q.session=?) AND (r.participant_id IS NULL OR r.participant_id IN (SELECT id FROM participants WHERE test=0 AND withdrawn=0)) ORDER BY q.submitted_at").all(selected,selected).map(q=>({...q,answers:JSON.parse(q.answers),input_hash:undefined}));
  const finishes=db.prepare("SELECT f.* FROM session_finishes f JOIN participants p ON p.id=f.participant_id WHERE p.test=0 AND p.withdrawn=0 AND (?='' OR f.session=?) ORDER BY finished_at").all(selected,selected).map(f=>({...f,context:JSON.parse(f.context)}));
  return {sessions,respondents,questionnaires,sessionFinishes:finishes,questionnaireInstrument:{version:INSTRUMENT,questions:QUESTIONS}};
 }
 function erase(connection,{participantId,respondentId}){
  const tables=new Set(connection.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name));
  if(!tables.has('respondents'))return;
  const rows=participantId?connection.prepare('SELECT id FROM respondents WHERE participant_id=?').all(participantId):connection.prepare('SELECT id FROM respondents WHERE id=?').all(respondentId);
  for(const r of rows){connection.prepare('DELETE FROM questionnaires WHERE respondent_id=?').run(r.id);connection.prepare('UPDATE respondents SET withdrawn=1 WHERE id=?').run(r.id);}
  if(participantId&&tables.has('session_finishes'))connection.prepare('DELETE FROM session_finishes WHERE participant_id=?').run(participantId);
 }
 async function route(req,res,url,{send,body,admin,participant,fields,backup,eraseBackups,reconstruct}){
  const path=url.pathname;
  if(path==='/api/research/admin/sessions'&&req.method==='POST'){
   if(!admin(req)){send(res,401,{error:'Researcher key required'});return true;}
   const b=await body(req);fields(b,['label','module','group','intake','opensAt','closesAt','enabled','id','recordingRequired']);
   for(const k of ['label','module','group','intake'])if(typeof b[k]!=='string'||b[k].length>120)throw Error('Invalid classroom label');
   if(!b.label.trim()||typeof b.enabled!=='boolean')throw Error('A classroom label and enabled state are required');
   for(const k of ['opensAt','closesAt'])if(b[k]!==null&&(!Number.isFinite(Date.parse(b[k]))||typeof b[k]!=='string'))throw Error('Invalid classroom time');
   if(b.opensAt&&b.closesAt&&Date.parse(b.opensAt)>=Date.parse(b.closesAt))throw Error('Closing must follow opening');
   if(b.id){const old=session(b.id);if(!old)throw Error('Unknown session');if(!!old.recording_required!==(b.recordingRequired!==false)&&db.prepare('SELECT id FROM participants WHERE session=? LIMIT 1').get(old.id))throw Error('Create a new classroom session to change recording policy after enrolment');db.prepare('UPDATE classroom_sessions SET label=?,module=?,group_label=?,intake=?,opens_at=?,closes_at=?,enabled=?,recording_required=? WHERE id=?').run(b.label,b.module,b.group,b.intake,b.opensAt,b.closesAt,b.enabled?1:0,b.recordingRequired===false?0:1,b.id);send(res,200,{session:session(b.id)});}
   else{const id='class-'+randomUUID();db.prepare('INSERT INTO classroom_sessions(id,label,module,group_label,intake,opens_at,closes_at,enabled,created_at,notice_version,instrument_version,recording_required) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,b.label,b.module,b.group,b.intake,b.opensAt,b.closesAt,b.enabled?1:0,now(),b.recordingRequired===false?'gameplay-voluntary-2026-10-27-v1':defaults.notice,INSTRUMENT,b.recordingRequired===false?0:1);send(res,200,{session:session(id)});}
   return true;
  }
  if(path==='/api/research/finish'&&req.method==='POST'){
   const p=participant(req);if(!p){const t=req.headers.authorization?.replace(/^Bearer /,'')||'';const old=db.prepare('SELECT withdrawn FROM participants WHERE token_hash=?').get(hash(t));send(res,old?.withdrawn?410:401,{error:old?.withdrawn?'These records were withdrawn':'Gameplay credential unavailable',withdrawn:!!old?.withdrawn});return true;}
   const b=await body(req);fields(b,['id','runId','clientAt','actions']);
   if(typeof b.id!=='string'||!/^[a-f0-9-]{36}$/.test(b.id)||typeof b.runId!=='string'||!Number.isFinite(Date.parse(b.clientAt)))throw Error('Invalid session finish');
   if(!db.prepare('SELECT id FROM participants WHERE id=? AND withdrawn=0 AND stopped=0').get(p.id))throw Error('Participation has ended');
   const existing=db.prepare('SELECT * FROM session_finishes WHERE participant_id=?').get(p.id);
   if(existing){send(res,200,{finishedAt:existing.finished_at,id:existing.id});return true;}
   reconstruct(b.actions);
   const run=db.prepare('SELECT * FROM runs WHERE id=? AND participant_id=?').get(b.runId,p.id);
   if(!run||run.action_count!==b.actions.length)throw Error('Gameplay records are still saving. Retry finishing when connected.');
   if(run.action_count!==7||!db.prepare("SELECT id FROM events WHERE run_id=? AND type='summary_shown' LIMIT 1").get(b.runId))throw Error('Complete all seven turns and view the final results before finishing.');
   const last=db.prepare("SELECT data FROM events WHERE run_id=? AND type='action_committed' ORDER BY rowid DESC LIMIT 1").get(b.runId);const ids=last?JSON.parse(last.data).snapshot.actionsTaken:[];
   if(JSON.stringify(ids)!==JSON.stringify(b.actions))throw Error('Gameplay records are still saving');
   const stamp=now();db.prepare('INSERT INTO session_finishes VALUES(?,?,?,?,?,?)').run(b.id,p.id,p.session,stamp,b.clientAt,JSON.stringify({runId:b.runId,actions:b.actions,reason:'explicit_finish_playing'}));send(res,200,{finishedAt:stamp,id:b.id});return true;
  }
  if(path==='/api/research/questionnaire/enrol'&&req.method==='POST'){
   const b=await body(req);fields(b,['token','session','consent','consentVersion','instrumentVersion','gameplayToken','test','finishContext','gameVersion']);
   if(b.test===true&&!admin(req)){send(res,403,{error:'Not authorised'});return true;}
   const s=session(b.session);if(!s||!validToken(b.token)||b.consent!==true||b.consentVersion!=='questionnaire-2026-10-27-v1'||b.instrumentVersion!==s.instrument_version)throw Error('Questionnaire permission and version are required');
   let r=db.prepare('SELECT * FROM respondents WHERE token_hash=?').get(hash(b.token));
   if(r?.withdrawn){send(res,410,{error:'These records were withdrawn',withdrawn:true});return true;}
   if(r&&r.session!==s.id)throw Error('Credential belongs to another classroom session');
   if(!r){
    let p=null;if(b.gameplayToken){if(!validToken(b.gameplayToken))throw Error('Invalid gameplay link');p=db.prepare('SELECT * FROM participants WHERE token_hash=? AND session=?').get(hash(b.gameplayToken),s.id);if(p?.withdrawn){send(res,410,{error:'These records were withdrawn',withdrawn:true});return true;}if(!p)throw Error('Gameplay link unavailable');}
    if(p&&!p.stopped&&!db.prepare('SELECT id FROM session_finishes WHERE participant_id=?').get(p.id))throw Error('Finish the playing session before the questionnaire');
    const context=b.finishContext;if(!p&&(!context||typeof context.clientAt!=='string'||!Number.isFinite(Date.parse(context.clientAt))))throw Error('Explicit finish context is required');
    if(p&&db.prepare('SELECT id FROM respondents WHERE session=? AND participant_id=?').get(s.id,p.id)){send(res,409,{error:'A questionnaire credential already exists for this session. Please ask the researcher if it has been lost.'});return true;}
    const played=p?db.prepare('SELECT DISTINCT version FROM events WHERE participant_id=? ORDER BY version').all(p.id).map(e=>e.version).join(','):(['research-2026-10-28-v1','research-2026-10-28-v2','research-2026-10-28-v3','research-2026-10-28-v4','research-2026-10-28-v5',defaults.version].includes(b.gameVersion)?b.gameVersion:defaults.version);
    const stamp=now();db.prepare('INSERT INTO respondents(id,token_hash,session,participant_id,condition,assignment_basis,game_version,consent_version,consented_at,test,final_contribution_at,finish_context) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),hash(b.token),s.id,p?.id||null,p?.condition||'control',p?'balanced_random':'unrecorded_practice',played||defaults.version,b.consentVersion,stamp,p?.test||b.test===true?1:0,stamp,JSON.stringify(p?{source:'recorded_finish'}:{clientAt:context.clientAt,reason:'explicit_finish_playing',source:'unrecorded_play'}));
    r=db.prepare('SELECT * FROM respondents WHERE token_hash=?').get(hash(b.token));
   }
   const q=db.prepare('SELECT id,submitted_at FROM questionnaires WHERE respondent_id=?').get(r.id);send(res,200,{id:r.id,code:r.id.slice(0,8).toUpperCase(),submitted:q||null,participantId:r.participant_id});return true;
  }
  if(path==='/api/research/questionnaire/status'&&req.method==='GET'){
   const r=respondent(req);if(!r){send(res,401,{error:'Questionnaire credential required'});return true;}if(r.withdrawn){send(res,410,{error:'These records were withdrawn',withdrawn:true});return true;}const q=db.prepare('SELECT id,submitted_at FROM questionnaires WHERE respondent_id=?').get(r.id);send(res,200,{submitted:q||null});return true;
  }
  if(path==='/api/research/questionnaire'&&req.method==='POST'){
   const r=respondent(req);if(!r){send(res,401,{error:'Questionnaire credential required'});return true;}if(r.withdrawn){send(res,410,{error:'These records were withdrawn',withdrawn:true});return true;}
   const b=await body(req);if(db.prepare('SELECT withdrawn FROM respondents WHERE id=?').get(r.id)?.withdrawn){send(res,410,{error:'These records were withdrawn',withdrawn:true});return true;}fields(b,['id','instrumentVersion','answers']);if(typeof b.id!=='string'||!/^[a-f0-9-]{36}$/.test(b.id)||b.instrumentVersion!==INSTRUMENT||!Array.isArray(b.answers)||b.answers.length!==5||b.answers.some(a=>typeof a!=='string'||a.length>2000)||!b.answers.some(a=>a.trim()))throw Error('Answer at least one question, with no more than 2,000 characters per answer');
   const fingerprint=hash(JSON.stringify(b));const existing=db.prepare('SELECT * FROM questionnaires WHERE respondent_id=? OR id=?').get(r.id,b.id);
   if(existing){if(existing.respondent_id!==r.id||existing.id!==b.id||existing.input_hash!==fingerprint){send(res,409,{error:'A different response is already recorded'});return true;}send(res,200,{id:existing.id,submittedAt:existing.submitted_at});return true;}
   const stamp=now();db.prepare('INSERT INTO questionnaires VALUES(?,?,?,?,?,?,?)').run(b.id,r.id,r.session,INSTRUMENT,JSON.stringify(b.answers),stamp,fingerprint);db.prepare('UPDATE respondents SET final_contribution_at=? WHERE id=?').run(stamp,r.id);send(res,200,{id:b.id,submittedAt:stamp});return true;
  }
  if(path==='/api/research/admin/questionnaires.csv'&&req.method==='GET'){
   if(!admin(req)){send(res,401,{error:'Researcher key required'});return true;}
   const data=extras(url.searchParams.get('session')||'');const people=Object.fromEntries(data.respondents.map(r=>[r.id,r]));const sessions=Object.fromEntries(data.sessions.map(s=>[s.id,s]));
   const rows=[['response','respondent','participant','session','module','group','intake','condition','assignment_basis','game_version','instrument_version','consent_version','consented_at','submitted_at',...QUESTIONS],...data.questionnaires.map(q=>{const r=people[q.respondent_id],s=sessions[q.session];return[q.id,r.id,r.participant_id,q.session,s.module,s.group_label,s.intake,r.condition,r.assignment_basis,r.game_version,q.instrument_version,r.consent_version,r.consented_at,q.submitted_at,...q.answers];})];
   const cell=x=>'"'+String(/^(?:\s*[=+\-@]|[\t\r])/.test(String(x??''))?"'"+x:x??'').replaceAll('"','""')+'"';send(res,200,rows.map(r=>r.map(cell).join(',')).join('\r\n'),{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="rainyday-questionnaires.csv"'});return true;
  }
  if(path==='/api/research/admin/respondent-withdraw'&&req.method==='POST'){
   if(!admin(req)){send(res,401,{error:'Researcher key required'});return true;}const b=await body(req);fields(b,['respondentId']);const r=db.prepare('SELECT * FROM respondents WHERE id=?').get(b.respondentId);if(!r)throw Error('Respondent not found');
   db.exec('BEGIN IMMEDIATE');erase(db,{respondentId:r.id});if(r.participant_id){erase(db,{participantId:r.participant_id});db.prepare('DELETE FROM events WHERE participant_id=?').run(r.participant_id);db.prepare('DELETE FROM runs WHERE participant_id=?').run(r.participant_id);db.prepare('UPDATE participants SET withdrawn=1,stopped=1 WHERE id=?').run(r.participant_id);}db.exec('COMMIT');eraseBackups({respondentId:r.id,participantId:r.participant_id});backup();send(res,200,{ok:true});return true;
  }
  return false;
 }
 return {session,open,extras,erase,route};
}
