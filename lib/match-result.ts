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
export async function renderMatchResult(match:ResultMatch,teams:Entry[],title:string,date:string,venue:string){
  if(!hasResult(match))throw new Error('Enter both final scores before exporting.');
  const home=teams.find(t=>t.name===match.home),away=teams.find(t=>t.name===match.away);
  const sources=[...new Set(['/adk-synergy-white.png','/sponsors-transparent.png',home?.logo,away?.logo,match.photo].filter((s):s is string=>Boolean(s)))];
  const images=new Map(await Promise.all(sources.map(async src=>[src,await image(src)] as const)));
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
  const c=canvas.getContext('2d');if(!c)throw new Error('Image export is unavailable.');
  c.fillStyle='#080d12';c.fillRect(0,0,1080,1350);
  const text=(value:string,x:number,y:number,width:number,size:number,color='#fff')=>{c.font=`700 ${size}px Arial`;while(c.measureText(value).width>width&&size>13){size--;c.font=`700 ${size}px Arial`;}c.fillStyle=color;c.textAlign='center';c.fillText(value,x,y,width);};
  const contain=(src:string|undefined,x:number,y:number,w:number,h:number)=>{const img=src?images.get(src):undefined;if(!img)return;const scale=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);};
  c.fillStyle='#00afef';c.fillRect(0,0,1080,10);
  text(title.toUpperCase(),470,65,830,29,'#8edfff');contain('/adk-synergy-white.png',960,28,75,88);
  text(`${date} · ${match.division} · ${match.time}`,470,103,830,20,'#b8c4cf');
  if(match.photo){
    const img=images.get(match.photo)!;const scale=Math.max(1080/img.width,555/img.height);
    c.save();c.beginPath();c.rect(0,140,1080,555);c.clip();c.drawImage(img,(1080-img.width*scale)/2,140+(555-img.height*scale)/2,img.width*scale,img.height*scale);c.restore();
    const fade=c.createLinearGradient(0,520,0,710);fade.addColorStop(0,'#080d1200');fade.addColorStop(1,'#080d12');c.fillStyle=fade;c.fillRect(0,520,1080,190);
  }else{
    const gradient=c.createLinearGradient(0,140,1080,650);gradient.addColorStop(0,'#123044');gradient.addColorStop(1,'#080d12');c.fillStyle=gradient;c.fillRect(0,140,1080,555);
    text('MATCH RESULT',540,375,940,94,'#fff');text(venue,540,435,940,25,'#8edfff');
  }
  text('FULL TIME',540,731,800,25,'#00afef');
  const badge=(entry:Entry|undefined,name:string,x:number)=>{if(entry?.logo)contain(entry.logo,x-85,782,170,170);else{c.fillStyle='#1d303e';c.fillRect(x-85,782,170,170);text(name.split(/\s+/).map(n=>n[0]).slice(0,3).join(''),x,885,145,48,'#8edfff');}};
  badge(home,match.home,200);badge(away,match.away,880);
  text(`${match.hs} – ${match.as}`,540,905,430,116);
  text(match.home.toUpperCase(),220,1000,380,30);text(match.away.toUpperCase(),860,1000,380,30);
  text(venue,540,1070,960,22,'#b8c4cf');
  c.fillStyle='#34404a';c.fillRect(50,1120,980,1);text('OUR SPONSORS',540,1160,900,16,'#b8c4cf');
  contain('/sponsors-transparent.png',50,1177,980,130);
  return canvas.toDataURL('image/png');
}
