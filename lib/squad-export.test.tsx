import {expect,it} from 'vitest';
import {squadPages} from './squad-export';
it('fits the entire squad on one page without losing people or photos',()=>{
 const players=Array.from({length:30},(_,i)=>({name:`Player ${i}`,number:String(i),company:'Company',photo:'data:image/jpeg;base64,AAAA'}));
 const officials=Array.from({length:20},(_,i)=>({name:`Official ${i}`,role:'Coach'}));
 const pages=squadPages(players,officials);
 expect(pages).toHaveLength(1);
 expect(pages[0].people).toHaveLength(50);
 expect(pages[0].sections[0].people.map(p=>p.name)).toEqual(players.map(p=>p.name));
 expect(pages[0].people[0]).toMatchObject({number:'0',photo:players[0].photo});
 expect(pages[0].sections[1].title).toBe('TEAM OFFICIALS');
 expect(squadPages([{name:' ',number:'',company:''}],[])).toEqual([]);
});
