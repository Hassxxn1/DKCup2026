// Remove only near-white pixels connected to the image edge, preserving enclosed whites.
export function clearLogoBackground(data:Uint8ClampedArray,width:number,height:number){
  const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
  const add=(p:number)=>{if(seen[p])return;seen[p]=1;const i=p*4;if(data[i+3]===0 || (Math.min(data[i],data[i+1],data[i+2])>=235 && Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<=15))queue[tail++]=p;};
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  while(head<tail){const p=queue[head++];data[p*4+3]=0;const x=p%width;if(x>0)add(p-1);if(x<width-1)add(p+1);if(p>=width)add(p-width);if(p<width*(height-1))add(p+width);}
}
export function transparentLogo(img:HTMLImageElement){
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const c=canvas.getContext('2d');if(!c)return img;c.drawImage(img,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);clearLogoBackground(pixels.data,canvas.width,canvas.height);c.putImageData(pixels,0,0);return canvas;
}
