export function createSceneAmbience(parent, reduced) {
 const root = document.createElement('div');
 root.id = 'scene-ambience';
 root.setAttribute('aria-hidden', 'true');
 const canvas = document.createElement('canvas');
 root.append(canvas);
 parent.prepend(root);
 const ctx = canvas.getContext('2d');
 const images = new Map();
 let current = -1, width = 1, height = 1;
 let visible = null, fading = false;

 function load(index) {
  if (images.has(index)) return images.get(index);
  const image = new Image();
  image.alt = '';
  image.dataset.scene = index;
  const locationPhotos = {0: 'beijing-moat.jpg', 1: 'japan-todaiji-hd.jpg', 2: 'kazakhstan-tekeli.jpg'};
  image.src = './collage/' + (locationPhotos[index] ?? index+'.webp');
  const ready = image.decode().then(() => image).catch(() => {
   images.delete(index);
   return null;
  });
  images.set(index, ready);
  return ready;
 }

 async function show(index) {
  if (fading || visible?.dataset.scene === String(index)) return;
  const incoming = await load(index);
  if (!incoming || current !== index || fading || incoming === visible) return;
  const outgoing = visible;
  root.append(incoming);
  visible = incoming;
  fading = true;
  if (outgoing && !reduced) {
   await incoming.animate([{opacity: 0}, {opacity: 1}], {
    duration: 580, easing: 'ease-in-out'
   }).finished.catch(() => {});
  }
  outgoing?.remove();
  fading = false;
  if (current !== index) show(current);
 }

 new ResizeObserver(() => {
  width = canvas.width = parent.clientWidth;
  height = canvas.height = parent.clientHeight;
 }).observe(parent);

 return {
  update(index) {
   if (index === current) return;
   current = index;
   show(index);
   load((index + 1) % 6);
   load((index + 5) % 6);
  },
  render(time) {

  ctx.clearRect(0,0,width,height);if(reduced)return;
  if(current===2){
   for(let i=0;i<115;i++){const x=(i/114)*width,y=height*(.83+.16*Math.sin(i*3.91)**2),len=15+22*Math.sin(i*5.3)**2,bend=Math.sin(time*1.1+i*.09)*10;ctx.strokeStyle=i%2?'rgba(89,113,60,.14)':'rgba(151,137,77,.16)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+bend*.3,y-len*.6,x+bend,y-len);ctx.stroke();}
  }else if(current===1||current===3){
   for(let i=0;i<13;i++){const speed=8+i%4*3,x=(i*149+time*speed)%(width+60)-30,y=(i*83+time*(5+i%3*2))%(height+50)-25;ctx.save();ctx.translate(x,y);ctx.rotate(time*.3+i);ctx.fillStyle=current===1?'rgba(207,154,157,.3)':'rgba(190,171,126,.24)';ctx.beginPath();ctx.ellipse(0,0,2.6,1.2,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  }else{
   for(let i=0;i<16;i++){const x=(i*113+time*(3+i%3))%(width+50),y=height*(.35+.6*Math.sin(i*2.17)**2)-Math.sin(time*.3+i)*12;ctx.fillStyle='rgba(184,146,75,'+(.12+.07*Math.sin(time+i))+')';ctx.beginPath();ctx.arc(x,y,1.1,0,Math.PI*2);ctx.fill();}
  }
 }};
}

