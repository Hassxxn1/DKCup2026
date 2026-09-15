import {useState} from 'react';
import type {Entry} from '@/lib/draw';
import type {Player,TeamOfficial} from '@/lib/rosters';
import {renderSquad} from '@/lib/squad-export';
export default function SquadExport({team,players,officials,division,title,disabled}:{team:Entry;players:Player[];officials:TeamOfficial[];division:string;title:string;disabled:boolean}) {
  const [busy,setBusy]=useState(false),[pages,setPages]=useState<string[]>([]),[error,setError]=useState('');
  const filename=team.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'team';
  async function prepare(){setBusy(true);setError('');try{setPages(await renderSquad(team,players,officials,division,title));}catch(e){setError(e instanceof Error?e.message:'Export failed.');}finally{setBusy(false);}}
  function print(){
    const win=window.open('','_blank');if(!win){setError('Allow pop-ups to open the PDF / print preview.');return;}
    win.document.title=`${team.name} — Squad`;
    const style=win.document.createElement('style');style.textContent='@page{size:A4;margin:0}body{margin:0;background:#ddd}img{display:block;width:210mm;height:297mm;break-after:page;page-break-after:always}img:last-child{break-after:auto;page-break-after:auto}button{margin:16px;padding:12px}@media print{button{display:none}}';win.document.head.appendChild(style);
    const button=win.document.createElement('button');button.textContent='Print / Save as PDF';button.onclick=()=>win.print();win.document.body.appendChild(button);
    for(const src of pages){const img=win.document.createElement('img');img.src=src;img.alt=`${team.name} squad`;win.document.body.appendChild(img);}
  }
  return <div className="squad-export"><button className="roster-edit" disabled={disabled||busy} onClick={prepare}>{busy?'Preparing squad…':'Export squad'}</button>
    {error && <p role="alert" className="photo-error">{error}</p>}
    {pages.length>0 && <div className="squad-preview" role="dialog" aria-label="Squad export preview" aria-modal="true"><div className="squad-preview-content"><div className="squad-export-actions"><strong>{team.name} · Squad</strong><button className="roster-edit" onClick={print}>PDF / Print</button><button className="roster-edit" autoFocus onClick={()=>setPages([])}>Close</button></div><p>Download each PNG below, or choose PDF / Print. This export uses the roster as it was when you clicked Export squad.</p>{pages.map((src,i)=><div key={i}><a className="roster-edit" href={src} download={`${filename}-squad-${i+1}.png`}>Download PNG · Page {i+1}</a><img src={src} alt={`${team.name} squad page ${i+1}`}/></div>)}</div></div>}
  </div>;
}
