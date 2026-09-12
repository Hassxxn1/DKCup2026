import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useTournamentCloud } from './use-tournament-cloud';
const mock = vi.hoisted(() => ({ session:null as any, editor:false, row:{state:{score:0},version:1,updated_at:'now'}, rpc:vi.fn(), callback:null as any }));
vi.mock('./supabase',()=>({supabase:{auth:{
 getSession:async()=>({data:{session:mock.session}}),
 onAuthStateChange:(cb:any)=>{mock.callback=cb;return {data:{subscription:{unsubscribe(){}}}};},
},from:(table:string)=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:table==='tournament_editors'?(mock.editor?{user_id:'official'}:null):mock.row}),single:async()=>({data:mock.row})})})}),rpc:mock.rpc}}));
const fresh=()=>({score:0});
const normalize=(v:unknown)=>v as {score:number};
let cloud:ReturnType<typeof useTournamentCloud<{score:number}>>;
let root:ReactTestRenderer;
function Harness(){cloud=useTournamentCloud(fresh,normalize);return null;}
beforeEach(()=>{
 vi.useFakeTimers();
 mock.session=null;mock.editor=false;mock.row={state:{score:0},version:1,updated_at:'now'};mock.rpc.mockReset();
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('window',{setInterval,clearInterval,addEventListener(){},removeEventListener(){}});
 const items=new Map();vi.stubGlobal('localStorage',{setItem:(k:string,v:string)=>items.set(k,v),getItem:(k:string)=>items.get(k),removeItem:(k:string)=>items.delete(k)});
});
afterEach(async()=>{if(root)await act(async()=>root.unmount());vi.useRealTimers();vi.unstubAllGlobals();});
async function mount(editor=false){mock.editor=editor;if(editor)mock.session={user:{id:'official'}};await act(async()=>{root=create(createElement(Harness));});}
it('public viewers cannot change or publish data',async()=>{await mount();expect(cloud.ready).toBe(true);await act(async()=>cloud.setData({score:5}));await act(async()=>cloud.publish());expect(cloud.data.score).toBe(0);expect(mock.rpc).not.toHaveBeenCalled();});
it('publishes an official draft with the loaded version',async()=>{await mount(true);mock.rpc.mockResolvedValue({data:2});await act(async()=>cloud.setData({score:3}));expect(cloud.dirty).toBe(true);await act(async()=>cloud.publish());expect(mock.rpc).toHaveBeenCalledWith('save_tournament',{next_state:{score:3},expected_version:1});expect(cloud.dirty).toBe(false);});
it('retains a draft after a conflicting save and incoming updates',async()=>{await mount(true);await act(async()=>cloud.setData({score:3}));mock.row={state:{score:7},version:2,updated_at:'later'};mock.rpc.mockResolvedValue({error:{message:'Another official updated the tournament'}});await act(async()=>cloud.publish());await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});expect(cloud.data.score).toBe(3);expect(cloud.dirty).toBe(true);expect(cloud.error).toContain('Not published');});
it('refreshes the public view when another official publishes',async()=>{await mount();mock.row={state:{score:7},version:2,updated_at:'later'};await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});expect(cloud.data.score).toBe(7);});
