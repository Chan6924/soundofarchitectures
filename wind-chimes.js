// Original scene-inspired sound palettes, synthesized locally without audio downloads.
export const chimePalettes=[
 {name:'Bronze pentatonic',notes:[62,64,66,69,71,74,76],ratios:[1,2.01,3.97,5.42],weights:[1,.38,.15,.055],decay:2.5},
 {name:'Quiet glass',notes:[64,65,69,71,72,76,77],ratios:[1,2.76,5.4],weights:[1,.2,.045],decay:1.9},
 {name:'Steppe strings',notes:[57,60,62,64,67,69,72],ratios:[1,2,3,4,5],weights:[1,.35,.17,.07,.025],decay:1.35},
 {name:'Celeste reverie',notes:[60,62,64,66,68,70,72,76],ratios:[1,2.002,3.98,6.01],weights:[1,.27,.105,.025],decay:2.7},
 {name:'Aegean bronze',notes:[62,64,65,67,69,71,72,74],ratios:[1,2.42,4.12],weights:[1,.27,.075],decay:2.25},
 {name:'Crystal aria',notes:[60,64,67,71,72,76,79],ratios:[1,2,3,5.01],weights:[1,.25,.11,.035],decay:2.6}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class WindChimes{
 constructor(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  this.context=new Audio();this.voices=new Set();this.lastStrike=-1;this.cooldowns=new Map();this.scene=-1;this.strikes=0;this.disposed=false;
  const ctx=this.context;
  this.master=ctx.createGain();this.master.gain.value=.32;
  this.limiter=ctx.createDynamicsCompressor();this.limiter.threshold.value=-20;this.limiter.knee.value=18;this.limiter.ratio.value=5;this.limiter.attack.value=.005;this.limiter.release.value=.3;
  this.master.connect(this.limiter);this.limiter.connect(ctx.destination);
  this.room=ctx.createConvolver();const length=Math.floor(ctx.sampleRate*1.7),impulse=ctx.createBuffer(2,length,ctx.sampleRate);
  let seed=7919;for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=((seed>>>0)/2147483648-1)*Math.exp(-i/ctx.sampleRate*5.3)*.3;}}
  this.room.buffer=impulse;this.wet=ctx.createGain();this.wet.gain.value=.16;this.room.connect(this.wet);this.wet.connect(this.master);
  this.analyser=ctx.createAnalyser();this.analyser.fftSize=1024;this.master.connect(this.analyser);
 }
 async enable(){await this.context.resume();}
 setScene(scene){
  if(this.scene===scene)return;this.scene=scene;this.cooldowns.clear();
  const now=this.context.currentTime;
  for(const voice of this.voices){voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(.00001,now,.07);for(const o of voice.oscillators){try{o.stop(now+.35);}catch{}}}
 }
 strike(index,strength,pan){
  if(this.disposed||this.context.state!=='running')return false;
  if(this.voices.size>=14){const oldest=this.voices.values().next().value;const t=this.context.currentTime;oldest.gain.gain.cancelScheduledValues(t);oldest.gain.gain.setTargetAtTime(.00001,t,.015);for(const osc of oldest.oscillators){try{osc.stop(t+.07);}catch{}}this.voices.delete(oldest);}
  const ctx=this.context,now=ctx.currentTime,preset=chimePalettes[this.scene];
  const midi=preset.notes[index%preset.notes.length],frequency=440*2**((midi-69)/12),voiceGain=ctx.createGain();
  const stereo=ctx.createStereoPanner();stereo.pan.value=clamp(pan,-.7,.7);voiceGain.connect(stereo);stereo.connect(this.master);stereo.connect(this.room);
  const peak=.012+.095*clamp(strength,0,1)**1.25,end=now+preset.decay*(.55+.6*strength);
  voiceGain.gain.setValueAtTime(0,now);voiceGain.gain.linearRampToValueAtTime(peak,now+.012);voiceGain.gain.exponentialRampToValueAtTime(.00001,end);
  const voice={gain:voiceGain,oscillators:[],remaining:preset.ratios.length};this.voices.add(voice);
  preset.ratios.forEach((ratio,i)=>{
   const osc=ctx.createOscillator(),partial=ctx.createGain();osc.type='sine';osc.frequency.value=frequency*ratio;osc.detune.value=i?Math.sin(index*2.1+i)*2:0;
   partial.gain.setValueAtTime(preset.weights[i],now);if(i)partial.gain.exponentialRampToValueAtTime(.0001,now+preset.decay/(1+i*.7));
   osc.connect(partial);partial.connect(voiceGain);voice.oscillators.push(osc);
   osc.onended=()=>{osc.disconnect();partial.disconnect();if(--voice.remaining===0){voiceGain.disconnect();stereo.disconnect();this.voices.delete(voice);}};
   osc.start(now);osc.stop(end+.06);
  });
  this.strikes++;return true;
 }
 brush(chains,p,scene,offset){
  if(this.disposed||!p.ready||this.context.state!=='running')return;
  this.setScene(scene);
  const speed=Math.hypot(p.vx,p.vy),now=this.context.currentTime;
  const interval=.26-Math.min(.21,speed*.025);if(now-this.lastStrike<interval)return;
  const dx=p.x-p.oldX,dy=p.y-p.oldY,den=dx*dx+dy*dy;
  let best=-1,bestDistance=.48;
  for(let i=0;i<chains.length;i+=2){
   if(now-(this.cooldowns.get(i)??-10)<.65)continue;
   const c=chains[i];for(let j=2;j<c.n;j+=3){
    const n=c.nodes[j],x=c.x+n.x+offset,y=c.y-n.y,t=den>1e-10?clamp(((x-p.oldX)*dx+(y-p.oldY)*dy)/den,0,1):1;
    const distance=Math.hypot(x-p.oldX-dx*t,y-p.oldY-dy*t);
    if(distance<bestDistance){bestDistance=distance;best=i;}
   }
  }
  if(!p.active||speed<.12)best=-1;
  let resonance=false;
  if(best<0){let energy=.003;for(let i=0;i<chains.length;i+=3){const c=chains[i];const motion=c.motionEnergy||0;if(motion>energy&&(c.motionDisplacement||0)>.035&&now-(this.cooldowns.get(i)??-10)>.8){energy=motion;best=i;resonance=true;}}}
  if(best<0)return;
  const strength=resonance?clamp((chains[best].motionEnergy||0)*12,0,.35):clamp(speed/(speed+2),0,1)*(1-bestDistance/.65);
  if(this.strike(Math.floor(best/2),strength,chains[best].x/3.4)){this.lastStrike=now;this.cooldowns.set(best,now);}
 }
 async close(){
  if(this.disposed)return;this.disposed=true;
  const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(.00001,now,.02);
  await new Promise(resolve=>setTimeout(resolve,90));await this.context.close();this.voices.clear();
 }
}
