import {expect,it} from 'vitest';
import {clearLogoBackground} from './logo-background';
it('removes edge white while preserving enclosed white and colored logo pixels',()=>{
 const data=new Uint8ClampedArray(5*5*4).fill(255);
 for(let y=1;y<4;y++)for(let x=1;x<4;x++)if(x!==2||y!==2){const i=(y*5+x)*4;data[i]=0;data[i+1]=100;data[i+2]=180;}
 clearLogoBackground(data,5,5);
 expect(data[3]).toBe(0);expect(data[(2*5+2)*4+3]).toBe(255);expect(data[(1*5+1)*4+3]).toBe(255);
});
