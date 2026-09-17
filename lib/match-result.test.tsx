import {expect,it} from 'vitest';
import {hasResult,validateMatchPhoto,type ResultMatch} from './match-result';
const match:ResultMatch={id:1,home:'Home',away:'Away',hs:'0',as:'0',division:'Men A',time:'20:00',ground:1};
it('exports scoreless draws but not partial or invalid scores',()=>{
 expect(hasResult(match)).toBe(true);
 for(const score of ['', 'x', '-1','100']) expect(hasResult({...match,as:score})).toBe(false);
});
it('accepts a saved match photo and removal, and rejects unsafe or oversized imports',()=>{
 const photo='data:image/jpeg;base64,/9j/AA==';
 expect(()=>validateMatchPhoto(JSON.parse(JSON.stringify({...match,photo})).photo)).not.toThrow();
 expect(()=>validateMatchPhoto(undefined)).not.toThrow();
 for(const value of [123,'https://example.com/photo.jpg','data:image/svg+xml;base64,AAAA','data:image/jpeg;base64,'+'A'.repeat(90000)]) expect(()=>validateMatchPhoto(value)).toThrow();
});
