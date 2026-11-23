const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBreeze(){return {active:false,ready:false,targetX:0,targetY:0,x:0,y:0,oldX:0,oldY:0,vx:0,vy:0,strength:0,gust:0};}
export function moveBreeze(p,x,y){if(!p.active){p.x=p.oldX=x;p.y=p.oldY=y;p.vx=p.vy=0;}p.targetX=x;p.targetY=y;p.active=p.ready=true;}
export function leaveBreeze(p){p.active=false;}
export function advanceBreeze(p,dt){
 p.gust*=Math.exp(-dt/ .24);p.oldX=p.x;p.oldY=p.y;
 const ease=1-Math.exp(-dt/ .028);
 if(p.active){p.x+=(p.targetX-p.x)*ease;p.y+=(p.targetY-p.y)*ease;}
 const velocityEase=1-Math.exp(-dt/.045);
 p.vx+=(clamp((p.x-p.oldX)/dt,-12,12)-p.vx)*velocityEase;
 p.vy+=(clamp((p.y-p.oldY)/dt,-12,12)-p.vy)*velocityEase;
 p.strength+=((p.active?1:0)-p.strength)*(1-Math.exp(-dt/.16));
}
export function stepCurtain(chains,p,preset,time,offset=0,impulse=0){
 const speed=Math.hypot(p.vx,p.vy),radius=.78+Math.min(.7,speed*.065);
 const sx=p.x-p.oldX,sy=p.y-p.oldY,den=sx*sx+sy*sy;
 const response=clamp(1.13-preset.stiff*7,.72,1.05);
 for(const c of chains){
  const seg=c.len/(c.n-1),variation=.93+.07*Math.sin(c.phase),damping=.983+(preset.damp-.97)*.18;
  for(let j=1;j<c.n;j++){
   const n=c.nodes[j],u=j/(c.n-1),vx=clamp((n.x-n.px)*damping,-.09,.09),vy=clamp((n.y-n.py)*damping,-.09,.09);
   n.px=n.x;n.py=n.y;
   // Distance to the swept cursor segment prevents gaps when the pointer moves quickly.
   const wx=c.x+n.x+offset,wy=c.y-n.y;
   const t=den>1e-10?clamp(((wx-p.oldX)*sx+(wy-p.oldY)*sy)/den,0,1):1;
   const dx=wx-(p.oldX+sx*t),dy=wy-(p.oldY+sy*t),r=Math.hypot(dx,dy)/radius;
   const falloff=r<1?(1-r*r)**2*p.strength:0;
   const freedom=.22+.78*Math.sin(u*Math.PI/2);
   const push=falloff*freedom*response*variation;
   const gust=p.gust*Math.exp(-(dx*dx+dy*dy)/.75)*freedom;
   const wind=.00018*Math.sin(time*.75+c.phase+j*.12);
   // Weak distributed restoring force preserves broad, silk-like bends.
   n.x+=gust*(p.gustX||1)*.025+vx-n.x*(.0011+preset.stiff*.028)+wind+push*(clamp(p.vx,-8,8)*.00165+dx*.0007)-clamp(impulse,-.25,.25)*u*.12;
   n.y+=vy+.0019+push*clamp(-p.vy,-6,6)*.0018;
  }
  c.motionEnergy=0;c.motionDisplacement=0;for(let j=1;j<c.n;j+=3){const n=c.nodes[j];c.motionEnergy+=Math.abs(n.x-n.px);c.motionDisplacement+=Math.abs(n.x);}c.motionEnergy/=Math.ceil(c.n/3);c.motionDisplacement/=Math.ceil(c.n/3);
  // Inextensible segments transmit a local brush into a travelling bend.
  for(let pass=0;pass<5;pass++){
   for(let k=1;k<c.n;k++){
    const j=pass%2?c.n-k:k,a=c.nodes[j-1],b=c.nodes[j];
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
    const error=(length-seg)/length;
    if(j===1){b.x-=dx*error;b.y-=dy*error;}
    else{a.x+=dx*error*.5;a.y+=dy*error*.5;b.x-=dx*error*.5;b.y-=dy*error*.5;}
   }
   c.nodes[0].x=c.nodes[0].y=0;
  }
 }
}
