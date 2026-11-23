import {sampleArchitecture} from './letter-architecture.js';
import {createSceneAmbience} from './scene-ambience.js';
import {createJourney} from './journey-end.js';
import {mountRoofStudies} from './roof-studies.js';
import {createMiniGlobe} from './mini-globe.js';
import {createRoofWind} from './roof-wind.js';
import {createWindCursor} from './wind-cursor.js';
import { createArchitectureCard } from './architecture-card.js';
import * as T from './vendor/three.js';
import { createFrenchFlag } from './flag.js';
import { WindChimes } from './wind-chimes.js';
import { createBreeze,moveBreeze,leaveBreeze,advanceBreeze,stepCurtain } from './curtain-physics.js';
const $=s=>document.querySelector(s), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const scenes=[
{country:'CHINA',zh:'中国',title:['Golden roofs,','silent','<em>dynasties.</em>'],zt:['金色飞檐，','无声的','千年。'],desc:'Architecture as memory. A gilded silhouette suspended between earth and eternity.',zd:'建筑即记忆。金色轮廓悬于天地之间，檐下文字轻轻诉说千年。',name:'Imperial Echoes',zn:'帝国回响',tag:'Imperial architecture · 39.92° N, 116.40° E',mat:'GLAZED CERAMIC / ANTIQUE GOLD / TIMBER',color:'#a58241',text:'飞檐斗拱琉璃金瓦庭院山河岁月长风',stiff:.016,damp:.985},
{country:'JAPAN',zh:'日本',title:['Beneath eaves,','the art of','<em>stillness.</em>'],zt:['檐下，','静谧的','艺术。'],desc:'A quiet rhythm of timber and shadow. Space held gently by the curve of an eave.',zd:'木与影交织成安静的节奏。空间被屋檐的弧线轻轻托起。',name:'The Quiet Eaves',zn:'静谧屋檐',tag:'Shrine architecture · 35.01° N, 135.77° E',mat:'VERMILION LACQUER / DARK CERAMIC',color:'#804b3f',text:'木漏れ日静寂軒先風の音社寺',stiff:.03,damp:.966},
{country:'KAZAKHSTAN',zh:'哈萨克斯坦',title:['One sky,','a thousand','<em>journeys.</em>'],zt:['同一片天空，','千次','远行。'],desc:'Felt, bent timber and an open crown. A home woven beneath the boundless steppe sky.',zd:'毡布、弯木与敞开的 шаңырақ 天窗，在辽阔草原天空下编织游牧的家。',name:'Nomadic Sky',zn:'游牧之天',tag:'Nomadic architecture · The Eurasian steppe',mat:'WOOL FELT / BENT TIMBER / WOVEN BANDS',color:'#99734c',text:'ШАҢЫРАҚКИІЗҮЙДАЛААСПАН',stiff:.018,damp:.981},
{country:'FRANCE',zh:'法国',title:['Where stone','becomes','<em>music.</em>'],zt:['当石头，','化作','音乐。'],desc:'Patinated copper, pale stone and gilded notes. An architectural reverie after the Palais Garnier.',zd:'铜绿穹顶、浅色石材与金色音符，以巴黎歌剧院为灵感，凝结成一段建筑旋律。',name:'The Gilded Overture',zn:'鎏金序曲',tag:'Palais Garnier · Paris · Architectural study',mat:'PATINATED COPPER / LIMESTONE / GILDED BRONZE',color:'#858782',text:'MUSIQUELUMIÈREOPÉRAHARMONIE',stiff:.04,damp:.96},
{country:'GREECE',zh:'希腊',title:['Measured light,','marble','<em>eternity.</em>'],zt:['光的秩序，','大理石的','永恒。'],desc:'Fluted marble, carved friezes and measured light. A Doric portico dissolves into a colonnade of language.',zd:'凹槽大理石柱、雕刻饰带与光的秩序。多立克柱廊在下方，逐渐化作语言。',name:'Marble Eternity',zn:'石之永恒',tag:'Parthenon · Athens · Doric architectural study',mat:'PENTELIC MARBLE / FLUTED STONE / CARVED FRIEZE',color:'#a89c81',text:'ΦΩΣΑΡΜΟΝΙΑΚΙΩΝΜΑΡΜΑΡΟ',stiff:.05,damp:.956},
{country:'ITALY',zh:'意大利',title:['A dome holds','the shape of','<em>dreams.</em>'],zt:['穹顶之下，','梦有了','形状。'],desc:'Terracotta warmed by the Tuscan sun. Geometry unfolds into a human measure of harmony.',zd:'托斯卡纳阳光温暖了红陶。几何以人的尺度，展开和谐的形状。',name:'Renaissance Bloom',zn:'文艺复兴之花',tag:'Santa Maria del Fiore · Florence · Dome study',mat:'TERRACOTTA TILES / WHITE & GREEN MARBLE / GILT COPPER',color:'#ac694f',text:'ARMONIALUCECU POLAFIORE'.replaceAll(' ',''),stiff:.023,damp:.98}
];
let current=0,lang=false,transition=null,pending=null,time=0,drag=null,offset=0,prevOffset=0,overlayMode='',sound=null;
const ambience=createSceneAmbience(document.querySelector("#museum"),reduced);
const journey=createJourney({scenes,isChinese:()=>lang,getPreviews:()=>previews,onVisit:id=>go(id),onRestart:()=>{go(0);}});
const finishJourney=document.createElement('button');finishJourney.id='finish-journey';finishJourney.type='button';finishJourney.textContent='MY JOURNEY ↗';finishJourney.onclick=()=>{if(!transition)journey.show();};
const miniGlobe=createMiniGlobe({parent:$('#museum'),scenes,onSelect:id=>go(id),reduced});
const stage=$('#stage'),canvas=$('#canvas');createWindCursor(stage,reduced);
const storyCard=createArchitectureCard({isChinese:()=>lang,onClose:()=>leaveBreeze(pointer)});
const storyButton=document.createElement('button');storyButton.id='story-open';storyButton.type='button';storyButton.textContent='DISCOVER THE ARCHITECTURE ↗';$('#editorial').append(storyButton);storyButton.onpointerdown=e=>e.stopPropagation();storyButton.onclick=e=>{e.stopPropagation();const r=stage.getBoundingClientRect();storyCard.show(current,{x:r.x+r.width/2,y:r.y+r.height*.3});leaveBreeze(pointer);};
const roofRay=new T.Raycaster(),roofPointer=new T.Vector2();
function roofHit(e){const r=canvas.getBoundingClientRect();roofPointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);roofRay.setFromCamera(roofPointer,camera);return roofRay.intersectObject(roots[current],true).length>0;}
let detailMode=false;
const detailButton=document.createElement('button');
detailButton.id='detail-view';detailButton.type='button';detailButton.textContent='＋ VIEW DETAILS';detailButton.setAttribute('aria-pressed','false');
detailButton.addEventListener('pointerdown',e=>e.stopPropagation());
detailButton.addEventListener('click',()=>{detailMode=!detailMode;detailButton.setAttribute('aria-pressed',String(detailMode));detailButton.textContent=lang?(detailMode?'－ 返回全景':'＋ 查看细节'):(detailMode?'－ FULL VIEW':'＋ VIEW DETAILS');});
stage.append(detailButton);

const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
const world=new T.Scene(),camera=new T.OrthographicCamera(-5,5,5,-5,.1,100);camera.position.set(0,1.15,16);camera.lookAt(0,1.15,0);world.add(new T.HemisphereLight(0xfffaf0,0x554b40,.85));const light=new T.DirectionalLight(0xffedce,3.1);light.position.set(-5,8,6);light.castShadow=true;light.shadow.mapSize.set(1536,1536);Object.assign(light.shadow.camera,{left:-6,right:6,top:6,bottom:-5,near:.5,far:30});light.shadow.bias=-.00015;light.shadow.normalBias=.015;light.shadow.camera.updateProjectionMatrix();world.add(light);const fill=new T.DirectionalLight(0xdde7ef,.55);fill.position.set(5,3,-4);world.add(fill);
const letterRoofFade={value:0};
const dissolve={value:0},windDirection={value:1};let roofSway=0;
const mats={};function material(color,metal=.1){let key=color+metal;if(mats[key])return mats[key];const mat=new T.MeshStandardMaterial({color,metalness:metal,roughness:.38});
mat.onBeforeCompile=shader=>{shader.uniforms.windDissolve=dissolve;shader.uniforms.windDirection=windDirection;shader.uniforms.letterRoofFade=letterRoofFade;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float windDissolve;uniform float windDirection;varying vec3 vCraftPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCraftPosition=position;transformed.x+=windDirection*windDissolve*windDissolve*(.4+fract(sin(dot(position,vec3(12.9,78.2,31.4)))*43758.5))*2.;transformed.y+=sin(position.x*9.)*windDissolve*.12;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform float windDissolve;
uniform float letterRoofFade;
varying vec3 vCraftPosition;
float craftNoise(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
`).replace('#include <color_fragment>',`#include <color_fragment>
float cut=max(windDissolve,letterRoofFade);if(cut>=1.||(cut>0.001&&craftNoise(floor(vCraftPosition*28.))<cut))discard;
float grain=craftNoise(floor(vCraftPosition*240.));
float course=.5+.5*sin(vCraftPosition.y*125.+sin(vCraftPosition.x*12.)*.3);
diffuseColor.rgb*=.86+.1*grain+.04*course;
`);};mats[key]=mat;return mat;}
function mesh(g,m,parent,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
function box(p,x,y,z,w,h,d,c){return mesh(new T.BoxGeometry(w,h,d),material(c),p,x,y,z)}
function rod(p,a,b,r,c){let av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);let o=mesh(new T.CylinderGeometry(r,r,v.length(),8),material(c,.25),p);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(p,r,y,t,c){let o=mesh(new T.TorusGeometry(r,t,12,100),material(c,.2),p,0,y,0);o.rotation.x=Math.PI/2;return o;}
function roof(p,w,d,y,h,c){const n=64,m=22,v=[],idx=[];for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){let u=i/n*2-1,s=j/m*2-1;v.push(u*w/2,y+h*(1-Math.abs(s))+.26*Math.pow(Math.abs(u),7)+.17*Math.pow(Math.abs(s),8),s*d/2);}for(let j=0;j<m;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i;idx.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();let ma=material(c,.42).clone();ma.side=T.DoubleSide;mesh(g,ma,p);
for(let i=0;i<=50;i++){let u=i/50*2-1;for(let side of [-1,1]){let points=[];for(let j=0;j<=20;j++){let s=j/20;points.push(new T.Vector3(u*w/2,y+h*(1-s)+.26*Math.pow(Math.abs(u),7)+.17*Math.pow(s,8)+.02,side*s*d/2));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),20,.018,4,false),material(i%4===0?'#d8b969':c,.35),p);}}
for(let s of [-1,1])for(let j=0;j<12;j++){let k=j/12;box(p,0,y+h*(1-k)+.17*k**8,s*k*d/2,w,.022,.024,'#a17c38');}rod(p,[-w/2,y+h+.25,0],[w/2,y+h+.25,0],.065,c);}
// A four-sided hipped roof: a shortened ridge, swept hips and a concave eave profile.
function palaceRoof(p,w,d,base,height,ridgeHalf){
 const gold=material('#966218',.12),tileGold=material('#b37b22',.16),edgeGold=material('#c58d2f',.2),shade=material('#674025');
 function point(face,u,t,lift=0){
  const half=ridgeHalf+(w/2-ridgeHalf)*t;
  const y=base+height*Math.pow(1-t,1.65)+.23*Math.pow(Math.abs(u),8)*Math.pow(t,4)+lift;
  if(face<2)return new T.Vector3(u*half,y,(face===0?1:-1)*d/2*t);
  return new T.Vector3((face===2?1:-1)*half,y,u*d/2*t);
 }
 function tube(points,r,mat,segments=24){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,6,false),mat,p);}
 for(let face=0;face<4;face++){
  const v=[],index=[],nu=face<2?64:32,nt=24;
  for(let j=0;j<=nt;j++)for(let i=0;i<=nu;i++){const a=point(face,i/nu*2-1,j/nt);v.push(a.x,a.y,a.z);}
  for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;const tri=[a,a+nu+1,a+1,a+1,a+nu+1,a+nu+2];if(face===1||face===2)tri.reverse();index.push(...tri);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(index);g.computeVertexNormals();
  // Consistent outward normals for every face, including the triangular hips.
  const normals=g.attributes.normal;for(let i=0;i<normals.count;i++)if(normals.getY(i)<0)normals.setXYZ(i,-normals.getX(i),-normals.getY(i),-normals.getZ(i));
  gold.side=T.DoubleSide;mesh(g,gold,p);
  const rows=face<2?86:40;
  for(let i=0;i<=rows;i++){
   const u=i/rows*2-1,points=[];for(let j=0;j<=24;j++)points.push(point(face,u,.035+j/24*.965,.018));
   tube(points,.026,i%3===0?edgeGold:tileGold);
   if(face===0)for(let k=1;k<10;k++){const t=k/10,a=point(face,u-.004,t,.028),b=point(face,u+.004,t,.028);rod(p,[a.x,a.y,a.z],[b.x,b.y,b.z],.009,'#80531a');}
   // Rounded end caps and dark channels make the glazed tile courses legible.
   const end=point(face,u,1,.019);mesh(new T.SphereGeometry(.032,8,6),edgeGold,p,end.x,end.y,end.z);
  }
  const eave=[];for(let i=0;i<=64;i++)eave.push(point(face,i/64*2-1,1,-.028));
  tube(eave,.052,edgeGold,64);tube(eave.map(v=>v.clone().add(new T.Vector3(0,-.08,0))),.065,shade,64);
 }
 // One main ridge and four pronounced diagonal hip ridges.
 rod(p,[-ridgeHalf,base+height+.045,0],[ridgeHalf,base+height+.045,0],.065,'#d8a13a');
 for(const side of [-1,1])for(const front of [-1,1]){
  const points=[];for(let i=0;i<=32;i++){const t=i/32;points.push(new T.Vector3(side*(ridgeHalf+(w/2-ridgeHalf)*t),base+height*Math.pow(1-t,1.65)+.23*t**4+.065,front*d/2*t));}
  tube(points,.055,edgeGold,32);
  // Small roof guardians follow the rising hip, rather than floating over the eave.
  for(let k=0;k<7;k++){const t=.58+k*.052,a=points[Math.round(t*32)],s=.042;
   const body=mesh(new T.SphereGeometry(s,8,6),tileGold,p,a.x,a.y+.062,a.z);body.scale.set(1,1.25,1.7);
   mesh(new T.SphereGeometry(s*.7,8,6),edgeGold,p,a.x,a.y+.13,a.z-front*.025);
  }
 }
 // Stylized chiwen ornaments with a curved, upright silhouette at both ridge ends.
 for(const side of [-1,1]){
  const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.16,.04,.19,.18,.12,.29);shape.bezierCurveTo(.08,.39,.17,.5,.23,.48);shape.bezierCurveTo(.28,.3,.33,.12,.26,-.015);shape.lineTo(-.08,-.035);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1});
  const o=mesh(g,edgeGold,p,side*ridgeHalf,base+height+.04,-.05);o.scale.set(side*.8,.68,1);
 }
}
function palace(p){
 const timber='#663626',red='#853d29',blue='#294b4c',gold='#c99432';
 // A connected entablature replaces the detached rectangular blocks.
 box(p,0,1.13,0,4.9,.13,2.1,timber);
 box(p,0,1.24,0,4.98,.12,2.2,red);
 box(p,0,1.32,0,5.12,.08,2.36,timber);
 for(const z of [-1.14,1.14]){
  box(p,0,1.235,z,4.8,.065,.025,blue);
  for(let x=-2.3;x<=2.31;x+=.23){
   box(p,x,1.29,z,.075,.12,.2,red);
   box(p,x,1.34,z,.19,.06,.27,timber);
   box(p,x,1.23,z+.017,.11,.018,.03,gold);
  }
 }
 palaceRoof(p,5.85,3.2,1.43,.88,1.62);
 // Narrow red and blue painted register between the two roof tiers.
 box(p,0,2.25,0,3.65,.28,1.68,red);
 for(const z of [-.86,.86]){
  box(p,0,2.31,z,3.68,.045,.04,blue);
  box(p,0,2.21,z,3.68,.035,.04,timber);
  for(let x=-1.7;x<=1.71;x+=.22){box(p,x,2.3,z,.035,.15,.08,gold);}
 }
 palaceRoof(p,4.9,2.72,2.48,1.05,1.28);
}

// Shrine study: a dark irimoya roof, timber brackets and a projecting gabled portico.
function shrine(p){
 const red='#893a29',dark='#292d2d',tile=material('#3c4342',.08),trim=material('#252a29',.12),wood='#573326',brass='#967345';
 function curve(points,r,mat,segments=24){mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,6,false),mat,p);}
 function surface(point,nu,nt,mat){const v=[],index=[];for(let j=0;j<=nt;j++)for(let i=0;i<=nu;i++){const a=point(i/nu*2-1,j/nt);v.push(a.x,a.y,a.z);}for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;index.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(index);g.computeVertexNormals();const n=g.attributes.normal;for(let i=0;i<n.count;i++)if(n.getY(i)<0)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));mat.side=T.DoubleSide;mesh(g,mat,p);}
 // Continuous deep eaves, with the hip joining the gable at the upper slope.
 for(let face=0;face<4;face++){
  const point=(u,t)=>{const spread=1.78+1.13*Math.max(0,(t-.42)/.58),y=1.53+1.78*Math.pow(1-t,1.48)+.15*Math.pow(Math.abs(u),8)*t**5;
   return face<2?new T.Vector3(u*spread,y,(face===0?1:-1)*1.65*t):new T.Vector3((face===2?1:-1)*spread,y,u*1.65*t);};
  surface(point,face<2?60:24,24,tile);
  const count=face<2?75:30;for(let i=0;i<=count;i++){const pts=[];for(let j=0;j<=24;j++){let a=point(i/count*2-1,j/24);a.y+=.018;pts.push(a);}curve(pts,.018,i%4===0?trim:tile);}
  for(let course=1;course<15;course++){let points=[];for(let i=0;i<=40;i++){let a=point(i/40*2-1,course/15);a.y+=.023;points.push(a);}curve(points,.009,trim,40);}
  const edge=[];for(let i=0;i<=40;i++)edge.push(point(i/40*2-1,1));curve(edge,.06,trim,40);curve(edge.map(a=>a.clone().add(new T.Vector3(0,-.085,0))),.065,material(wood),40);
 }
 // Exposed triangular gable ends above the lower hipped skirt.
 for(const side of [-1,1]){
  const x=side*1.785,y=1.53+1.78*Math.pow(.58,1.48),z=.693;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([x,3.3,0,x,y,z,x,y,-z],3));g.computeVertexNormals();const mat=material('#543b29');mat.side=T.DoubleSide;mesh(g,mat,p);
  rod(p,[x,3.3,0],[x,y,z],.036,'#aa9674');rod(p,[x,3.3,0],[x,y,-z],.036,'#aa9674');
 }
 // Tiled ridge with raised end pieces, restrained in scale.
 for(let i=0;i<5;i++)box(p,0,3.32+i*.045,0,3.72-i*.06,.05,.19-i*.015,dark);
 for(let side of [-1,1]){rod(p,[side*1.75,3.34,0],[side*1.94,3.57,0],.045,dark);}
 box(p,0,1.19,0,4.72,.18,2.2,wood);box(p,0,1.34,0,4.86,.16,2.35,red);
 for(let z of [-1.14,1.14])for(let x=-2.25;x<=2.26;x+=.28){
  box(p,x,1.44,z,.06,.13,.42,red);box(p,x,1.35,z,.19,.065,.33,wood);
  box(p,x,1.23,z,.11,.075,.12,red);
 }
 // Chidori-style gable above the entrance: carved bargeboards and a dark roof cap.
 const front=1.46,shape=new T.Shape();shape.moveTo(-1.03,1.84);shape.lineTo(0,2.78);shape.lineTo(1.03,1.84);shape.closePath();
 mesh(new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1}),material('#8d422d'),p,0,0,front);
 for(let side of [-1,1]){
  const edge=[];for(let i=0;i<=24;i++){let t=i/24;edge.push(new T.Vector3(side*1.18*t,2.85-1.12*t+.15*t**4,front+.23));}
  curve(edge,.075,material('#b8a27c'));curve(edge.map(a=>a.clone().add(new T.Vector3(0,.065,.035))),.045,trim);
  const cap=(u,t)=>new T.Vector3(side*1.2*t,2.9-1.12*t+.15*t**4,front+.24-(u+1)*.32);
  surface(cap,12,24,tile);
 }
 for(let x=-.7;x<=.71;x+=.12){const h=.68*(1-Math.abs(x)/.85);box(p,x,1.94+h/2,front+.18,.035,h,.025,'#543b29');}
 box(p,0,1.86,front+.2,2.12,.1,.12,wood);
 const crest=mesh(new T.TorusGeometry(.1,.016,8,24),material(brass,.5),p,0,2.28,front+.21);mesh(new T.SphereGeometry(.036,12,8),material(brass,.5),p,0,2.28,front+.23);
 // Projecting supporting brackets keep the roof visibly connected to its timber frame.
 for(let x of [-1.05,1.05]){box(p,x,1.55,1.29,.13,.65,.18,red);box(p,x,1.42,1.4,.35,.09,.32,wood);}
}

// Kazakh kiiz ui study: felt cover, uyk poles, shanyrak crown and a woven perimeter band.
function kazakhYurt(p){
 const timber='#74452e',innerWood='#9e6b43',felt=material('#cfc4ac',0),seam=material('#b6a78e',0),rope=material('#786247',0),braid=material('#e0cba0',0);
 felt.roughness=.98;seam.roughness=1;rope.roughness=.95;braid.roughness=.95;
 function tube(points,r,mat,segments=32){mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,6,false),mat,p);}
 function dome(a,t,lift=0){let r=.61+1.94*t,y=2.96-1.57*Math.pow(t,1.34)+.012*Math.sin(a*20)*Math.sin(t*Math.PI);return new T.Vector3(Math.cos(a)*r,y+lift,Math.sin(a)*r);}
 // A real open crown, not a cap: its bowed crosspieces remain visible through the oculus.
 ring(p,.63,2.96,.072,timber);ring(p,.64,3.035,.027,innerWood);ring(p,.64,2.89,.024,timber);
 for(let axis=0;axis<2;axis++)for(let shift of [-.23,0,.23]){
  const half=Math.sqrt(.58*.58-shift*shift),points=[];
  for(let i=0;i<=20;i++){let x=-half+i/20*half*2,y=2.985+.15*Math.sin(i/20*Math.PI);points.push(axis===0?new T.Vector3(x,y,shift):new T.Vector3(shift,y,x));}
  tube(points,.022,material(innerWood),20);
 }
 // Curved uyk poles under the insulating felt.
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,points=[];for(let j=0;j<=24;j++)points.push(dome(a,j/24,-.055));tube(points,.025,material(innerWood),24);}
 // Thick felt shell with an open top and a turned lower hem.
 const profile=[];for(let i=0;i<=48;i++){const t=i/48;profile.push(new T.Vector2(.61+1.94*t,2.96-1.57*Math.pow(t,1.34)));}
 profile.push(new T.Vector2(2.57,1.34),new T.Vector2(2.56,1.29),new T.Vector2(2.51,1.29));
 felt.side=T.DoubleSide;mesh(new T.LatheGeometry(profile,128),felt,p);
 // Stitched panel joins follow the sloping cover, with small, irregular fabric relief.
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,points=[];for(let j=0;j<=32;j++)points.push(dome(a,j/32,.013));tube(points,.009,seam,32);}
 // Tensioning ties pass over the felt, retaining the original woven construction language.
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;for(let delta of [-.009,.009]){const points=[];for(let j=0;j<=32;j++)points.push(dome(a+delta,.03+j/32*.97,.033));tube(points,.014,rope,32);}}
 ring(p,2.535,1.35,.035,'#a08b68');ring(p,2.54,1.08,.043,timber);
 // A narrow woven valance leaves the moving typography as the implied circular walls.
 const band=material('#753e30',0);band.roughness=.96;
 mesh(new T.CylinderGeometry(2.535,2.535,.24,128,1,true),band,p,0,1.205,0);
 for(let y of [1.095,1.115,1.295,1.315])ring(p,2.544,y,.008,'#d1b786');
 // Paired scrolls are an abstract textile study, modelled around the full circumference.
 for(let k=0;k<48;k++){
  const a=k/48*Math.PI*2;
  for(const side of [-1,1]){const pts=[];for(let j=0;j<=24;j++){const t=j/24,phi=t*Math.PI*1.9,r=.071*(1-.72*t),local=side*(.027+r*Math.cos(phi)),theta=a+local/2.55;pts.push(new T.Vector3(Math.cos(theta)*2.55,1.205+r*Math.sin(phi),Math.sin(theta)*2.55));}tube(pts,.008,braid,24);}
 }
 // A short exposed kerege lattice connects the frame and the hanging typographic wall.
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2;for(let dir of [-1,1]){const b=a+dir*.07;rod(p,[Math.cos(a)*2.49,1.07,Math.sin(a)*2.49],[Math.cos(b)*2.49,1.3,Math.sin(b)*2.49],.014,innerWood);}}
}

// A sculptural interpretation of the Palais Garnier, with a recessed loggia and patinated dome.
function frenchOpera(p){
 const stone=material('#bfb19a',0),pale=material('#d7c9b0',0),marble=material('#775448',.05),copper=material('#466d66',.3),rib=material('#6b8b7c',.25),gold=material('#b28b42',.55),glass=material('#303b3d',.25);
 stone.roughness=.82;pale.roughness=.7;marble.roughness=.38;copper.roughness=.55;glass.roughness=.3;
 const c='#bfb19a',lit='#d7c9b0';
 function tube(pts,r,mat,n=32){mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),n,r,6,false),mat,p);}
 function ellipse(x,y,z,rx,ry,rz,mat){const o=mesh(new T.SphereGeometry(1,16,10),mat,p,x,y,z);o.scale.set(rx,ry,rz);return o;}
 function archPath(x,y,r){const path=new T.Path();path.moveTo(x-r,1.11);path.lineTo(x-r,y);path.absarc(x,y,r,Math.PI,0,true);path.lineTo(x+r,1.11);path.closePath();return path;}
 // Openings are cut through the facade, so the colonnade has real thickness and shadow.
 const facade=new T.Shape();facade.moveTo(-2.98,1.08);facade.lineTo(2.98,1.08);facade.lineTo(2.98,2.55);facade.lineTo(-2.98,2.55);facade.closePath();
 for(let x of [-1.88,-.94,0,.94,1.88])facade.holes.push(archPath(x,1.89,.35));
 mesh(new T.ExtrudeGeometry(facade,{depth:.34,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1}),stone,p,0,0,-.18);
 for(let x of [-1.88,-.94,0,.94,1.88]){
  const opening=new T.Shape();opening.moveTo(x-.35,1.12);opening.lineTo(x+.35,1.12);opening.lineTo(x+.35,1.89);opening.absarc(x,1.89,.35,0,Math.PI,false);opening.closePath();
  mesh(new T.ShapeGeometry(opening),glass,p,0,0,-.24);
  for(let a=-1;a<=1;a++)box(p,x+a*.14,1.65,-.22,.014,1.02,.02,'#9d8b6a');
  for(let y of [1.4,1.75,1.92])box(p,x,y,-.21,.66,.014,.025,'#9d8b6a');
  const pts=[];for(let i=0;i<=32;i++){let a=i/32*Math.PI;pts.push(new T.Vector3(x+Math.cos(a)*.39,1.89+Math.sin(a)*.39,.23));}tube(pts,.039,pale);
  box(p,x,2.31,.24,.13,.18,.14,lit);
  // Balustraded loggia sill, interrupted by the paired marble columns.
  box(p,x,1.15,.36,.78,.07,.3,lit);
  for(let i=-3;i<=3;i++){
   const bal=mesh(new T.LatheGeometry([new T.Vector2(.023,0),new T.Vector2(.032,.025),new T.Vector2(.016,.055),new T.Vector2(.025,.1),new T.Vector2(.02,.145)],8),pale,p,x+i*.09,1.16,.45);
  }
  box(p,x,1.32,.45,.79,.045,.12,c);
 }
 // Paired columns in coloured marble, with gilded capitals.
 for(let bay=0;bay<6;bay++)for(let pair of [-1,1]){
  const x=-2.35+bay*.94+pair*.095,z=.42;
  mesh(new T.CylinderGeometry(.06,.073,.9,20),marble,p,x,1.72,z);
  for(let y of [1.25,1.29,2.16,2.2]){const o=mesh(new T.TorusGeometry(.075,.014,6,20),pale,p,x,y,z);o.rotation.x=Math.PI/2;}
  mesh(new T.CylinderGeometry(.105,.065,.12,12),pale,p,x,2.25,z);
  for(let k=0;k<8;k++){let a=k/8*Math.PI*2;const leaf=ellipse(x+Math.cos(a)*.09,2.26,z+Math.sin(a)*.09,.024,.065,.018,gold);leaf.rotation.z=Math.sin(a)*.3;}
  box(p,x,2.34,z,.23,.06,.23,lit);
 }
 // Projecting limestone cornices and an ornamented attic register.
 for(let [y,w,h,d] of [[1.09,6.14,.08,1.3],[2.43,6.12,.1,1.25],[2.53,6.24,.065,1.4],[2.77,6.1,.07,1.3],[2.84,6.25,.065,1.43]])box(p,0,y,0,w,h,d,lit);
 box(p,0,2.65,0,6.06,.18,1.12,c);
 for(let x=-2.95;x<=2.96;x+=.13)box(p,x,2.48,.67,.065,.075,.13,c);
 for(let x of [-2.35,-1.41,-.47,.47,1.41,2.35]){
  ellipse(x,2.65,.59,.09,.07,.035,gold);
  for(let side of [-1,1]){const pts=[];for(let j=0;j<=20;j++){let t=j/20;pts.push(new T.Vector3(x+side*(.11+.21*t),2.66-.065*Math.sin(t*Math.PI),.59));}tube(pts,.011,pale,20);}
 }
 // A broad, low copper dome rises behind the facade, with panel seams and a crest.
 const profile=[];for(let i=0;i<=40;i++){let a=i/40*Math.PI/2;profile.push(new T.Vector2(1.73*Math.cos(a),2.81+1.13*Math.sin(a)));}
 mesh(new T.LatheGeometry(profile,96),copper,p,0,0,-.24);
 for(let k=0;k<24;k++){let a=k/24*Math.PI*2,pts=[];for(let i=0;i<=32;i++){let b=i/32*Math.PI/2;pts.push(new T.Vector3(1.745*Math.cos(b)*Math.cos(a),2.81+1.14*Math.sin(b),-.24+1.745*Math.cos(b)*Math.sin(a)));}tube(pts,.013,rib);}
 for(let k=1;k<8;k++){let a=k/9*Math.PI/2,r=1.74*Math.cos(a),y=2.81+1.14*Math.sin(a);const o=mesh(new T.TorusGeometry(r,.009,6,96),rib,p,0,y,-.24);o.rotation.x=Math.PI/2;}
 ring(p,1.73,2.85,.037,'#657d6b').position.z=-.24;
 mesh(new T.CylinderGeometry(.105,.16,.11,16),gold,p,0,3.99,-.24);ellipse(0,4.09,-.24,.065,.1,.065,gold);
 // Side pavilions, slate hoods and gilded lyres create a distinctly theatrical silhouette.
 for(let side of [-1,1]){
  const x=side*2.65;box(p,x,2.05,0,.58,.7,1.1,c);box(p,x,2.94,0,.76,.13,.85,c);
  const roof=mesh(new T.CylinderGeometry(.23,.47,.25,4),material('#3d474a',.12),p,x,3.12,0);roof.rotation.y=Math.PI/4;
  box(p,x,3.27,0,.52,.07,.55,lit);
  // Sculpted lyre and laurels are intentionally abstract, rather than miniature human figures.
  const pts=[new T.Vector3(x-.14,3.62,.04),new T.Vector3(x-.16,3.43,.04),new T.Vector3(x,3.34,.04),new T.Vector3(x+.16,3.43,.04),new T.Vector3(x+.14,3.62,.04)];tube(pts,.026,gold,32);
  rod(p,[x-.16,3.59,.04],[x+.16,3.59,.04],.023,'#b28b42');
  for(let i=-2;i<=2;i++)rod(p,[x+i*.043,3.4,.04],[x+i*.043,3.59,.04],.006,'#b28b42');
  for(let hand of [-1,1])for(let k=0;k<5;k++){const leaf=ellipse(x+hand*(.16+k*.023),3.4+k*.037,0,.025,.065,.02,gold);leaf.rotation.z=-hand*.6;}
 }
}

// A Doric entablature and octastyle portico, inspired by the Parthenon.
// Raised leaf relief, kept shallow enough to read as carved stone rather than applied metal.
function stoneLeaf(p,x,y,z,width,height,angle,mat){
 const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-width*.55,height*.3,-width*.48,height*.7,0,height);shape.bezierCurveTo(width*.48,height*.7,width*.55,height*.3,0,0);
 const geometry=new T.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:true,bevelThickness:.009,bevelSize:.007,bevelSegments:1,steps:1,curveSegments:5});
 const leaf=mesh(geometry,mat,p,x,y,z);leaf.rotation.z=angle;return leaf;
}
function greekCarvingDetails(p){
 const raised=material('#e6d7b9',0),recess=material('#8e8068',0);raised.roughness=.78;recess.roughness=.95;
 // A pronounced bead-and-reel course and egg-shaped moulding below the architrave.
 for(let i=0;i<64;i++){
  const x=-2.93+i*5.86/63;
  const bead=mesh(new T.SphereGeometry(1,10,8),raised,p,x,2.475,1.101);bead.scale.set(.027,.041,.024);
  if(i<63)box(p,x+.0465,2.475,1.087,.018,.062,.028,'#8e8068');
 }
 // Larger palmette fans repeat along the raking cornice, following its slope.
 for(let side of [-1,1])for(let k=1;k<=10;k++){
  const t=k/11,x=side*3.02*t,y=3.99-.86*t;
  for(let j=-2;j<=2;j++)stoneLeaf(p,x+j*.013,y,1.2,.033,.074-Math.abs(j)*.009,-j*.28,raised);
  const curl=mesh(new T.TorusGeometry(.032,.008,6,16),raised,p,x,y+.016,1.2);curl.scale.y=.5;
 }
 // Deepen the drapery cuts so the pediment reads as relief at gallery scale.
 for(let i=-5;i<=5;i++){
  const x=i*.43,h=.58*(1-Math.abs(x)/3);
  for(let j=-1;j<=1;j++)rod(p,[x+j*.018,3.18+h*.36,1.151],[x+j*.035,3.205,1.151],.008,'#8e8068');
 }
}
function italianCarvingDetails(p){
 const raised=material('#e4d5b7',0),green=material('#42594d',.05),cut=material('#94846a',0);raised.roughness=.75;green.roughness=.8;cut.roughness=.92;
 const rot=Math.PI/8,R=2.02;
 for(let side=0;side<8;side++){
  const a=rot+(side+.5)*Math.PI/4,r=R*Math.cos(Math.PI/8)+.035;
  const panel=new T.Group();panel.position.set(Math.cos(a)*r,1.28,Math.sin(a)*r);panel.rotation.y=Math.PI/2-a;p.add(panel);
  // Alternating dark stone inlay and projecting marble borders around each oculus.
  const panelWidth=2*R*Math.sin(Math.PI/8);
  for(let offset of [-panelWidth*.34,panelWidth*.34]){
   box(panel,offset,0,0,.17,.26,.035,'#42594d');
   for(let x of [-.103,.103])box(panel,offset+x,0,.028,.026,.31,.025,'#e4d5b7');
   for(let y of [-.155,.155])box(panel,offset,y,.028,.23,.027,.025,'#e4d5b7');
   for(let sign of [-1,1])stoneLeaf(panel,offset,sign*.02,.045,.05,.1,sign===1?0:Math.PI,raised);
  }
  for(let i=0;i<36;i++){
   const theta=i/36*Math.PI*2;
   const bead=mesh(new T.SphereGeometry(.013,8,6),raised,panel,Math.cos(theta)*.177,Math.sin(theta)*.177,.025);
  }
  // A carved frieze runs around the octagonal cornice above the drum.
  for(let i=-4;i<=4;i++){
   stoneLeaf(panel,i*.145,.18,.035,.045,.073,0,raised);
   box(panel,i*.145,.176,.018,.068,.012,.018,'#94846a');
  }
 }
 // Small capitals and collars articulate the lantern's eight slender supports.
 for(let i=0;i<8;i++){
  const a=rot+i*Math.PI/4,x=Math.cos(a)*.25,z=Math.sin(a)*.25;
  for(let y of [3.49,3.79]){
   const collar=mesh(new T.TorusGeometry(.039,.011,6,20),raised,p,x,y,z);collar.rotation.x=Math.PI/2;
  }
  for(let k=0;k<4;k++){let b=k*Math.PI/2;const leaf=mesh(new T.SphereGeometry(1,8,6),raised,p,x+Math.cos(b)*.027,3.79,z+Math.sin(b)*.027);leaf.scale.set(.02,.048,.02);}
 }
}

function greekTemple(p){
 const marble=material('#c9bea6',0),pale=material('#e0d5bf',0),cut=material('#a69980',0),relief=material('#d1c5ad',0);
 marble.roughness=.8;pale.roughness=.7;cut.roughness=.95;relief.roughness=.84;
 // A quiet mineral grain and veining, kept in object space so it follows the stone.
 for(const mat of [marble,pale,cut,relief]){
  const baseCompile=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{baseCompile(shader);shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.rgb*=.86+.1*grain+.04*course;',`float mineral=sin(vCraftPosition.x*8.+sin(vCraftPosition.y*6.+vCraftPosition.z*9.)*1.8);
float vein=pow(.5+.5*sin(vCraftPosition.x*23.+vCraftPosition.y*5.+mineral*2.),18.);
diffuseColor.rgb*=.93+.05*grain-.12*vein;`);};
 }
 const c='#c9bea6',lit='#e0d5bf',shadow='#a69980';
 function ball(x,y,z,rx,ry,rz,mat=relief){const o=mesh(new T.SphereGeometry(1,14,10),mat,p,x,y,z);o.scale.set(rx,ry,rz);return o;}
 function mould(a,b,width,depth,color){const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5);const o=box(p,mid.x,mid.y,mid.z,av.distanceTo(bv),width,depth,color);o.rotation.z=Math.atan2(bv.y-av.y,bv.x-av.x);return o;}
 const columns=Array.from({length:8},(_,i)=>(i-3.5)*.73);
 // Flutes are carved into each shaft, with a slight entasis and taper.
 function column(x,z,back=false){
  const v=[],idx=[],around=160,levels=18,bottom=1.08,top=2.2;
  for(let j=0;j<=levels;j++){const t=j/levels,r=.163-.026*t+.009*Math.sin(t*Math.PI);for(let i=0;i<=around;i++){const a=i/around*Math.PI*2,flute=.022*(.5+.5*Math.cos(a*20)),rr=r-flute;v.push(x+Math.cos(a)*rr,bottom+t*(top-bottom),z+Math.sin(a)*rr);}}
  for(let j=0;j<levels;j++)for(let i=0;i<around;i++){const a=j*(around+1)+i;idx.push(a,a+around+1,a+1,a+1,a+around+1,a+around+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,marble,p);
  for(let y of [2.19,2.22,2.245]){const o=mesh(new T.TorusGeometry(.139,.009,6,40),pale,p,x,y,z);o.rotation.x=Math.PI/2;}
  const echinus=[new T.Vector2(.137,0),new T.Vector2(.145,.028),new T.Vector2(.17,.065),new T.Vector2(.194,.086),new T.Vector2(.195,.11)];
  mesh(new T.LatheGeometry(echinus,40),pale,p,x,2.25,z);
  box(p,x,2.395,z,.43,.095,.43,lit);
 }
 for(let x of columns)column(x,.79);
 // The receding side portico gives the fragment real depth even in a frontal composition.
 for(let x of [columns[0],columns[7]])for(let z of [-.05,-.85])column(x,z,true);
 box(p,0,2.52,0,5.96,.18,2.16,c);
 box(p,0,2.635,0,6.02,.045,2.22,lit);
 box(p,0,2.82,0,5.98,.31,2.16,c);
 // Alternating triglyphs and recessed metopes, not a blank triangular slab.
 for(let z of [-1.095,1.095]){
  for(let i=0;i<=14;i++){
   const x=-2.77+i*5.54/14;
   box(p,x,2.82,z,.17,.285,.055,shadow);
   for(let side of [-1,0,1])box(p,x+side*.052,2.82,z+Math.sign(z)*.034,.027,.275,.022,lit);
   box(p,x,2.64,z,.22,.035,.085,lit);
   for(let dot=0;dot<6;dot++)mesh(new T.CylinderGeometry(.011,.014,.025,6),pale,p,x-.083+dot*.033,2.606,z);
   if(i<14){let mx=x+.198;box(p,mx,2.82,z,.2,.23,.02,c);const torso=ball(mx,2.82,z+Math.sign(z)*.028,.052,.078,.022);torso.rotation.z=Math.sin(i)*.3;ball(mx+.014,2.91,z+Math.sign(z)*.027,.026,.031,.022);}
  }
 }
 for(let [y,w,h,d] of [[2.99,6.12,.07,2.3],[3.065,6.24,.065,2.4]])box(p,0,y,0,w,h,d,lit);
 // Deep pediment with a recessed tympanum and individually articulated cornices.
 const triangle=new T.Shape();triangle.moveTo(-3.08,3.1);triangle.lineTo(0,3.96);triangle.lineTo(3.08,3.1);triangle.closePath();
 mesh(new T.ExtrudeGeometry(triangle,{depth:2.1,bevelEnabled:true,bevelSize:.018,bevelThickness:.02,bevelSegments:2,steps:1}),marble,p,0,0,-1.05);
 const inset=new T.Shape();inset.moveTo(-2.69,3.16);inset.lineTo(0,3.86);inset.lineTo(2.69,3.16);inset.closePath();mesh(new T.ShapeGeometry(inset),cut,p,0,0,1.078);
 for(let side of [-1,1])for(let layer=0;layer<3;layer++)mould([0,3.99+layer*.022,1.1+layer*.035],[side*(3.14+layer*.025),3.11+layer*.018,1.1+layer*.035],.037+layer*.01,.065,layer===1?c:lit);
 // Shallow sculptural groups vary in pose and size with the height of the pediment.
 for(let i=-5;i<=5;i++){
  const x=i*.43,h=.58*(1-Math.abs(x)/3),base=3.18,z=1.11,lean=Math.sin(i*1.3)*.07;
  ball(x+lean,base+h*.84,z,.033,.043,.03);
  const torso=ball(x,base+h*.55,z,.06,h*.22,.038);torso.rotation.z=-lean*3;
  const robe=ball(x-lean*.3,base+h*.21,z,.092,h*.23,.029);robe.rotation.z=lean*2;
  for(let side of [-1,1]){
   const elbow=[x+side*.085,base+h*.46,z+.015],hand=[x+side*.125,base+h*(.48+.2*Math.cos(i+side)),z+.025];
   rod(p,[x+side*.035,base+h*.64,z],elbow,.016,c);rod(p,elbow,hand,.014,c);
  }
  for(let j=0;j<3;j++)rod(p,[x+(j-1)*.017,base+h*.4,z+.03],[x+(j-1)*.032,base+.02,z+.03],.005,lit);
 }
 // Low-pitched roof with overlapping Pentelic marble pan tiles and raised cover joints.
 for(let side of [-1,1])for(let row=0;row<13;row++)for(let col=0;col<8;col++){
  const x=side*(row+.5)*3.15/13,y=3.995-Math.abs(x)*.86/3.08,z=-1.32+(col+.5)*2.64/8;
  const mat=[marble,pale,relief][(row*7+col*3)%3];
  const slab=mesh(new T.BoxGeometry(.253,.034,.34),mat,p,x,y,z);slab.rotation.z=-side*Math.atan(.86/3.08);
  if(col<7){const joint=mesh(new T.BoxGeometry(.256,.024,.027),pale,p,x,y+.024,z+.167);joint.rotation.z=slab.rotation.z;}
 }
 for(let z of [-1.32,1.32])mould([-3.17,3.12,z],[3.17,3.12,z],.055,.1,lit);
 // A restrained anthemion at the apex, rather than an unrelated metal finial.
 for(let k=-3;k<=3;k++){
  const a=k*.2,leaf=ball(Math.sin(a)*.13,4.05+Math.cos(a)*.09,0,.025,.09,.018,pale);leaf.rotation.z=-a;
 }
}

// Eight masonry sails on an octagonal drum, inspired by Florence Cathedral.
function florenceDome(p){
 const ivory=material('#d4c8af',0),green=material('#4b6057',.05),dark=material('#3d4540',.08),rib=material('#e1d5bc',0),roofColors=['#a95c3d','#b46b48','#a35a3c','#bc7350','#995139'];
 ivory.roughness=.75;rib.roughness=.7;green.roughness=.8;
 const tiles=roofColors.map(c=>{const m=material(c,0);m.roughness=.92;return m;});
 const rotation=Math.PI/8,radius=2.02,base=1.52,height=1.87;
 function point(side,u,t,lift=0){
  // Interpolate across each octagonal edge; do not turn the shell into a round hemisphere.
  const a=rotation+side*Math.PI/4,b=a+Math.PI/4;
  const taper=1-.86*Math.pow(t,1.55),bulge=1+.026*Math.sin(Math.PI*u)*Math.sin(Math.PI*t);
  return new T.Vector3(((1-u)*Math.cos(a)+u*Math.cos(b))*radius*taper*bulge,base+height*t+lift,((1-u)*Math.sin(a)+u*Math.sin(b))*radius*taper*bulge);
 }
 function tube(points,r,mat,n=32){mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),n,r,6,false),mat,p);}
 function polygonRing(r,y,t,color){for(let i=0;i<8;i++){const a=rotation+i*Math.PI/4,b=a+Math.PI/4;rod(p,[Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(b)*r,y,Math.sin(b)*r],t,color);}}
 // White and green marble panels run around the eight-sided drum.
 const drum=mesh(new T.CylinderGeometry(radius,radius,.48,8),ivory,p,0,1.27,0);drum.rotation.y=-rotation;
 for(let side=0;side<8;side++){
  const a=rotation+(side+.5)*Math.PI/4,r=radius*Math.cos(Math.PI/8)+.008;
  const window=mesh(new T.CircleGeometry(.125,32),dark,p,Math.cos(a)*r,1.28,Math.sin(a)*r);window.rotation.y=Math.PI/2-a;
  const surround=mesh(new T.TorusGeometry(.145,.026,8,32),rib,p,Math.cos(a)*(r+.012),1.28,Math.sin(a)*(r+.012));surround.rotation.y=Math.PI/2-a;
  for(let y of [1.1,1.43]){const r1=radius+.01,a1=rotation+side*Math.PI/4,a2=a1+Math.PI/4;rod(p,[Math.cos(a1)*r1,y,Math.sin(a1)*r1],[Math.cos(a2)*r1,y,Math.sin(a2)*r1],.022,'#4b6057');}
 }
 polygonRing(2.055,1.045,.043,'#d4c8af');polygonRing(2.065,1.505,.052,'#e1d5bc');
 // Every tile is a small raised curved patch; staggered joins make the red-clay courses readable.
 for(let side=0;side<8;side++){
  const shell=[],idx=[],nu=14,nt=32;
  for(let j=0;j<=nt;j++)for(let i=0;i<=nu;i++){const v=point(side,i/nu,j/nt);shell.push(v.x,v.y,v.z);}
  for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;idx.push(a,a+nu+1,a+1,a+1,a+nu+1,a+nu+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(shell,3));g.setIndex(idx);g.computeVertexNormals();tiles[0].side=T.DoubleSide;mesh(g,tiles[0],p);
  for(let row=0;row<32;row++){
   const count=Math.max(3,Math.round(18*(1-.8*row/32))),shift=row%2*.5;
   for(let col=-1;col<count;col++){
    const lo=Math.max(.016,(col+shift)/count+.012),hi=Math.min(.984,(col+1+shift)/count-.012);
    if(hi<=lo)continue;
    const v=[],indices=[];
    for(let j=0;j<=2;j++)for(let i=0;i<=2;i++){
     const u=lo+(hi-lo)*i/2,t=(row+.08+j*.42)/32;
     const q=point(side,u,t,.017+.014*Math.sin(i/2*Math.PI));v.push(q.x,q.y,q.z);
    }
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const a=j*3+i;indices.push(a,a+3,a+1,a+1,a+3,a+4);}
    const tile=new T.BufferGeometry();tile.setAttribute('position',new T.Float32BufferAttribute(v,3));tile.setIndex(indices);tile.computeVertexNormals();const mat=tiles[(side*13+row*7+col+50)%tiles.length];mat.side=T.DoubleSide;mesh(tile,mat,p);
   }
  }
  const points=[];for(let j=0;j<=40;j++)points.push(point(side,0,j/40,.025));tube(points,.045,rib,40);
  for(let u of [.016,.984]){const edge=[];for(let j=0;j<=40;j++)edge.push(point(side,u,j/40,.022));tube(edge,.012,green,40);}
 }
 // The marble lantern is an open gallery with eight posts, arched heads and flying scrolls.
 polygonRing(.32,3.43,.043,'#e1d5bc');
 for(let i=0;i<8;i++){
  const a=rotation+i*Math.PI/4,x=Math.cos(a)*.25,z=Math.sin(a)*.25;
  mesh(new T.CylinderGeometry(.027,.035,.4,12),rib,p,x,3.65,z);
  const points=[];for(let j=0;j<=20;j++){let t=j/20,r=.49-.24*t;points.push(new T.Vector3(Math.cos(a)*r,3.2+.58*Math.sin(t*Math.PI/2),Math.sin(a)*r));}tube(points,.025,rib,20);
 }
 const core=mesh(new T.CylinderGeometry(.155,.155,.36,8),dark,p,0,3.65,0);core.rotation.y=-rotation;
 polygonRing(.31,3.88,.038,'#e1d5bc');
 mesh(new T.ConeGeometry(.32,.37,8),rib,p,0,4.075,0);
 mesh(new T.SphereGeometry(.068,16,12),material('#b49652',.6),p,0,4.31,0);
 rod(p,[0,4.35,0],[0,4.53,0],.011,'#b49652');rod(p,[-.06,4.46,0],[.06,4.46,0],.009,'#b49652');
}

function build(id){let p=new T.Group();if(id===0)palace(p);if(id===1)shrine(p);
if(id===2)kazakhYurt(p);
if(id===3)frenchOpera(p);
if(id===4){greekTemple(p);greekCarvingDetails(p);}
if(id===5){florenceDome(p);italianCarvingDetails(p);}
return p;}
function batchArchitecture(root){root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh)return;const key=o.material;const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(o.matrixWorld);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(g);});const merged=new T.Group();for(const [mat,geometries] of batches){const g=new T.BufferGeometry();for(const name of ['position','normal']){let length=0;for(const geo of geometries)length+=geo.attributes[name].array.length;const data=new Float32Array(length);let offset=0;for(const geo of geometries){data.set(geo.attributes[name].array,offset);offset+=geo.attributes[name].array.length;}g.setAttribute(name,new T.BufferAttribute(data,name==='uv'?2:3));}mesh(g,mat,merged);geometries.forEach(g=>g.dispose());}root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});return merged;}
const roots=scenes.map((s,i)=>{let g=batchArchitecture(build(i));world.add(g);g.rotation.y=i===4?-.12:-.075;g.rotation.x=.025;g.visible=i===0;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;});
const frenchFlag=createFrenchFlag(T);roots[3].add(frenchFlag.group);
// Rasterize each glyph once; WebGL batches all moving letters in one draw call.
const glyphs=[...new Set(scenes.flatMap(s=>[...s.text]))],atlas=document.createElement('canvas');
atlas.width=atlas.height=1024;
const ac=atlas.getContext('2d'),cells=16,cell=64;
ac.fillStyle='#fff';ac.textAlign='center';ac.textBaseline='middle';ac.font='46px Georgia,"SimSun",serif';
glyphs.forEach((g,i)=>ac.fillText(g,(i%cells+.5)*cell,(Math.floor(i/cells)+.5)*cell));
const atlasTexture=new T.CanvasTexture(atlas);atlasTexture.generateMipmaps=false;atlasTexture.minFilter=T.LinearFilter;
const capacity=5000,positions=new Float32Array(capacity*3),tiles=new Float32Array(capacity),alphas=new Float32Array(capacity),angles=new Float32Array(capacity),roofGlyphs=new Float32Array(capacity);
const lettersGeometry=new T.BufferGeometry();
lettersGeometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
lettersGeometry.setAttribute('tile',new T.BufferAttribute(tiles,1));lettersGeometry.setAttribute('opacity',new T.BufferAttribute(alphas,1));
lettersGeometry.setAttribute('angle',new T.BufferAttribute(angles,1).setUsage(T.DynamicDrawUsage));
lettersGeometry.setAttribute('roofGlyph',new T.BufferAttribute(roofGlyphs,1).setUsage(T.DynamicDrawUsage));
// All six roofs share the same atlas, glyph weight and size as Kazakhstan.
const roofInkColors = ["#FFD23F", "#FFFFFF", "#D9F7CE", "#151515", "#151515", "#151515"];
const roofInk = {value:new T.Vector3()};
const lettersMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{atlas:{value:atlasTexture},roofInk,ink:{value:new T.Color(scenes[0].color)},size:{value:14},windDissolve:dissolve},
vertexShader:`attribute float tile; attribute float opacity; attribute float angle; attribute float roofGlyph; varying float vRoof; varying float vTile; varying float vOpacity; varying float vAngle; uniform float size;
void main(){vRoof=roofGlyph;vTile=tile;vOpacity=opacity;vAngle=angle;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*mix(1.,1.36,vRoof);}`,
fragmentShader:`uniform float windDissolve;uniform sampler2D atlas;uniform vec3 ink;uniform vec3 roofInk;varying float vRoof;varying float vTile;varying float vOpacity;varying float vAngle;
void main(){vec2 p=gl_PointCoord-.5;float c=cos(vAngle),s=sin(vAngle);p=mat2(c,-s,s,c)*p+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)discard;vec2 uv=(vec2(mod(vTile,16.),15.-floor(vTile/16.))+vec2(p.x,1.-p.y))/16.;float glyph=texture2D(atlas,uv).a;
vec2 d=vec2(1.6/1024.,0.);
float edge=max(max(texture2D(atlas,uv+d).a,texture2D(atlas,uv-d).a),
 max(texture2D(atlas,uv+d.yx).a,texture2D(atlas,uv-d.yx).a));
glyph=mix(glyph,smoothstep(.26,.72,glyph),vRoof);
float halo=max(0.,edge-glyph)*.6*(1.-vRoof);
float a=(glyph+halo)*vOpacity*(1.-windDissolve);
if(a<.02)discard;
gl_FragColor=vec4(mix(vec3(.98,.93,.82),mix(ink,roofInk,vRoof),glyph/max(glyph+halo,.001)),a);}`});
const letters=new T.Points(lettersGeometry,lettersMaterial);letters.rotation.y=-.075;letters.rotation.x=.025;letters.frustumCulled=false;world.add(letters);
let lettersBuilt = false, letterProgress = 0, roofTargets = null;
let chains=[];function initChains(id){roofTargets=null;chains=[];let mobile=innerWidth<700,count=mobile?88:144;for(let i=0;i<count;i++){let f=i/(count-1),angle=f*Math.PI*2,back=i%3===0;let x=(f-.5)*4.9,y=1.09,len=2.7+.3*Math.sin(i*2.13),z=(i%3-1)*.65;
if(id===2){x=Math.cos(angle)*2.48;z=Math.sin(angle)*2.48;len=2.7+.3*Math.cos(angle*2);}
if(id===5){const a=Math.PI/8+Math.floor(f*8)*Math.PI/4,b=a+Math.PI/4,u=(f*8)%1;x=((1-u)*Math.cos(a)+u*Math.cos(b))*2.02;z=((1-u)*Math.sin(a)+u*Math.sin(b))*2.02;y=1.03;len=2.5+.25*Math.cos(angle*2);}
if(id===3){x=(f-.5)*5.6;y=1.05;z=(i%3-1)*.24;len=2.65+.16*Math.cos(f*Math.PI*10)+.08*Math.sin(i*1.6);}
if(id===4){const u=f*8,col=Math.min(7,Math.floor(u));x=(col-3.5)*.73+(Math.min(.999,u-col)-.5)*.29;y=1.085;z=.79+(i%3-1)*.045;len=2.7+.04*Math.sin(i);}
let n=mobile?22:28;chains.push({x,y,z,len,n,phase:i*1.718,depth:back?.35:.75,nodes:Array.from({length:n},(_,j)=>({x:0,y:j*len/(n-1),px:0,py:j*len/(n-1)}))});}
chains.sort((a,b)=>a.z-b.z);let index=0;const text=scenes[id].text;for(const c of chains)for(let j=1;j<c.n;j++){tiles[index]=glyphs.indexOf(text[(j+Math.floor(c.phase))%text.length]);alphas[index]=.32+c.depth*.49;index++;}lettersGeometry.setDrawRange(0,index);lettersGeometry.attributes.tile.needsUpdate=true;lettersGeometry.attributes.opacity.needsUpdate=true;lettersMaterial.uniforms.ink.value.set(scenes[id].color);
const roofColor = new T.Color(roofInkColors[id]).convertLinearToSRGB();
roofInk.value.set(roofColor.r,roofColor.g,roofColor.b);}
const roofEdges=roots.map(root=>{const bins=Array(80).fill(null);root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),bin=Math.max(0,Math.min(79,Math.floor((x+5)/10*80)));if(!bins[bin]||y>bins[bin].y)bins[bin]=new T.Vector3(x,y,z);}});return bins;});
const roofWind=createRoofWind(stage,{reduced,scene:()=>current,sway:()=>{roofSway=.036;},ring:count=>{if(!sound)return;sound.setScene(current);for(let i=0;i<count;i++){const engine=sound,sceneId=current;setTimeout(()=>{if(sound===engine&&current===sceneId)engine.strike(2+i,.25+i*.09,0);},i*95);}},hit:e=>{if(transition||storyCard.open||$('#overlay').open||!roofHit(e))return null;const point=roofRay.intersectObject(roots[current],true)[0]?.point;if(!point)return null;const local=roots[current].worldToLocal(point.clone()),bin=Math.max(0,Math.min(79,Math.floor((local.x+5)/10*80))),edge=roofEdges[current][bin];if(!edge)return null;const projected=roots[current].localToWorld(edge.clone()).project(camera),r=stage.getBoundingClientRect();return {x:(projected.x+1)*r.width/2,y:(1-projected.y)*r.height/2};}});
initChains(0);const pointer=createBreeze();
function physics(dt,impulse){advanceBreeze(pointer,1/60);if(!reduced)stepCurtain(chains,pointer,scenes[current],time,offset,impulse);if(sound&&!transition&&!journey.open&&!storyCard.open&&!$('#overlay').open)sound.brush(chains,pointer,current,offset);}
const letterButton = document.createElement('button');
letterButton.id = 'letter-architecture-toggle';
letterButton.type = 'button';
const sceneActions = document.createElement('div');
sceneActions.className = 'scene-actions';
$('#editorial').append(sceneActions);
sceneActions.append(storyButton, letterButton);
letterButton.onpointerdown = event => event.stopPropagation();
letterButton.onpointerup = event => event.stopPropagation();
letterButton.onclick = toggleLetterArchitecture;


const surfaceCache = new Map();
function updateLetterButton() {
 letterButton.textContent = lettersBuilt
  ? (lang ? '恢复实体建筑 ↘' : 'RESTORE ARCHITECTURE ↘')
  : (lang ? '以字筑屋 ↗' : 'BUILD WITH LETTERS ↗');
 letterButton.setAttribute('aria-pressed', String(lettersBuilt));
}
function toggleLetterArchitecture() {
 if (transition || storyCard.open || journey.open || $('#overlay').open) return;
 lettersBuilt = !lettersBuilt;
 if (lettersBuilt && !roofTargets) {
  const slots = [];
  let index = 0;
  for (const chain of chains) {
   for (let j = 1; j < chain.n; j++, index++) {
    // Alternate glyphs so every chain remains available for wind and sound.
    if ((j + Math.floor(chain.phase)) % 2 === 0) slots.push({index, x:chain.x});
   }
  }
  slots.sort((a,b)=>a.x-b.x);
  const key = current+':'+slots.length;
  if (!surfaceCache.has(key)) surfaceCache.set(key,sampleArchitecture(roots[current],slots.length,innerWidth<700));
  const samples = surfaceCache.get(key);
  roofTargets = new Map(samples.map((sample,i)=>[slots[Math.floor(i*slots.length/samples.length)].index,sample]));
 }
 updateLetterButton();
}

const curtainProjection = new T.Vector3();
function curtainHit(event) {
 if (transition || detailMode) return false;
 const rect = canvas.getBoundingClientRect();
 const x = (event.clientX-rect.left)/rect.width*2-1;
 const y = 1-(event.clientY-rect.top)/rect.height*2;
 for (const chain of chains) {
  curtainProjection.set(chain.x+offset,chain.y,chain.z).project(camera);
  if (Math.abs(x-curtainProjection.x) > .055 || y > curtainProjection.y) continue;
  curtainProjection.set(chain.x+offset,chain.y-chain.len,chain.z).project(camera);
  if (y >= curtainProjection.y-.035) return true;
 }
 return false;
}

function paint(morph = 0) {
 let i = 0;
 for (const c of chains) for (let j=1; j<c.n; j++, i++) {
  const n = c.nodes[j], target = morph && roofTargets?.get(i);
  let x = c.x+n.x, y = c.y-n.y, z = c.z;
  let angle = Math.atan2(n.x-c.nodes[j-1].x,n.y-c.nodes[j-1].y)*.6;
  let alpha = .32+c.depth*.49;
  roofGlyphs[i] = 0;
  if (target) {
   const t = Math.max(0, Math.min(1, (morph-(i%13)*.012)/.856));
   const eased = t*t*(3-2*t);
   x += (target.x-x)*eased;
   y += (target.y-y)*eased + Math.sin(Math.PI*eased)*.42;
   z += (target.z-z)*eased;
   angle *= 1-eased;
   alpha += (1-alpha)*eased;
   roofGlyphs[i] = eased;
  }
  positions[i*3] = x;
  positions[i*3+1] = y;
  positions[i*3+2] = z;
  angles[i] = angle;
  alphas[i] = alpha;
 }
 letters.rotation.y = current===4 ? -.12 : -.075;
 letters.position.x = offset;
 lettersGeometry.attributes.position.needsUpdate = true;
 lettersGeometry.attributes.angle.needsUpdate = true;
 lettersGeometry.attributes.roofGlyph.needsUpdate = true;
 lettersGeometry.attributes.opacity.needsUpdate = true;
}
const soundDescriptions = [
 ['铜铃', 'Bronze bells'],
 ['玻璃风铃', 'Glass wind chimes'],
 ['琴弦拨动声', 'Plucked strings'],
 ['八音盒', 'Music box'],
 ['青铜敲击声', 'Struck bronze'],
 ['水晶碰击声', 'Clinking crystal']
];
const soundPreview = $('#sound-preview');
function updateSoundCaption() {
 $('#exhibitName').textContent = lang ? '音乐灵感：' : 'Music Inspiration:';
 $('#material').textContent = [lang ? scenes[current].zh : scenes[current].country.toLowerCase().replace(/^./, letter => letter.toUpperCase()), soundDescriptions[current][lang ? 0 : 1]].join(' · ');
}
function updateText(){updateLetterButton();ambience.update(current);journey.visit(current);finishJourney.textContent=lang?"我的建筑手记 ↗":"MY JOURNEY ↗";miniGlobe.update(current,lang);storyCard.preload(current);storyCard.localize();storyButton.textContent=lang?'建筑手记 ↗':'ARCHITECTURAL NOTES ↗';const s=scenes[current];$('#number').textContent=`0${current+1} / 06`;$('#country').textContent=lang?s.zh:s.country;$('#title').innerHTML=(lang?s.zt:s.title).map((v,i)=>`<span style="--i:${i}">${v}</span>`).join('');$('#description').textContent=lang?s.zd:s.desc;$('#tag').textContent=s.tag;updateSoundCaption();$('#folio').textContent=`0${current+1}`;$('#hint').textContent=lang?'轻拂文字 · 拖动切换':'BRUSH THE LETTERS · DRAG TO EXPLORE';$('#about').textContent=lang?'关于':'ABOUT';$('#return-start').textContent=lang?'← 返回开始':'← RETURN';$('#index').textContent=lang?'索引 06':'INDEX 06';$('#prev span').textContent=lang?'上一件':'PREVIOUS';$('#next span').textContent=lang?'下一件':'NEXT';$('#sound').textContent=lang?(sound?'风铃 开':'风铃 关'):(sound?'SOUND ON':'SOUND OFF');$('#sound').setAttribute('aria-pressed',String(!!sound));$('#sound').title=lang?'开启后轻拂文字，聆听风铃':'Enable sound, then brush the letters to play wind chimes';if(sound)sound.setScene(current);document.documentElement.lang=lang?'zh-CN':'en';detailButton.textContent=lang?(detailMode?'－ 返回全景':'＋ 查看细节'):(detailMode?'－ FULL VIEW':'＋ VIEW DETAILS');$('#progress').innerHTML=scenes.map((s,i)=>`<button class="${i===current?'active':''}" aria-label="${lang?s.zh:s.country}" aria-current="${i===current?'step':'false'}" data-id="${i}"></button>`).join('');$('#progress').querySelectorAll('button').forEach(b=>b.onclick=()=>go(+b.dataset.id));}
const transitionDuration = reduced ? 180 : 1050;
const navigationTarget = () => pending ?? transition?.target ?? current;
function go(target){if(storyCard.open)return;detailMode=false;detailButton.setAttribute('aria-pressed','false');detailButton.textContent=lang?'＋ 查看细节':'＋ VIEW DETAILS';target=(target+6)%6;if(transition){if(!transition.swapped && target!==current){transition.target=target;pending=null;}else{pending=target;}return;}if(target===current)return;roofWind.transition(current,target>current?-1:1,false);transition={start:performance.now(),target,from:offset,dir:target>current?1:-1,swapped:false};}
$('#next').onclick=()=>{if(current===5&&!transition)journey.show();else go(navigationTarget()+1);};$('#prev').onclick=()=>go(navigationTarget()-1);$('#language').onclick=()=>{lang=!lang;updateText();};
stage.onpointerdown=e=>{if(transition)return;stage.onpointermove(e);pointer.gust=1;pointer.gustX=Math.abs(pointer.vx)>.2?Math.sign(pointer.vx):1;drag={x:e.clientX,y:e.clientY,last:e.clientX,v:0,roof:roofHit(e),curtain:curtainHit(e),travel:0};stage.setPointerCapture(e.pointerId);};stage.onpointermove=e=>{const r=stage.getBoundingClientRect(),x=(camera.left+(e.clientX-r.left)/r.width*(camera.right-camera.left))/camera.zoom,y=(camera.top-(e.clientY-r.top)/r.height*(camera.top-camera.bottom))/camera.zoom+camera.position.y;moveBreeze(pointer,x,y);if(drag){drag.travel=Math.max(drag.travel,Math.hypot(e.clientX-drag.x,e.clientY-drag.y));drag.v=e.clientX-drag.last;drag.last=e.clientX;offset=(e.clientX-drag.x)/r.width*6;}let cur=$('#cursor');cur.textContent=roofHit(e)?(lang?'查看 ↗':'OPEN ↗'):curtainHit(e)?(lettersBuilt?(lang?'复原 ↘':'RESTORE ↘'):(lang?'筑屋 ↗':'BUILD ↗')):'DRAG ↔';cur.style.display=e.pointerType==='touch'?'none':'flex';cur.style.left=`${e.clientX-r.left-32}px`;cur.style.top=`${e.clientY-r.top-32}px`;};function release(e){if(!drag)return;let delta=e.clientX-drag.x;if(drag.roof&&drag.travel<7&&!transition){drag=null;offset=0;leaveBreeze(pointer);$('#cursor').style.display='none';storyCard.show(current,{x:e.clientX,y:e.clientY});return;}if(drag.curtain&&drag.travel<7&&!transition){drag=null;toggleLetterArchitecture();return;}if(Math.abs(delta)>75||Math.abs(drag.v)>12)go(current+(delta<0?1:-1));drag=null;}stage.onpointerup=release;stage.onpointercancel=()=>{drag=null;};stage.onpointerleave=()=>{leaveBreeze(pointer);$('#cursor').style.display='none';};let wheelTime=0;stage.addEventListener('wheel',e=>{e.preventDefault();const now=performance.now(),quiet=now-wheelTime>220;wheelTime=now;if(quiet&&Math.abs(e.deltaY+e.deltaX)>10){if(current===5&&!transition&&e.deltaY+e.deltaX>0){journey.show();return;}go(navigationTarget()+(e.deltaY+e.deltaX>0?1:-1));}},{passive:false});document.addEventListener('keydown',e=>{if(document.body.classList.contains('intro-open')||storyCard.open||journey.open)return;if($('#overlay').open){if(e.key==='Escape')$('#overlay').close();return;}if(e.key==='ArrowRight')go(navigationTarget()+1);if(e.key==='ArrowLeft')go(navigationTarget()-1);});
$('#close').onclick=()=>$('#overlay').close();$('#about').onclick=()=>{$('#overlayContent').innerHTML=lang?'<h2>soundofarchitectures</h2><p>一座由建筑、文字与运动共同组成的数字博物馆。</p><p>实体的屋檐承载文化的记忆；垂落的字符将记忆转化为有生命的帘幕。六件程序化建筑装置，六种不同的空间韵律。</p><p>移动指针拂动文字，横向拖拽、滚动或使用方向键切换展品。通过索引自由游览。声音默认关闭。</p>':'<h2>Built from memory.<br><em>Woven from language.</em></h2><p>soundofarchitectures — a living typography museum, where architecture becomes poetry and language becomes a material.</p><p>Six sculptural fragments explore imperial roofs, quiet shrines, the nomadic shanyrak, Gothic arches, classical proportions and Renaissance domes. Each procedural study is suspended above a field of independently simulated typographic threads.</p><p>Move to stir the threads. Drag, scroll, or use arrow keys to travel between civilizations. Open the index to wander freely. Sound is optional.</p>';$('#overlay').showModal();};let previews=[];$('#index').onclick=()=>{if(transition)return;renderIndexPreviews();$('#overlayContent').innerHTML=`<h2>${lang?'六种文明，六首诗。':'Six civilizations.<br><em>Six ways of being.</em>'}</h2><div class="index-grid">${scenes.map((s,i)=>`<button class="index-item" data-id="${i}"><small>0${i+1} / ${lang?s.zh:s.country}</small>${previews[i]?`<img alt="${s.name}" src="${previews[i]}">`:''}<strong>${lang?s.zn:s.name}</strong><small>${s.mat}</small></button>`).join('')}</div>`;$('#overlayContent').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('#overlay').close();go(+b.dataset.id);});$('#overlay').showModal();};
$('#sound').onclick=async()=>{if(sound){const old=sound;sound=null;old.close();}else{let next;try{next=new WindChimes();sound=next;next.setScene(current);await next.enable();}catch{if(sound===next)sound=null;next?.close();}}updateText();};
// Suspend audio at the start page and when the tab is hidden; resume only an enabled context.
window.addEventListener('museum:return',()=>{sound?.context.suspend();});
window.addEventListener('museum:entered',()=>{if(sound&&!document.hidden)sound.context.resume().catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(!sound)return;if(document.hidden)sound.context.suspend();else if(!document.body.classList.contains('intro-open'))sound.context.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{sound?.close();miniGlobe.dispose();});
window.museumAudio={get enabled(){return !!sound},get engine(){return sound}};

let baseLetterSize=14;
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);const aspect=r.width/r.height,h=Math.max(7.4,6.7/aspect);camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();baseLetterSize=Math.max(10,r.height/h*.125)*renderer.getPixelRatio();lettersMaterial.uniforms.size.value=baseLetterSize*camera.zoom;}
new ResizeObserver(resize).observe(stage);updateText();resize();let last=performance.now(),acc=0;function frame(now){requestAnimationFrame(frame);if(document.hidden||document.body.classList.contains('intro-open')){last=now;return;}let delta=Math.min((now-last)/1000,.0334);last=now;time+=delta;
const detailEase=reduced?1:1-Math.exp(-6*delta),targetZoom=detailMode?1.65:1,targetY=detailMode?2.72:1.15;
if(Math.abs(camera.zoom-targetZoom)>.0001||Math.abs(camera.position.y-targetY)>.0001){camera.zoom+=(targetZoom-camera.zoom)*detailEase;camera.position.y+=(targetY-camera.position.y)*detailEase;camera.updateProjectionMatrix();camera.updateMatrixWorld();}
if(transition){let t=(now-transition.start)/transitionDuration;if(t<.5)offset=transition.from+(-transition.dir*9-transition.from)*Math.pow(t*2,2);else{if(!transition.swapped){roots[current].visible=false;current=transition.target;lettersBuilt=false;letterProgress=0;roots[current].visible=true;initChains(current);updateText();roofWind.transition(current,transition.dir,true);transition.swapped=true;}offset=transition.dir*9*Math.pow(Math.max(0,2-t*2),3);}if(t>=1){offset=0;transition=null;if(pending!==null){let p=pending;pending=null;go(p);}}}else if(!drag)offset*=Math.exp(-10*delta);dissolve.value=reduced?0:transition?Math.sin(Math.min(1,(now-transition.start)/transitionDuration)*Math.PI)**1.3:0;windDirection.value=transition?-transition.dir:1;roofSway*=Math.exp(-2.8*delta);roots[current].rotation.z=Math.sin(time*6.5)*roofSway;roots[current].position.x=offset;let impulse=offset-prevOffset;prevOffset=offset;acc+=delta;const steps=Math.floor(acc*60);for(let tick=0;tick<steps;tick++){physics(1,impulse/steps);acc-=1/60;}if(current===3)frenchFlag.update(reduced?0:time);
const morphStep = reduced ? 1 : delta / .95;
letterProgress = lettersBuilt ? Math.min(1,letterProgress+morphStep) : Math.max(0,letterProgress-morphStep);
letterRoofFade.value = letterProgress*letterProgress*(3-2*letterProgress);
frenchFlag.group.visible = letterProgress < .85 || current!==3;
paint(letterProgress);if(transition||drag||roofSway>.001||Math.abs(offset)>.001||!frame.shadowReady){renderer.shadowMap.needsUpdate=true;frame.shadowReady=true;}lettersMaterial.uniforms.size.value=baseLetterSize*camera.zoom;renderer.render(world,camera);miniGlobe.render(delta,time);ambience.render(time);capturePreview();}requestAnimationFrame(frame);
// Cache previews only after a scene has actually rendered; never render all six at once.
let capturePending=false;
function capturePreview(){if(letterProgress||capturePending||previews[current]||transition||drag||detailMode||camera.zoom>1.001)return;capturePending=true;const id=current;const thumbnail=document.createElement('canvas');thumbnail.width=240;thumbnail.height=180;const c=thumbnail.getContext('2d');c.drawImage(canvas,0,0,240,180);thumbnail.toBlob(blob=>{if(blob)previews[id]=URL.createObjectURL(blob);capturePending=false;},'image/webp',.75);}

function renderIndexPreviews(){
 if(previews.every(Boolean)&&previews.length===6&&renderIndexPreviews.ready)return;
 const saved=current,size=renderer.getSize(new T.Vector2()),oldDissolve=dissolve.value,oldRoofFade=letterRoofFade.value,oldTargets=roofTargets,oldFlag=frenchFlag.group.visible;
 const transforms=roots.map(root=>({x:root.position.x,z:root.rotation.z}));
 try{
  renderer.setSize(480,360,false);dissolve.value=0;letterRoofFade.value=0;frenchFlag.group.visible=true;
  for(let id=0;id<6;id++){
   roots.forEach((root,i)=>{root.visible=i===id;root.position.x=0;root.rotation.z=0;});
   current=id;initChains(id);
   for(let step=0;step<24;step++)stepCurtain(chains,{x:100,y:100,oldX:100,oldY:100,vx:0,vy:0,strength:0,gust:0},scenes[id],0);
   paint();letters.position.x=0;
   const bounds=new T.Box3().setFromObject(roots[id]);let bottom=bounds.min.y;
   for(const chain of chains)bottom=Math.min(bottom,chain.y-chain.len);
   const centerY=(bounds.max.y+bottom)/2,viewHeight=Math.max((bounds.max.y-bottom)*1.15,(bounds.max.x-bounds.min.x)*.86);
   const shot=new T.OrthographicCamera(-viewHeight*2/3,viewHeight*2/3,viewHeight/2,-viewHeight/2,.1,50);
   shot.position.set(0,centerY,16);shot.lookAt(0,centerY,0);
   lettersMaterial.uniforms.size.value=9*renderer.getPixelRatio();
   renderer.shadowMap.needsUpdate=true;renderer.render(world,shot);
   const image=document.createElement('canvas');image.width=480;image.height=360;image.getContext('2d').drawImage(canvas,0,0,480,360);
   if(previews[id]?.startsWith('blob:'))URL.revokeObjectURL(previews[id]);
   previews[id]=image.toDataURL('image/webp',.88);
  }
  renderIndexPreviews.ready=true;
 }finally{
  current=saved;roots.forEach((root,i)=>{root.visible=i===saved;root.position.x=transforms[i].x;root.rotation.z=transforms[i].z;});
  initChains(saved);roofTargets=oldTargets;paint(letterProgress);dissolve.value=oldDissolve;letterRoofFade.value=oldRoofFade;frenchFlag.group.visible=oldFlag;renderer.setSize(size.x,size.y,false);lettersMaterial.uniforms.size.value=baseLetterSize*camera.zoom;renderer.shadowMap.needsUpdate=true;renderer.render(world,camera);
 }
}
document.addEventListener('visibilitychange',()=>{last=performance.now();acc=0;leaveBreeze(pointer);});
window.museum={scenes:scenes.map(s=>s.country),get current(){return current},get chains(){return chains},go,renderer};

// Warm the initial materials and shadows before enabling START.
paint();renderer.shadowMap.needsUpdate=true;renderer.render(world,camera);frame.shadowReady=true;
window.dispatchEvent(new Event("museum:ready"));


mountRoofStudies(scenes,(id,ctx)=>{
 const root=roots[id],old=roots.map(r=>r.visible),oldLetters=letters.visible;
 const size=renderer.getSize(new T.Vector2()),bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),dims=bounds.getSize(new T.Vector3()),width=Math.max(dims.x*1.12,dims.y*2.24);
 const shot=new T.OrthographicCamera(-width/2,width/2,width/4,-width/4,.1,50);
 shot.position.set(center.x,center.y,16);shot.lookAt(center.x,center.y,0);
 try{
  roots.forEach((r,i)=>r.visible=i===id);letters.visible=false;
  renderer.setSize(480,240,false);renderer.shadowMap.needsUpdate=true;renderer.render(world,shot);
  ctx.drawImage(canvas,0,0,480,240);
 }finally{
  roots.forEach((r,i)=>r.visible=old[i]);letters.visible=oldLetters;renderer.setSize(size.x,size.y,false);renderer.shadowMap.needsUpdate=true;renderer.render(world,camera);
 }
});
