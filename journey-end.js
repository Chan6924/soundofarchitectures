import {mountLightfall} from './lightfall.js';
export function createJourney({scenes,isChinese,getPreviews,onVisit,onRestart}){
 const visited=new Set();
 const dialog=document.createElement('dialog');
 dialog.id='journey-end';
 dialog.innerHTML='<div class="journey-top"><span>soundofarchitectures</span><button type="button" data-close></button></div><div class="journey-heading"><span class="journey-kicker"></span><h2></h2><p></p></div><div class="journey-grid"></div><div class="journey-actions"><button type="button" data-continue></button><button type="button" data-restart></button></div><p class="journey-signature"></p>';
 document.body.append(dialog);
 let closing=false,disposeLightfall=null;const background=document.createElement("div");background.className="journey-lightfall";dialog.prepend(background);
 function close(after){
  if(!dialog.open||closing)return;
  closing=true;
  dialog.classList.add('journey-leaving');
  setTimeout(()=>{dialog.close();disposeLightfall?.();disposeLightfall=null;background.replaceChildren();dialog.classList.remove('journey-leaving');closing=false;after?.();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:400);
 }
 dialog.querySelector('[data-close]').onclick=()=>close();
 dialog.querySelector('[data-continue]').onclick=()=>close();
 dialog.querySelector('[data-restart]').onclick=()=>close(()=>{visited.clear();visited.add(0);onRestart();});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function show(){
  if(dialog.open)return;
  const zh=isChinese(),previews=getPreviews();
  dialog.querySelector('[data-close]').textContent=zh?'返回展览 ×':'BACK TO EXHIBITION ×';
  dialog.querySelector('.journey-kicker').textContent=zh?'建筑手记 · '+visited.size+' / 6 处相遇':'FIELD NOTES · '+visited.size+' / 6 ENCOUNTERS';
  dialog.querySelector('h2').textContent=zh?'风停了，记忆留下。':'The wind rests. Memory stays.';
  dialog.querySelector('.journey-heading p').textContent=zh?'回望你停留过的屋檐，也可以继续走向尚未抵达的地方。':'Return to the eaves you lingered beneath, or discover a place still waiting.';
  dialog.querySelector('[data-continue]').textContent=zh?'← 继续探索':'← KEEP EXPLORING';
  dialog.querySelector('[data-restart]').textContent=zh?'重新漫游 ↗':'BEGIN AGAIN ↗';
  dialog.querySelector('.journey-signature').textContent=zh?'六种建筑，六种相遇。谢谢你带来的风。':'Six architectures. Six encounters. Thank you for bringing the wind.';
  const grid=dialog.querySelector('.journey-grid');
  grid.replaceChildren();
  scenes.forEach((scene,i)=>{
   const seen=visited.has(i),button=document.createElement('button');
   button.type='button';button.className='journey-item'+(seen?' is-visited':'');
   const number=document.createElement('span');number.className='journey-number';number.textContent=String(i+1).padStart(2,'0')+' — '+(zh?scene.zh:scene.country);
   const image=document.createElement('img');image.alt='';image.src=previews[i]||('./photos/'+i+'.webp');
   const name=document.createElement('strong');name.textContent=zh?scene.zn:scene.name;
   const status=document.createElement('span');status.className='journey-status';status.textContent=zh?(seen?'已相遇 · 再看一次 ↗':'待探索 · 前往 ↗'):(seen?'VISITED · RETURN ↗':'UNEXPLORED · DISCOVER ↗');
   button.append(number,image,name,status);button.onclick=()=>close(()=>onVisit(i));grid.append(button);
  });
  dialog.showModal();disposeLightfall=mountLightfall(background);
 }
 return {show,get open(){return dialog.open},visit(i){visited.add(i);}};
}
