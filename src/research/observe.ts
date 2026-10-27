import { currentRun, record } from './recording';
export function observeResearch(){
 const run=currentRun();const known=new WeakSet<Element>();const visible=new WeakMap<Element,boolean>();
 const io=new IntersectionObserver(entries=>{if(run!==currentRun())return;for(const entry of entries){const e=entry.target as HTMLElement;const shown=entry.isIntersecting&&entry.intersectionRect.height>=24&&entry.intersectionRect.width>=24;if(visible.get(e)===shown)continue;visible.set(e,shown);if(e.dataset.researchCard)record('card_visibility',{actionId:e.dataset.researchCard,visible:shown});else record('section_visibility',{section:e.dataset.researchSection,visible:shown});}},{threshold:[0,0.1,0.5,1]});
 const scan=()=>document.querySelectorAll('[data-research-section],[data-research-card]').forEach(e=>{if(!known.has(e)){known.add(e);io.observe(e);}});scan();
 const mutation=new MutationObserver(scan);mutation.observe(document.body,{childList:true,subtree:true});
 const sample=setInterval(()=>{if(document.visibilityState!=='visible'||run!==currentRun())return;const scene=document.querySelector('[data-research-section="simulation"]');if(!scene)return;const r=scene.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
 const orders=scene.querySelector('[data-research-counter="orders"]')?.textContent;const lost=scene.querySelector('[data-research-counter="lost"]')?.textContent;if(orders&&lost)record('simulation_sample',{orders:Number(orders),lost:Number(lost)});
 },10000);
 return()=>{io.disconnect();mutation.disconnect();clearInterval(sample);};
}
