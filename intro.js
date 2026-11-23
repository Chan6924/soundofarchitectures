import {mountCrosshair} from './crosshair.js';
import {mountTechText} from './tech-text.js';
const intro=document.querySelector('#intro'),museum=document.querySelector('#museum'),start=document.querySelector('#intro-start'),back=document.querySelector('#return-start');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang=false,ready=false,state='intro',cleanup=()=>{},titles=[];
function stopEffects(){cleanup();cleanup=()=>{};for(const title of titles)title.destroy();titles=[];}
function renderTitle(){
 for(const title of titles)title.destroy();titles=[];
 const heading=document.querySelector('#intro-title');
 heading.setAttribute('aria-label',lang?'每一座建筑，都是一首诗。':'Every building is a poem.');
 heading.innerHTML='<span class="tech-title-line" aria-hidden="true"></span><span class="tech-title-line tech-title-accent" aria-hidden="true"></span>';
 const lines=lang?['每一座建筑，','都是一首诗。']:['Every building','is a poem.'];
 heading.querySelectorAll('.tech-title-line').forEach((host,i)=>{titles.push(mountTechText(host,{text:lines[i],color:i?'#927446':'#332e26',fontSize:lang?122:150}));});
}
function activateEffects(){
 if(matchMedia('(hover: hover) and (pointer: fine)').matches)cleanup=mountCrosshair(document.querySelector('#intro-crosshair'),intro);
 renderTitle();
}
function labels(){
 document.querySelector('#intro-kicker').textContent=lang?'建筑、语言与运动的数字博物馆':'A LIVING TYPOGRAPHY MUSEUM';
 if(state==='intro')renderTitle();
 document.querySelector('#intro-description').innerHTML=lang?'六种文明，在建筑与文字之间，<br>等待你的第一缕微风。':'Six civilizations, suspended between<br>architecture and language.';
 document.querySelector('#intro-start-label').textContent='START';
 document.querySelector('#intro-status').textContent=ready?(lang?'轻触开始，进入展览':'ENTER A WORLD OF FORM & LANGUAGE'):(lang?'正在准备展览':'PREPARING THE EXHIBITION');
 document.querySelector('#intro-volume').textContent=lang?'第一辑 / 六种文明':'VOL. 001 / SIX CIVILIZATIONS';
 document.querySelector('#intro-instruction').textContent=lang?'移动鼠标描摹 · 点击进入':'MOVE TO TRACE · CLICK TO ENTER';
 if(ready&&(document.documentElement.lang==='zh-CN')!==lang)document.querySelector('#language').click();
 back.textContent=lang?'← 返回开始':'← RETURN';
}
document.querySelector('#intro-language').addEventListener('click',()=>{lang=!lang;labels();});
function onReady(){ready=true;start.disabled=false;labels();if(document.activeElement===document.body)start.focus({preventScroll:true});}
activateEffects();
if(window.museum)onReady();else window.addEventListener('museum:ready',onReady,{once:true});
start.addEventListener('click',()=>{
 if(state!=='intro'||!ready)return;state='entering';start.disabled=true;
 document.body.classList.add('intro-entering');document.body.classList.remove('intro-open');
 setTimeout(()=>{stopEffects();intro.hidden=true;intro.inert=true;museum.inert=false;state='museum';document.body.classList.remove('intro-entering');back.focus({preventScroll:true});window.dispatchEvent(new Event('museum:entered'));},reduce?0:950);
});
back.addEventListener('click',()=>{
 if(state!=='museum')return;state='returning';lang=document.documentElement.lang==='zh-CN';
 const dialog=document.querySelector('#overlay');if(dialog.open)dialog.close();
 // Restore the landing page at the endpoint of START, then play that motion in reverse.
 museum.inert=true;start.disabled=true;
 document.body.classList.add('intro-return-prep');
 intro.hidden=false;intro.inert=true;labels();activateEffects();
 void intro.getBoundingClientRect();
 const finish=()=>{
  document.body.classList.remove('intro-returning','intro-return-prep');
  state='intro';intro.inert=false;start.disabled=!ready;
  start.focus({preventScroll:true});window.dispatchEvent(new Event('museum:return'));
 };
 const reveal=()=>{
  document.body.classList.add('intro-open','intro-returning');
  document.body.classList.remove('intro-return-prep');
  setTimeout(finish,reduce?0:1050);
 };
 if(reduce)reveal();else requestAnimationFrame(()=>requestAnimationFrame(reveal));
});
window.addEventListener('error',()=>{if(!ready)document.querySelector('#intro-status').textContent=lang?'展览加载未完成，请刷新重试':'EXHIBITION COULD NOT LOAD — PLEASE REFRESH';});
