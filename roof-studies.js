export function mountRoofStudies(scenes, capture){
 const intro=document.querySelector('#intro'),panel=document.createElement('div');
 panel.className='roof-studies';
 const cards=scenes.map((scene,i)=>{
  const button=document.createElement('button');button.type='button';button.className='roof-study';button.setAttribute('aria-label',scene.country+' / '+scene.zh);
  const view=document.createElement('div');view.className='roof-study-view';const line=document.createElement('canvas'),solid=document.createElement('canvas');line.className='roof-study-line';solid.className='roof-study-solid';view.append(line,solid);button.append(view);panel.append(button);
  button.onpointermove=e=>{const r=view.getBoundingClientRect();view.style.setProperty('--reveal-x',(e.clientX-r.left)+'px');view.style.setProperty('--reveal-y',(e.clientY-r.top)+'px');button.classList.add('is-brushing');};
  button.onpointerleave=()=>button.classList.remove('is-brushing');button.onclick=()=>button.classList.toggle('is-revealed');button.onblur=()=>button.classList.remove('is-revealed');
  return {line,solid};
 });
 intro.append(panel);
 let i=0;
 function next(){
  if(i>=cards.length)return;
  if(intro.hidden||!document.body.classList.contains('intro-open'))return;
  const {line,solid}=cards[i];solid.width=line.width=480;solid.height=line.height=240;
  const ctx=solid.getContext('2d',{willReadFrequently:true});
  capture(i,ctx);
  const src=ctx.getImageData(0,0,480,240).data,out=line.getContext('2d'),img=out.createImageData(480,240);
  const tone=k=>src[k+3]<20?235:src[k]*.299+src[k+1]*.587+src[k+2]*.114;
  for(let y=1;y<239;y++)for(let x=1;x<479;x++){
   const k=(y*480+x)*4,edge=Math.abs(tone(k+4)-tone(k-4))+Math.abs(tone(k+1920)-tone(k-1920))+Math.abs(src[k+7]-src[k-1])*.7+Math.abs(src[k+1923]-src[k-1917])*.7;
   img.data[k]=94;img.data[k+1]=77;img.data[k+2]=51;img.data[k+3]=Math.min(205,Math.max(0,(edge-15)*3.6));
  }
  out.putImageData(img,0,0);i++;setTimeout(next,80);
 }
 setTimeout(next,140);window.addEventListener('museum:return',next);
}
