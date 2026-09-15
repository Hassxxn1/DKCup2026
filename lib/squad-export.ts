import type {Entry} from './draw';
import type {Player,TeamOfficial} from './rosters';
import {teamCompany} from './team-company';

type Person={name:string;detail:string;photo?:string;number?:string};
export function squadPages(players:Player[],officials:TeamOfficial[]) {
  const groups:{title:string;people:Person[]}[]=[
    {title:'PLAYERS',people:players.filter(p=>p.name.trim()).map(p=>({name:p.name,detail:p.company,photo:p.photo,number:p.number}))},
    {title:'TEAM OFFICIALS',people:officials.filter(o=>o.name.trim()).map(o=>({name:o.name,detail:o.role,photo:o.photo}))},
  ];
  const sections=groups.filter(g=>g.people.length);
  return sections.length ? [{sections,people:sections.flatMap(g=>g.people)}] : [];
}
async function load(src:string) {
  const img=new Image();img.crossOrigin='anonymous';
  await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('An image could not load. Please retry the export.'));img.src=src;});
  return img;
}
export async function renderSquad(team:Entry,players:Player[],officials:TeamOfficial[],division:string,title:string) {
  await document.fonts.ready;
  const pages=squadPages(players,officials);
  if(!pages.length) throw new Error('Add players or officials before exporting this squad.');
  const sources=[...new Set(['/adk-synergy-white.png','/sponsors-transparent.png',team.logo,...pages.flatMap(p=>p.people.map(x=>x.photo||''))].filter(Boolean))];
  const images=new Map(await Promise.all(sources.map(async src=>[src,await load(src)] as const)));
  return pages.map((page,pageIndex)=>{
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1697;
    const c=canvas.getContext('2d');if(!c) throw new Error('Your browser does not support image export.');
    c.fillStyle='#090d10';c.fillRect(0,0,1200,1697);
    c.fillStyle='#00afe3';c.fillRect(0,0,1200,12);
    const text=(value:string,x:number,y:number,width:number,size:number,color='#fff',weight=700)=>{
      c.fillStyle=color;c.font=`${weight} ${size}px Arial`;
      while(c.measureText(value).width>width && size>12){size--;c.font=`${weight} ${size}px Arial`;}
      c.fillText(value,x,y,width);
    };
    const contain=(src:string,x:number,y:number,w:number,h:number)=>{
      const img=images.get(src);if(!img)return;
      const scale=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);
    };
    contain('/adk-synergy-white.png',1040,40,100,110);
    text(title.toUpperCase(),60,65,940,25,'#8edfff');
    text(`${division.toUpperCase()} · SQUAD`,60,105,940,18,'#b5bec5');
    if(team.logo)contain(team.logo,60,140,110,110);
    const left=team.logo?195:60;
    text(team.name.toUpperCase(),left,187,940-left,48);
    text(teamCompany(team.name),left,226,940-left,24,'#b5bec5',400);
    const columns=page.people.length>28?5:4;
    const gap=16,cardWidth=(1080-gap*(columns-1))/columns;
    const rows=page.sections.reduce((sum,g)=>sum+Math.ceil(g.people.length/columns),0);
    const cardHeight=Math.min(240,(1135-page.sections.length*46-rows*gap)/rows);
    let top=275;
    page.sections.forEach(section=>{
      text(section.title,60,top+24,1000,23,'#8edfff');
      top+=46;
      section.people.forEach((person,i)=>{
        const x=60+(i%columns)*(cardWidth+gap),y=top+Math.floor(i/columns)*(cardHeight+gap);
        c.fillStyle='#171e24';c.fillRect(x,y,cardWidth,cardHeight);
        const photoSize=Math.max(32,Math.min(cardWidth-20,cardHeight-66));
        const photoX=x+(cardWidth-photoSize)/2,photoY=y+10;
        const img=person.photo?images.get(person.photo):undefined;
        if(img)c.drawImage(img,photoX,photoY,photoSize,photoSize);
        else {c.fillStyle='#26353f';c.fillRect(photoX,photoY,photoSize,photoSize);text(person.name.split(/\s+/).map(n=>n[0]).slice(0,2).join(''),photoX+photoSize*.2,photoY+photoSize*.65,photoSize*.65,Math.min(32,photoSize*.4),'#a9bac6');}
        if(person.number!==undefined){c.fillStyle='#00afe3';c.fillRect(x+8,y+10,42,30);text(person.number||'–',x+14,y+32,30,21,'#071016');}
        text(person.name,x+10,y+cardHeight-32,cardWidth-20,20);
        text(person.detail,x+10,y+cardHeight-10,cardWidth-20,16,'#b5bec5',400);
      });
      top+=Math.ceil(section.people.length/columns)*(cardHeight+gap);
    });
    c.fillStyle='#34404a';c.fillRect(60,1440,1080,1);
    text('OUR SPONSORS',60,1474,800,15,'#b5bec5');
    contain('/sponsors-transparent.png',60,1490,1080,135);
    text(`ADK SYNERGY · ${pageIndex+1} / ${pages.length}`,60,1660,1080,16,'#b5bec5');
    return canvas.toDataURL('image/png');
  });
}
