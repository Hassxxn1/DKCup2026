import {expect,it} from 'vitest';
import {qualifiedTeam} from './qualification';
const ranks=[{team:'A',pts:9,gd:3,gf:6},{team:'B',pts:6,gd:2,gf:4}];
const games=Array.from({length:6},()=>({division:'Men A',stage:'Group',hs:'1',as:'0'}));
it('does not qualify teams before every group result is entered',()=>{
 expect(qualifiedTeam(games.map(m=>({...m,hs:'',as:''})),'Men A',true,ranks,0)).toBeUndefined();
 expect(qualifiedTeam(games.slice(1),'Men A',true,ranks,0)).toBeUndefined();
 expect(qualifiedTeam(games.map((m,i)=>i===0?{...m,as:''}:m),'Men A',true,ranks,0)).toBeUndefined();
});
it('qualifies ranked teams only after a confirmed complete group',()=>{
 expect(qualifiedTeam(games,'Men A',true,ranks,0)).toBe('A');
 expect(qualifiedTeam(games,'Men A',false,ranks,0)).toBeUndefined();
});
it('does not choose a qualifier by registration order when ranking is tied',()=>{
 expect(qualifiedTeam(games,'Men A',true,[ranks[0],{...ranks[0],team:'B'}],0)).toBeUndefined();
});
