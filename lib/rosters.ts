import officials from './initial-officials.json';
import initial from './initial-rosters.json';
export type Player = {name:string;company:string;number:string};
export type Rosters = Record<string,Player[]>;
export function initialRoster(name:string):Player[] {
  let key=name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(key==='twcwarriors') key='twcworriors';
  return ((initial as Rosters)[key] || []).map(player=>({...player}));
}
export function readRosters(value:unknown):Rosters {
  if(value===undefined) return {};
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('Invalid team rosters.');
  const result:Rosters={};
  for(const [id,players] of Object.entries(value)) {
    if(!/^(men|women)-[1-8]$/.test(id) || !Array.isArray(players) || players.length>30) throw new Error('Invalid team roster.');
    result[id]=players.map(p=>{
      if(!p || typeof p.name!=='string' || p.name.length>120 || typeof p.company!=='string' || p.company.length>160 || typeof p.number!=='string' || !/^\d{0,3}$/.test(p.number)) throw new Error('Invalid player details.');
      return {name:p.name,company:p.company,number:p.number};
    });
  }
  return result;
}

export type TeamOfficial = {role:string;name:string};
export type Officials = Record<string,TeamOfficial[]>;

export function initialOfficials(name:string):TeamOfficial[] {
  let key=name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(key==='twcwarriors') key='twcworriors';
  return ((officials as Officials)[key] || []).map(o=>({...o}));
}
export function readOfficials(value:unknown):Officials {
  if(value===undefined) return {};
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('Invalid team officials.');
  const result:Officials={};
  for(const [id,list] of Object.entries(value)) {
    if(!/^(men|women)-[1-8]$/.test(id) || !Array.isArray(list) || list.length>20) throw new Error('Invalid team officials.');
    result[id]=list.map(o=>{
      if(!o || typeof o.name!=='string' || o.name.length>120 || typeof o.role!=='string' || o.role.length>80) throw new Error('Invalid official details.');
      return {name:o.name,role:o.role};
    });
  }
  return result;
}
