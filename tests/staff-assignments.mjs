import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const root=new URL('../src/', import.meta.url);
function load(file,extra=''){
 const module={exports:{}};
 const code=ts.transpile(fs.readFileSync(new URL(file,root),'utf8')+extra,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020});
 new Function('require','exports','module',code)(name=>{
  if(name==='react')return {};
  if(name==='../engine/normaliseForDisplay')return load('engine/normaliseForDisplay.ts');
  throw new Error(name);
 },module.exports,module);
 return module.exports;
}
const engine=load('hooks/useCustomerFlowSimulation.ts','\nexport { reconcileStaffTokens };');
const keys=['headBaristaMovedEarlier','managerMovedEarlier','tempStaffAdded','extraTillInstalled','extraCoffeeMachineInstalled','peakTaskSpecialisation'];
let combinations=0;
for(let bits=0;bits<64;bits++){
 const flags=Object.fromEntries(keys.map((key,i)=>[key,!!(bits&(1<<i))]));
 const config=engine.deriveStaffConfig(flags);const staff=engine.initStaffTokens(config);
 const manager=staff.find(s=>s.id==='mgr');
 assert.equal(new Set(staff.map(s=>s.id)).size,staff.length);
 if(manager?.station==='wandering'){
  assert.ok(staff.some(s=>s.station==='till'));
  if(config.tills===2)assert.ok(staff.some(s=>s.station==='till2'),'Manager wandered with vacant till '+bits);
 }
 if(manager?.station==='till2')assert.equal(config.tillLanes,2);
 assert.equal(config.managerWandering,manager?.station==='wandering');
 combinations++;
}
const metrics={waitingTime:78,throughput:38,backlog:70,congestion:76,serviceConsistency:42,stockAvailability:48,financialResults:28,wasteTracker:70};
for(const specialised of [false,true]){
 const before={tempStaffAdded:true,managerMovedEarlier:true,peakTaskSpecialisation:specialised};
 const after={...before,extraTillInstalled:true};
 const oldStaff=engine.initStaffTokens(engine.deriveStaffConfig(before));
 assert.equal(oldStaff.find(s=>s.id==='mgr').station,'wandering');
 const rates=engine.deriveSimRates(metrics,after);rates.spawnInterval=1e9;
 let state=engine.createInitialState(rates);
 state.staffTokens=engine.reconcileStaffTokens(oldStaff,rates.staffConfig);
 assert.equal(state.staffTokens.find(s=>s.id==='mgr').animState,'traveling-to-till');
 for(let i=0;i<120;i++)state=engine.tickSimulation(state);
 const manager=state.staffTokens.find(s=>s.id==='mgr');
 assert.equal(manager.station,'till2');assert.equal(manager.animState,'idle');
 assert.equal(manager.x,engine.POS.tillStation2.x);assert.equal(manager.y,engine.POS.staffBelowY);
 state.tillBusyUntil[0]=1e9;
 state.tokens=[{id:100,type:'walkin',state:'queuing',x:engine.POS.till2.x,y:engine.POS.till2.y,age:0,stageStart:0,face:'happy',opacity:1,queueIndex:0,laneIndex:-1,arrivedAtStage:true,prepDoneAt:0,waitTicks:0}];
 state=engine.tickSimulation(state);
 assert.equal(state.tokens[0].state,'ordering');assert.equal(state.tokens[0].laneIndex,1);
 let served=false,waiting=false;
 for(let i=0;i<rates.tillTime+120;i++){
  state=engine.tickSimulation(state);
  served ||= state.staffTokens.find(s=>s.id==='mgr').animState==='serving';
  if(state.tokens[0]?.state==='waiting'){waiting=true;break;}
 }
 assert.ok(served&&waiting,'Customer must complete an order at manager till');
}
const result={staffConfigurations:combinations,managerMovesToNewTill:true,secondTillOrdersComplete:true,specialisedAndUnspecialised:true};
