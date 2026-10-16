import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {build} from 'esbuild';
const db=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+file,'utf8'));
const adapter={
 prepare(sql){
  const statement=db.prepare(sql);
  return {bind(...args){return {
   async first(){return statement.get(...args)||null},
   async all(){return {results:statement.all(...args)}},
   async run(){return statement.run(...args)}
  }}};
 }
};
globalThis.__testDB=adapter;
const bundle=await build({stdin:{contents:"export * as runs from './app/api/runs/route.ts';export * as board from './app/api/leaderboard/route.ts';export * as rooms from './app/api/rooms/route.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'local-d1',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env={DB:globalThis.__testDB};',loader:'js'}));}}]});
const {runs,board,rooms}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const base='https://game.example';
async function call(path,{method='GET',body,cookie,origin=base}={}){const req=new Request(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const response=await(path.startsWith('/api/leaderboard')?board:path.startsWith('/api/rooms')?rooms:runs)[method](req);return{status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0],data:await response.json()};}
const a=await call('/api/runs',{method:'POST',body:{name:'勇者',mode:'action'}});assert.equal(a.status,201);assert(a.cookie);
const result={id:a.data.id,won:true,cleared:6,kills:64,level:10,seconds:480,turns:0};
let r=await call('/api/runs',{method:'PATCH',body:result,cookie:a.cookie});assert.equal(r.status,200);assert.equal(r.data.result.score,9410);const score=r.data.result.score;
r=await call('/api/runs',{method:'PATCH',body:{...result,seconds:0},cookie:a.cookie});assert.equal(r.data.result.score,score);
for(const mode of ['turn','coop']){const rejected=await call('/api/runs',{method:'POST',body:{name:'旧模式',mode}});assert.equal(rejected.status,400);}
for(const method of ['GET','POST']){const retired=await call('/api/rooms',{method,body:method==='POST'?{op:'create',name:'玩家'}:undefined});assert.equal(retired.status,410);}
// An existing turn-mode run can still finish and remain in its owner's history.
const legacyOwner=crypto.randomUUID(),legacyId=crypto.randomUUID();
db.prepare('INSERT INTO expedition_runs (id,player_id,name,mode,started_at) VALUES (?,?,?,?,?)').run(legacyId,legacyOwner,'历史战术家','turn',Date.now());
const b={data:{id:legacyId},cookie:'expedition_player='+legacyOwner};
r=await call('/api/runs',{method:'PATCH',body:{...result,id:b.data.id,seconds:240,turns:150},cookie:b.cookie});assert.equal(r.status,200);assert.equal(r.data.result.score,9290);
r=await call('/api/runs',{method:'PATCH',body:result,cookie:b.cookie});assert.equal(r.status,404);
r=await call('/api/runs',{cookie:a.cookie});assert.equal(r.data.results.length,1);assert.equal(r.data.results[0].id,a.data.id);assert(!('player_id' in r.data.results[0]));
r=await call('/api/runs');assert.deepEqual(r.data.results,[]);
r=await call('/api/leaderboard?mode=action');assert.equal(r.data.results.length,1);assert.equal(r.data.results[0].id,a.data.id);
r=await call('/api/leaderboard?mode=turn');assert.equal(r.data.results[0].id,b.data.id);
r=await call('/api/runs',{method:'POST',body:{name:'<script>',mode:'action'}});assert.equal(r.status,400);
r=await call('/api/runs',{method:'PATCH',cookie:a.cookie,body:{...result,kills:999}});assert.equal(r.status,400);
r=await call('/api/runs',{method:'POST',origin:'https://unrelated.example',body:{name:'拒绝来源',mode:'action'}});assert.equal(r.status,403);
const c=await call('/api/runs',{method:'POST',body:{name:'勇者',mode:'action'},cookie:a.cookie});assert.equal(c.status,201);r=await call('/api/runs',{method:'PATCH',body:{...result,id:c.data.id,won:false,cleared:1,kills:15,level:3,seconds:90},cookie:a.cookie});assert.equal(r.status,200);assert.equal(r.data.result.status,'defeated');
r=await call('/api/runs',{cookie:a.cookie});assert.equal(r.data.results.length,2);
r=await call('/api/leaderboard?mode=action');assert(r.data.results[0].score>r.data.results[1].score);
db.close();console.log('PASS: production handlers with SQLite: saved win/loss, history, global ordering, retired modes rejected, old results preserved, immutable retries, ownership, input checks and cross-origin rejection.');
