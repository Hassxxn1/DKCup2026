import {expect,it} from 'vitest';
import initial from './initial-rosters.json';
import {initialRoster,readRosters} from './rosters';
it('imports all 128 players from 12 teams with unique jersey numbers per team',()=>{
 expect(Object.keys(initial)).toHaveLength(12);
 expect(Object.values(initial).flat()).toHaveLength(128);
 for(const players of Object.values(initial)){expect(new Set(players.map(p=>p.number)).size).toBe(players.length);expect(players.every(p=>p.name && p.company && /^\d+$/.test(p.number))).toBe(true);}
});
it('matches existing team spelling and keeps seed data unchanged when editing',()=>{
 const players=initialRoster('TWC WARRIORS');expect(players).toHaveLength(8);players[0].name='Changed';expect(initialRoster('TWC WORRIORS')[0].name).toBe('NAUSHAD NASEER');
});
it('preserves saved overrides, including an intentionally empty roster',()=>{
 expect(readRosters(undefined)).toEqual({});expect(readRosters({'men-1':[]})).toEqual({'men-1':[]});
 const r={'women-1':[{name:'Player',company:'ADK Hospital',number:'7'}]};expect(readRosters(r)).toEqual(r);
});
it('rejects malformed roster imports',()=>{
 expect(()=>readRosters({'men-1':[{name:'Player',company:'ADK',number:'abc'}]})).toThrow();
 expect(()=>readRosters({'unknown':[]})).toThrow();
});

import {initialOfficials,readOfficials} from './rosters';
import officials from './initial-officials.json';
it('imports 52 officials and preserves the roles in the source PDFs',()=>{
 expect(Object.values(officials).flat()).toHaveLength(52);
 expect(initialOfficials('Pharma FC')).toContainEqual({role:'Assistant Coach',name:'Santhosh'});
 expect(initialOfficials('Pharma FC')).toContainEqual({role:'Team Medical',name:'Rikaz'});
 expect(initialOfficials('GT Lions')).toEqual([{role:'Manager',name:'Nishan Cooray'}]);
 expect(readOfficials({'men-1':[]})).toEqual({'men-1':[]});
 expect(()=>readOfficials({'men-1':[{name:123,role:'Coach'}]})).toThrow();
});

it('preserves photos through JSON save/load and supports removing them',()=>{
 const player={name:'Player',company:'ADK',number:'7',photo:'data:image/jpeg;base64,/9j/AA=='};
 expect(readRosters(JSON.parse(JSON.stringify({'men-1':[player]})))['men-1'][0]).toEqual(player);
 expect(readRosters({'men-1':[{...player,photo:undefined}]})['men-1'][0]).not.toHaveProperty('photo');
 for(const photo of ['https://example.com/photo.jpg','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,'+'A'.repeat(24000),123]) expect(()=>readRosters({'men-1':[{...player,photo}]})).toThrow();
});
