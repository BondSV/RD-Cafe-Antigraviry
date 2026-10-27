import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd();const release=process.env.RELEASE_VERSION||'research-2026-10-28-v2';
const output=path.join(root,'output/research-release');const source=path.join(output,'source');
await fs.rm(source,{recursive:true,force:true});await fs.mkdir(source,{recursive:true});
// Isolate the committed production game from pre-existing local experiments.
const archive=path.join(output,'base-source.tar');const fd=await fs.open(archive,'w');
try{execFileSync('git',['archive','12ab862b7728e47843f5d39412a328904320bad8','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.node.json','vite.config.ts','tailwind.config.js','postcss.config.js','src','public'],{cwd:root,stdio:['ignore',fd.fd,'inherit']});}finally{await fd.close();}
execFileSync('tar',['-xf',archive,'-C',source]);await fs.rm(archive);
const overlay=['index.html','vite.config.ts','src/App.tsx','src/main.tsx','src/index.css','src/store/useGameStore.ts','src/components/layout/GameLayout.tsx','src/components/game/ActionCard.tsx','src/components/game/ActionCategoryAccordion.tsx','src/components/game/CaseDataPanel.tsx','src/components/game/CustomerFlowSimulationIso.tsx','src/components/game/MetricRow.tsx','src/components/game/ResultPanel.tsx','src/components/game/SystemMapNode.tsx','src/components/summary/FinalSummary.tsx','src/research','public/assets/research-fonts'];
for(const file of overlay)await fs.cp(path.join(root,file),path.join(source,file),{recursive:true});
await fs.writeFile(path.join(source,'src/research/version.ts'),'export const RESEARCH_VERSION = '+JSON.stringify(release)+';\n');
const app=path.join(source,'src/App.tsx');let text=await fs.readFile(app,'utf8');text=text.replace(', lazy, Suspense','').replace(/const CafeSample =[^\n]+\n/,'').replace(/  if \(routePath === '\/v2-sample'\)[^\n]+\n/,'').replace("if (routePath !== '/v2-sample') preloadSimulationSprites();",'preloadSimulationSprites();');await fs.writeFile(app,text);
// An archive of this historical repository includes generated and dependency files.
// Reuse the installed tools, and generate a fresh build without changing the user's dist.
await fs.rm(path.join(source,'node_modules'),{recursive:true,force:true});await fs.symlink(path.join(root,'node_modules'),path.join(source,'node_modules'),'dir');
execFileSync(path.join(root,'node_modules/.bin/tsc'),['--noEmit'],{cwd:source,stdio:'inherit'});
await fs.rm(path.join(source,'dist'),{recursive:true,force:true});
execFileSync(path.join(root,'node_modules/.bin/vite'),['build'],{cwd:source,stdio:'inherit'});
const server=path.join(output,'server');await fs.mkdir(server,{recursive:true});
for(const file of ['research.mjs','questionnaire.mjs','Dockerfile'])await fs.copyFile(path.join(root,'server',file),path.join(server,file));
execFileSync(path.join(root,'node_modules/.bin/esbuild'),['server/game.ts','--bundle','--platform=node','--format=esm','--outfile='+path.join(server,'game.mjs')],{cwd:root,stdio:'inherit'});
const files=[];async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.name==='.DS_Store'){await fs.rm(file);continue;}if(entry.isDirectory())await walk(file);else{const data=await fs.readFile(file);files.push({path:path.relative(path.join(source,'dist'),file),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}}}
await walk(path.join(source,'dist'));
const manifest={release,baseCommit:'12ab862b7728e47843f5d39412a328904320bad8',builtAt:new Date().toISOString(),files};await fs.writeFile(path.join(source,'dist/release-manifest.json'),JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(output,'overlay.json'),JSON.stringify(overlay,null,2));
console.log('Research release prepared: '+release+' ('+files.length+' static files)');
