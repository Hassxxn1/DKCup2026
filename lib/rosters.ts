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
