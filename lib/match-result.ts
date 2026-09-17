import type {Entry} from './draw';
export type ResultMatch={id:number;home:string;away:string;hs:string;as:string;division:string;time:string;ground:number;photo?:string};
export const hasResult=(match:ResultMatch)=>/^\d{1,2}$/.test(match.hs)&&/^\d{1,2}$/.test(match.as);
export function validateMatchPhoto(photo:unknown){
  if(photo!==undefined && (typeof photo!=='string'||photo.length>90000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) throw new Error('Invalid match photo.');
}
async function image(src:string){const img=new Image();img.src=src;await img.decode();return img;}
export async function loadMatchPhoto(file:File){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPG, PNG or WebP photo.');
  if(file.size>15*1024*1024)throw new Error('Choose a photo smaller than 15 MB.');
  const url=URL.createObjectURL(file);
  try{
    const img=await image(url),canvas=document.createElement('canvas'),c=canvas.getContext('2d');
    if(!c)throw new Error('Image processing is unavailable.');
    for(const size of [1080,900,720,540]){
      const scale=Math.min(1,size/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,0,0,canvas.width,canvas.height);
      for(const quality of [.85,.7,.55,.4]){const result=canvas.toDataURL('image/jpeg',quality);if(result.length<=90000){validateMatchPhoto(result);return result;}}
    }
    throw new Error('Please try a smaller photo.');
  }finally{URL.revokeObjectURL(url);}
}
export async function renderMatchResult(match:ResultMatch,teams:Entry[]){
  if(!hasResult(match))throw new Error('Enter both final scores before exporting.');
  const home=teams.find(t=>t.name===match.home),away=teams.find(t=>t.name===match.away);
  const sources=[...new Set(['/adk-synergy-white.png',home?.logo,away?.logo,match.photo].filter((s):s is string=>Boolean(s)))];
  const images=new Map(await Promise.all(sources.map(async src=>[src,await image(src)] as const)));
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
  const c=canvas.getContext('2d');if(!c)throw new Error('Image export is unavailable.');
  c.fillStyle='#080d12';c.fillRect(0,0,1080,1350);
  const text=(value:string,x:number,y:number,width:number,size:number,color='#fff')=>{c.font=`700 ${size}px Arial`;while(c.measureText(value).width>width&&size>13){size--;c.font=`700 ${size}px Arial`;}c.fillStyle=color;c.textAlign='center';c.fillText(value,x,y,width);};
  const contain=(src:string|undefined,x:number,y:number,w:number,h:number)=>{const img=src?images.get(src):undefined;if(!img)return;const scale=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);};
  contain('/adk-synergy-white.png',960,28,75,88);
  if(match.photo){
    const img=images.get(match.photo)!;const scale=Math.max(1080/img.width,760/img.height);
    c.save();c.beginPath();c.rect(0,140,1080,760);c.clip();c.drawImage(img,(1080-img.width*scale)/2,140+(760-img.height*scale)/2,img.width*scale,img.height*scale);c.restore();
    const fade=c.createLinearGradient(0,720,0,915);fade.addColorStop(0,'#080d1200');fade.addColorStop(1,'#080d12');c.fillStyle=fade;c.fillRect(0,720,1080,195);
  }
  const logoY=match.photo?950:515;
  const badge=(entry:Entry|undefined,name:string,x:number)=>{if(entry?.logo)contain(entry.logo,x-95,logoY,190,190);else{c.fillStyle='#1d303e';c.fillRect(x-95,logoY,190,190);text(name.split(/\s+/).map(n=>n[0]).slice(0,3).join(''),x,logoY+115,165,48,'#8edfff');}};
  badge(home,match.home,200);badge(away,match.away,880);
  text(`${match.hs} – ${match.as}`,540,logoY+135,430,116);
  text(match.home.toUpperCase(),220,logoY+240,380,30);text(match.away.toUpperCase(),860,logoY+240,380,30);
  return canvas.toDataURL('image/png');
}
