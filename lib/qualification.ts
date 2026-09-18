type Result = {division:string; stage:string; hs:string; as:string};
type Rank = {team:string; pts:number; gd:number; gf:number};
export function qualifiedTeam(matches:Result[], division:string, confirmed:boolean, ranks:Rank[], position:number) {
  const games=matches.filter(m=>m.division===division && m.stage==='Group');
  if(!confirmed || games.length!==6 || !games.every(m=>/^\d+$/.test(m.hs) && /^\d+$/.test(m.as))) return undefined;
  const team=ranks[position];
  if(!team || ranks.some((other,i)=>i!==position && other.pts===team.pts && other.gd===team.gd && other.gf===team.gf)) return undefined;
  return team.team;
}

export function knockoutWinner(result:{hs:string;as:string}|undefined,teams:[string|undefined,string|undefined]) {
  if(!result || !teams[0] || !teams[1] || !/^\d+$/.test(result.hs) || !/^\d+$/.test(result.as) || Number(result.hs)===Number(result.as)) return undefined;
  return Number(result.hs)>Number(result.as)?teams[0]:teams[1];
}
