import {useEffect,useRef,useState} from 'react';
import type {Registration} from '@/lib/draw';
import {initialRoster,initialOfficials,type Officials,type TeamOfficial,type Player,type Rosters} from '@/lib/rosters';
import {teamCompany} from '@/lib/team-company';
import {Logo} from './draw-panel';
import TeamName from './team-name';
import {loadPlayerPhoto} from '@/lib/player-photo';

export default function TeamsPage({registration,rosters,officials,onOfficials,canEdit,saving,onChange}:{registration:Registration;rosters:Rosters;officials:Officials;onOfficials:(id:string,list:TeamOfficial[])=>void;canEdit:boolean;saving:boolean;onChange:(id:string,players:Player[])=>void}) {
  const [selected,setSelected]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const [uploading,setUploading]=useState<number|null>(null);
  const [photoError,setPhotoError]=useState('');
  const latest=useRef({rosters,canEdit,saving,onChange});
  latest.current={rosters,canEdit,saving,onChange};
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  const busy=saving || uploading!==null;
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(selected){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"start"});}},[selected]);
  const all=[...registration.men,...registration.women];
  const team=all.find(t=>t.id===selected);
  const roster=(t:typeof all[number])=>rosters[t.id] ?? initialRoster(t.name);
  if(team) {
    const players=roster(team);
    const staff=officials[team.id] ?? initialOfficials(team.name);
    const change=(index:number,patch:Partial<Player>)=>onChange(team.id,players.map((p,i)=>i===index?{...p,...patch}:p));
    const upload=async(index:number,file:File)=>{
      const original=players[index];
      setUploading(index);setPhotoError('');
      try {
        const photo=await loadPlayerPhoto(file);
        if(!mounted.current) return;
        const current=latest.current;
        const list=current.rosters[team.id] ?? players;
        if(!current.canEdit || current.saving || list[index]!==original) throw new Error('The roster changed while uploading. Please select the photo again.');
        current.onChange(team.id,list.map((p,i)=>i===index?{...p,photo}:p));
      } catch(error) {if(mounted.current) setPhotoError(error instanceof Error?error.message:'Photo upload failed.');}
      finally {if(mounted.current) setUploading(null);}
    };
    return <section className="roster-detail">
      <button className="roster-back" disabled={busy} onClick={()=>{setSelected(null);setEditing(false);}}>← All teams</button>
      <header className="roster-header"><Logo team={team}/><div><p className="kicker">{registration.men.some(t=>t.id===team.id)?'MEN’S TEAM':'WOMEN’S TEAM'}</p><h2 ref={heading} tabIndex={-1}><TeamName name={team.name}/></h2></div>
      {canEdit && <button className="roster-edit" disabled={busy} onClick={()=>setEditing(!editing)}>{editing?'View roster':'Edit roster'}</button>}</header>
      {(staff.some(o=>o.name.trim()) || canEdit) && <section className="team-officials"><h3>Team officials</h3><div className="officials-grid">
        {staff.map((o,i)=>canEdit && editing ? <div className="roster-editor" key={i}>
          <label>Role<input value={o.role} maxLength={80} disabled={busy} onChange={e=>onOfficials(team.id,staff.map((x,n)=>n===i?{...x,role:e.target.value}:x))}/></label>
          <label>Name<input value={o.name} maxLength={120} disabled={busy} onChange={e=>onOfficials(team.id,staff.map((x,n)=>n===i?{...x,name:e.target.value}:x))}/></label>
          <button disabled={busy} aria-label={`Remove official ${o.name}`} onClick={()=>onOfficials(team.id,staff.filter((_,n)=>n!==i))}>Remove</button>
        </div> : o.name.trim() && <div className="official-card" key={i}><small>{o.role}</small><strong>{o.name}</strong></div>)}
      </div>{canEdit && editing && <button className="roster-edit" disabled={busy || staff.length>=20} onClick={()=>onOfficials(team.id,[...staff,{role:'Official',name:''}])}>Add official</button>}</section>}
      <h3 className="players-heading">Players</h3>
      <p className="roster-count">{players.filter(p=>p.name.trim()).length} players</p>
      {canEdit && editing && <p className="roster-help">Edit player details, then use Save & publish to update the public roster.</p>}
      {photoError && <p role="alert" className="photo-error">{photoError}</p>}
      {uploading!==null && <p role="status">Preparing photo… Please wait before saving.</p>}
      <div className="roster-list">
        {players.map((p,i)=>canEdit && editing ? <div className="roster-editor" key={i}>
          <label>Jersey number<input inputMode="numeric" value={p.number} maxLength={3} disabled={busy} onChange={e=>change(i,{number:e.target.value.replace(/\D/g,'')})}/></label>
          <label>Player name<input value={p.name} maxLength={120} disabled={busy} onChange={e=>change(i,{name:e.target.value})}/></label>
          <label>Company<input value={p.company} maxLength={160} disabled={busy} onChange={e=>change(i,{company:e.target.value})}/></label>
          <div className="player-photo-editor">
            {p.photo && <img className="player-photo" src={p.photo} alt={p.name || 'Player photo'}/>}
            <label>{p.photo?'Change photo':'Add photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-label={`Photo for ${p.name || 'player'}`} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file) void upload(i,file);}}/><small>JPG, PNG or WebP · up to 10 MB · cropped square</small></label>
            {p.photo && <button disabled={busy} onClick={()=>change(i,{photo:undefined})}>Remove photo</button>}
          </div>
          <button disabled={busy} aria-label={`Remove ${p.name || 'player'}`} onClick={()=>onChange(team.id,players.filter((_,n)=>n!==i))}>Remove</button>
        </div> : p.name.trim() && <div className="roster-player" key={i}>{p.photo ? <img className="player-photo" src={p.photo} alt={p.name} loading="lazy"/> : <span className="player-photo player-photo-placeholder" aria-hidden="true">{p.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join('')}</span>}<span className="jersey-number" aria-label={`Jersey number ${p.number || 'not assigned'}`}>{p.number || '–'}</span><div><strong>{p.name}</strong><small>{p.company}</small></div></div>)}
      </div>
      {!players.some(p=>p.name.trim()) && <p className="roster-help">Player details will be available soon.</p>}
      {canEdit && editing && <button className="roster-edit" disabled={busy || players.length>=30} onClick={()=>onChange(team.id,[...players,{name:'',company:teamCompany(team.name),number:''}])}>Add player</button>}
    </section>;
  }
  return <div className="team-directory">{(['men','women'] as const).map(division=><section key={division}><h2>{division==='men'?'Men’s teams':'Women’s teams'}</h2><div className="team-directory-grid">{registration[division].map(t=><button className="team-directory-card" key={t.id} onClick={()=>setSelected(t.id)}><Logo team={t}/><div><strong><TeamName name={t.name}/></strong><span className="team-player-count">{roster(t).filter(p=>p.name.trim()).length} players · View team →</span></div></button>)}</div></section>)}</div>;
}
