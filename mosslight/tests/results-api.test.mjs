import assert from 'node:assert/strict';
const base=process.env.EXPEDITION_TEST_ORIGIN||'http://127.0.0.1:4173';
assert(new URL(base).hostname==='127.0.0.1','Tests must only write to local preview');
async function call(path,{method='GET',body,cookie,origin=base}={}){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0],data:await response.json().catch(()=>({error:'Non-JSON rejection'}))};}
const a=await call('/api/runs',{method:'POST',body:{name:'本地测试 · 勇者',mode:'action'}});assert.equal(a.status,201);assert(a.cookie);
const result={id:a.data.id,won:true,cleared:6,kills:64,level:10,seconds:480,turns:0};
let r=await call('/api/runs',{method:'PATCH',body:result,cookie:a.cookie});assert.equal(r.status,200);assert.equal(r.data.result.score,9410);const score=r.data.result.score;
r=await call('/api/runs',{method:'PATCH',body:{...result,seconds:0},cookie:a.cookie});assert.equal(r.data.result.score,score,'Saved results are immutable on retries');
const b=await call('/api/runs',{method:'POST',body:{name:'本地测试 · 剑客',mode:'action'}});assert.equal(b.status,201);
r=await call('/api/runs',{method:'PATCH',body:{...result,id:b.data.id,seconds:240,turns:150},cookie:b.cookie});assert.equal(r.status,200);assert.equal(r.data.result.score,9650);
r=await call('/api/runs',{method:'PATCH',body:result,cookie:b.cookie});assert.equal(r.status,404,'Other players cannot save this run');
r=await call('/api/runs',{cookie:a.cookie});assert.equal(r.data.results.length,1);assert.equal(r.data.results[0].id,a.data.id);assert(!('player_id' in r.data.results[0]));
r=await call('/api/runs');assert.deepEqual(r.data.results,[]);
r=await call('/api/leaderboard?mode=action');assert(r.data.results.some(x=>x.id===a.data.id));assert(r.data.results.every(x=>x.mode==='action'));assert(r.data.results.some(x=>x.id===b.data.id));
for(const mode of ['turn','coop']){r=await call('/api/runs',{method:'POST',body:{name:'旧模式',mode}});assert.equal(r.status,400);}
for(const method of ['GET','POST']){r=await call('/api/rooms',{method,body:method==='POST'?{op:'create',name:'玩家'}:undefined});assert.equal(r.status,410);}
r=await call('/api/runs',{method:'POST',body:{name:'<script>',mode:'action'}});assert.equal(r.status,400);
r=await call('/api/runs',{method:'PATCH',cookie:a.cookie,body:{...result,kills:999}});assert.equal(r.status,400);
r=await call('/api/runs',{method:'POST',origin:'https://unrelated.example',body:{name:'拒绝来源',mode:'action'}});assert.equal(r.status,403);
console.log('PASS: persistent result writes and reads, global rankings, action-only creation, retired rooms, own history, idempotent save, ownership, validation and cross-origin rejection.');
