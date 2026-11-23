import {Box3} from './vendor/three.js';

// Rasterize the front surface onto a typesetting grid. A depth buffer keeps
// the nearest surface at each cell and prevents stacked letters.
export function sampleArchitecture(root, count, mobile) {
 const meshes = root.children.filter(child => child.isMesh);
 const bounds = new Box3();
 for (const mesh of meshes) {
  mesh.geometry.computeBoundingBox();
  bounds.union(mesh.geometry.boundingBox);
 }
 if (bounds.isEmpty()) return [];
 const dx = mobile ? .255 : .204, dy = mobile ? .205 : .181;
 const cols = Math.ceil((bounds.max.x-bounds.min.x)/dx);
 const rows = Math.ceil((bounds.max.y-bounds.min.y)/dy);
 const grid = new Array(cols*rows);
 const left = bounds.min.x+dx*.2, top = bounds.max.y-dy*.27;
 for (const mesh of meshes) {
  const v = mesh.geometry.attributes.position.array;
  for (let i=0; i<v.length; i+=9) {
   const ax=v[i], ay=v[i+1], az=v[i+2];
   const ux=v[i+3]-ax, uy=v[i+4]-ay, uz=v[i+5]-az;
   const vx=v[i+6]-ax, vy=v[i+7]-ay, vz=v[i+8]-az;
   const det=ux*vy-uy*vx;
   if (Math.abs(det)<1e-8) continue;
   const firstRow=Math.max(0,Math.ceil((top-Math.max(ay,ay+uy,ay+vy))/dy));
   const lastRow=Math.min(rows-1,Math.floor((top-Math.min(ay,ay+uy,ay+vy))/dy));
   for (let row=firstRow; row<=lastRow; row++) {
    const y=top-row*dy, start=left+(row%2)*dx*.5;
    const firstCol=Math.max(0,Math.ceil((Math.min(ax,ax+ux,ax+vx)-start)/dx));
    const lastCol=Math.min(cols-1,Math.floor((Math.max(ax,ax+ux,ax+vx)-start)/dx));
    for (let col=firstCol; col<=lastCol; col++) {
     const x=start+col*dx;
     const b=((x-ax)*vy-(y-ay)*vx)/det;
     const c=(ux*(y-ay)-uy*(x-ax))/det;
     if (b<0 || c<0 || b+c>1) continue;
     const z=az+b*uz+c*vz, index=row*cols+col;
     if (grid[index]?.z>=z) continue;
     const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz;
     const light=.77+.23*Math.abs((ny*.55+det*.83)/Math.hypot(nx,ny,det));
     grid[index]={x,y,z,light};
    }
   }
  }
 }
 const points=grid.filter(Boolean);
 return points.filter((_,i)=>points.length<=count ||
  Math.floor(i*count/points.length)!==Math.floor((i+1)*count/points.length)).sort((a,b)=>a.x-b.x);
}
