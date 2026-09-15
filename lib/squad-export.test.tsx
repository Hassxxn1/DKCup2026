import {expect,it} from 'vitest';
import {squadPages} from './squad-export';
it('paginates without losing names, photos or jersey numbers and separates officials',()=>{
 const players=Array.from({length:30},(_,i)=>({name:`Player ${i}`,number:String(i),company:'Company',photo:'data:image/jpeg;base64,AAAA'}));
 const officials=Array.from({length:20},(_,i)=>({name:`Official ${i}`,role:'Coach'}));
 const pages=squadPages(players,officials);
 expect(pages.map(p=>p.people.length)).toEqual([12,12,6,12,8]);
 expect(pages.slice(0,3).flatMap(p=>p.people).map(p=>p.name)).toEqual(players.map(p=>p.name));
 expect(pages[0].people[0]).toMatchObject({number:'0',photo:players[0].photo});
 expect(pages[3].title).toBe('TEAM OFFICIALS');
 expect(squadPages([{name:' ',number:'',company:''}],[])).toEqual([]);
});
