import * as T from './vendor/three.js';
export function createMiniGlobe({parent,scenes,onSelect,reduced}){
 const el=document.createElement('aside');el.id='mini-globe';el.innerHTML='<canvas aria-label="Drag to rotate the globe" tabindex="0" role="img"></canvas><div class="globe-label"></div><div class="globe-dots"></div>';parent.append(el);const canvas=el.querySelector('canvas'),label=el.querySelector('.globe-label');const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(160,160,false);const world=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,20);camera.position.z=4.2;const globe=new T.Group();world.add(globe);world.add(new T.HemisphereLight(0xc5d9f5,0x0a1528,.8));const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(-3,3,5);world.add(sun);const surface=new T.MeshStandardMaterial({color:'#3475b6',roughness:.82,metalness:.05});const earth=new T.Mesh(new T.SphereGeometry(1,64,48),surface);earth.rotation.y=-Math.PI/2;globe.add(earth);const texture=new T.TextureLoader().load('./textures/earth.jpg',map=>{map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());surface.map=map;surface.color.set('#ffffff');surface.needsUpdate=true;});
 const atmosphere=new T.Mesh(new T.SphereGeometry(1.035,48,32),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,uniforms:{},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.3,.6,1.,rim*.24);}'}));globe.add(atmosphere);
 const vector=(lat,lon,r=1.015)=>{const a=lat*Math.PI/180,b=lon*Math.PI/180;return new T.Vector3(r*Math.cos(a)*Math.sin(b),r*Math.sin(a),r*Math.cos(a)*Math.cos(b));};
 const grid=new T.LineBasicMaterial({color:'#bad4ed',transparent:true,opacity:.17});for(let lat=-60;lat<=60;lat+=30){const pts=[];for(let lon=-180;lon<=180;lon+=4)pts.push(vector(lat,lon,1.005));globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),grid));}for(let lon=0;lon<180;lon+=30){const pts=[];for(let a=0;a<=360;a+=4){const t=a*Math.PI/180,b=lon*Math.PI/180;pts.push(new T.Vector3(Math.sin(t)*Math.sin(b),Math.cos(t),Math.sin(t)*Math.cos(b)).multiplyScalar(1.005));}globe.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),grid));}
 const coords=[[39.916,116.397],[34.689,135.84],[48,67],[48.86,2.35],[37.97,23.73],[43.77,11.26]],markers=coords.map(([lat,lon],i)=>{const m=new T.Mesh(new T.SphereGeometry(.025,12,8),new T.MeshBasicMaterial({color:'#b7c8dd'}));m.position.copy(vector(lat,lon,1.03));globe.add(m);return m;});const halo=new T.Mesh(new T.RingGeometry(.045,.055,32),new T.MeshBasicMaterial({color:'#c59a43',transparent:true,opacity:.7,side:T.DoubleSide}));globe.add(halo);let active=0,zh=false,targetX=coords[0][0]*Math.PI/180,targetY=-coords[0][1]*Math.PI/180,drag=null,lastInteraction=-100;
 const buttons=scenes.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String(i+1).padStart(2,'0');b.onclick=()=>onSelect(i);el.querySelector('.globe-dots').append(b);return b;});
 function update(id,chinese){const changed=id!==active;active=id;zh=chinese;label.textContent=zh?scenes[id].zh:scenes[id].country;canvas.setAttribute('aria-label',zh?'点击标记切换建筑，拖动或用方向键旋转地球':'Select a marker to visit its building. Drag or use arrow keys to rotate.');buttons.forEach((b,i)=>{b.setAttribute('aria-label',zh?scenes[i].zh:scenes[i].country);b.setAttribute('aria-pressed',String(i===id));});markers.forEach((m,i)=>{m.material.color.set(i===id?'#d49a28':'#aebed0');m.scale.setScalar(i===id?1.6:1);});halo.position.copy(markers[id].position);halo.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),halo.position.clone().normalize());if(changed){targetX=coords[id][0]*Math.PI/180;targetY=-coords[id][1]*Math.PI/180;lastInteraction=-100;}}
 const markerPosition=new T.Vector3(), viewDirection=new T.Vector3();
 function pickMarker(e){
  const rect=canvas.getBoundingClientRect();
  let selected=-1, best=10;
  markers.forEach((marker,i)=>{
   marker.getWorldPosition(markerPosition);
   if(markerPosition.dot(viewDirection.subVectors(camera.position,markerPosition))<=0)return;
   markerPosition.project(camera);
   const x=rect.left+(markerPosition.x+1)*rect.width/2;
   const y=rect.top+(1-markerPosition.y)*rect.height/2;
   const distance=Math.hypot(e.clientX-x,e.clientY-y);
   if(distance<best){best=distance;selected=i;}
  });
  return selected;
 }
 canvas.onpointerdown=e=>{
  if(e.button!==0||drag)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
  canvas.setPointerCapture(e.pointerId);
 };
 canvas.onpointermove=e=>{
  if(!drag){canvas.style.cursor=pickMarker(e)>=0?'pointer':'';return;}
  if(e.pointerId!==drag.id)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6)return;
  drag.moved=true;
  targetY+=(e.clientX-drag.x)*.012;
  targetX=T.MathUtils.clamp(targetX+(e.clientY-drag.y)*.012,-1.3,1.3);
  drag.x=e.clientX;drag.y=e.clientY;
 };
 canvas.onpointerup=e=>{
  if(e.pointerId!==drag?.id)return;
  const tapped=!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6;
  drag=null;
  if(tapped){const id=pickMarker(e);if(id>=0)onSelect(id);}
 };
 canvas.onpointercancel=canvas.onlostpointercapture=e=>{if(e.pointerId===drag?.id)drag=null;};
 canvas.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();if(e.key==='ArrowLeft')targetY-=.2;if(e.key==='ArrowRight')targetY+=.2;if(e.key==='ArrowUp')targetX=Math.min(1.3,targetX+.15);if(e.key==='ArrowDown')targetX=Math.max(-1.3,targetX-.15);lastInteraction=performance.now()/1000;};update(0,false);globe.rotation.set(targetX,targetY,0,'XYZ');
 return {update,render(dt,time){const ease=reduced?1:1-Math.exp(-dt*5);globe.rotation.x+=(targetX-globe.rotation.x)*ease;globe.rotation.y+=(targetY-globe.rotation.y)*ease;halo.scale.setScalar(reduced?1:1+Math.sin(time*2)*.1);renderer.render(world,camera);},dispose(){texture.dispose();renderer.dispose();world.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});el.remove();}};
}
