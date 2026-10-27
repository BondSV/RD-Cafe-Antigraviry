import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
const base=process.env.TEST_WEB||'http://127.0.0.1:5198';
const key=process.env.TEST_ADMIN_KEY||'local-test-key-000000000000000000000000';
const out=process.env.TEST_OUTPUT||'output/research-verification';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const errors=[];const checks=[];
async function api(path,body,token=key){const r=await fetch(base+'/api/research/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},...(body===undefined?{}:{body:JSON.stringify(body)})});const b=await r.json();assert(r.ok,JSON.stringify(b));return b;}
async function participant(condition){const config=await api('config');const token=randomBytes(32).toString('hex');const p=await api('enrol',{token,consentVersion:config.consentVersion,test:true,condition});return {...p,token};}
async function openStudy(condition,viewport){const p=await participant(condition);const context=await browser.newContext({viewport});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(p=>localStorage.setItem('rd-study:'+p.session,JSON.stringify(p)),p);await page.goto(base);await page.getByRole('button',{name:'Start Simulation',exact:true}).waitFor();return {p,page,context};}
async function screenshot(page,name){await page.screenshot({path:out+'/'+name+'.png',fullPage:true});}
async function choose(page,title,preview){await page.getByRole('button',{name:title,exact:false}).click();await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('heading',{name:'Predicted consequences',exact:true}).count(),preview?1:0);}
async function apply(page){await page.getByRole('button',{name:'Apply intervention',exact:true}).click();await page.getByRole('dialog').filter({hasText:/TURN\s*\d\s*RESULT/}).waitFor();}
try{
 const practice=await browser.newContext({viewport:{width:390,height:844}});const notice=await practice.newPage();await notice.goto(base);await notice.getByRole('heading',{name:'Classroom research session'}).waitFor();await screenshot(notice,'notice-mobile');await notice.getByRole('button',{name:'Play without recording'}).click();await notice.getByRole('button',{name:'Start Simulation',exact:true}).click();await notice.getByRole('button',{name:'Actions',exact:true}).click();await notice.getByRole('button',{name:'Staff & Processes',exact:true}).click();await choose(notice,'Hire a part-time barista',false);await screenshot(notice,'practice-confirm-mobile');assert.equal(await notice.getByLabel('Research recording').count(),0);await practice.close();checks.push('Optional information and unrecorded practice work on mobile');
 for(const condition of ['control','preview']){
  const {p,page,context}=await openStudy(condition,{width:1365,height:900});
  await page.getByRole('button',{name:'Start Simulation',exact:true}).click();await page.getByRole('button',{name:'Staff & Processes',exact:true}).click();
  await choose(page,'Hire a part-time barista',condition==='preview');await screenshot(page,condition+'-candidate-desktop');
  if(condition==='preview'){await page.keyboard.press('Tab');const outline=await page.evaluate(()=>({mode:document.documentElement.dataset.input,style:getComputedStyle(document.activeElement).outlineStyle}));assert.equal(outline.mode,'keyboard');assert.equal(outline.style,'dotted');}
  await page.getByRole('button',{name:'Choose another',exact:true}).click();
  const titles=['Hire a part-time barista','Move the café manager earlier','Move the head barista earlier','Introduce peak-hour task specialisation','Introduce SOPs for core tasks','Introduce a simple peak-hour task board','Send staff on a barista training course'];
  for(let i=0;i<titles.length;i++){
   await choose(page,titles[i],condition==='preview');await apply(page);
   assert(await page.getByRole('dialog').innerText().then(t=>t.includes('TURN '+(i+1)+' RESULT')));
   if(i===6){await screenshot(page,condition+'-turn7');await page.getByRole('button',{name:'View final summary'}).click();}
   else await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  await page.getByRole('heading',{name:'Intervention Timeline',exact:true}).waitFor();assert.equal(await page.getByText('Waste Control',{exact:true}).count(),1);assert.equal(await page.getByText('Orders Completed per Hour',{exact:true}).count(),0);
  await screenshot(page,condition+'-summary');await page.waitForFunction(()=>document.querySelector('[role="status"]')?.textContent==='Records saved');
  await page.getByRole('button',{name:'Play Again',exact:true}).click();await page.getByRole('button',{name:'Staff & Processes',exact:true}).click();await choose(page,'Hire a part-time barista',condition==='preview');await page.getByRole('button',{name:'Choose another',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Start Simulation',exact:true}).waitFor();assert((await page.getByLabel('Research recording').innerText()).includes(p.code));
  await page.getByRole('button',{name:'Start Simulation',exact:true}).click();await page.getByRole('button',{name:'Staff & Processes',exact:true}).click();await choose(page,'Hire a part-time barista',condition==='preview');
  await page.getByRole('button',{name:'Choose another',exact:true}).click();
  if(condition==='preview'){
   await context.setOffline(true);await choose(page,'Hire a part-time barista',true);await apply(page);await page.getByRole('button',{name:'Continue',exact:true}).click();assert(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('rd-outbox:'))));
   await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('[role="status"]')?.textContent==='Records saved');checks.push('Offline records persist and retry successfully');
  }
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Actions',exact:true}).click();if(!await page.getByRole('button',{name:'Move the café manager earlier',exact:false}).isVisible())await page.getByRole('button',{name:'Staff & Processes',exact:true}).click();await choose(page,'Move the café manager earlier',condition==='preview');await screenshot(page,condition+'-candidate-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const activeMode=await page.evaluate(()=>document.documentElement.dataset.input);assert.equal(activeMode,'pointer');
  await page.getByRole('button',{name:'Choose another',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[role="status"]')?.textContent==='Records saved');
  await context.close();checks.push(condition+': cancellation, 7 decisions, seventh feedback, corrected summary, replay/reload assignment, phone layout passed');
 }
 const config=await api('config');const token=randomBytes(32).toString('hex');
 // A local-only non-test participant verifies the real dashboard/export path; it is withdrawn afterwards.
 if(base.includes('127.0.0.1')){
  const real=await api('enrol',{token,consentVersion:config.consentVersion},undefined);
  const ctx=await browser.newContext({viewport:{width:1365,height:900}});const page=await ctx.newPage();await page.addInitScript(p=>localStorage.setItem('rd-study:'+p.session,JSON.stringify(p)),{...real,token});await page.goto(base);await page.getByRole('button',{name:'Start Simulation',exact:true}).click();await page.getByRole('button',{name:'Staff & Processes',exact:true}).click();await choose(page,'Hire a part-time barista',real.condition==='preview');await apply(page);await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[role="status"]')?.textContent==='Records saved');await page.goto(base+'/research');await page.getByLabel('Researcher access key').fill(key);await page.getByRole('button',{name:'Open research records'}).click();await page.getByLabel('Replay run for '+real.id.slice(0,8)).selectOption({index:1});await page.getByRole('heading',{name:'Decision replay',exact:true}).waitFor();await page.getByLabel('Recorded moment').selectOption({index:1});await screenshot(page,'researcher-replay-desktop');
  const data=await api('admin/export');assert(data.events.some(e=>e.type==='action_committed'&&e.participant_id===real.id));assert(!JSON.stringify(data).includes(token));await api('withdraw',{},token);await ctx.close();checks.push('Private dashboard, replay, export and credential exclusion passed');
 }
 assert.deepEqual(errors,[]);await api('admin/test-cleanup',{});await fs.writeFile(out+'/checks.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();console.log('Task-owned headless browser closed');}
