(() => {
'use strict';
const $=id=>document.getElementById(id),draftKey='expedition-unsent-results-v1';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
let nickname=read('expedition-nickname','旅人'),active=null,view='global',mode='action',requestNumber=0;
let queue=read(draftKey,[]);if(!Array.isArray(queue))queue=[];
const input=$('player-name');if(input)input.value=nickname;
async function api(path,options={}){const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});let data;try{data=await response.json();}catch{throw new Error('排行榜暂时无法连接，请稍后重试。');}if(!response.ok)throw new Error(data.error||'暂时无法连接，请稍后重试。');return data;}
function mark(entry,message,retry=false){if(active?.key!==entry.key)return;const status=$('result-save-status');if(status)status.textContent=message;const button=$('retry-result-save');if(button){button.hidden=!retry;button.disabled=false;}}
function remember(entry){const i=queue.findIndex(x=>x.key===entry.key);const saved={key:entry.key,id:entry.id,name:entry.name,mode:entry.mode,result:entry.result};if(i<0)queue.push(saved);else queue[i]=saved;write(draftKey,queue);}
async function connect(entry){const data=await api('/api/runs',{method:'POST',body:JSON.stringify({name:entry.name,mode:entry.mode})});entry.id=data.id;return data.id;}
async function save(entry){if(entry.saving)return;entry.saving=true;mark(entry,'正在保存战绩……');try{
 if(!entry.id){if(entry.starting)await entry.starting.catch(()=>{});if(!entry.id)await connect(entry);remember(entry);}
 const data=await api('/api/runs',{method:'PATCH',body:JSON.stringify({id:entry.id,...entry.result})});queue=queue.filter(x=>x.key!==entry.key);write(draftKey,queue);mark(entry,'战绩已保存 · '+data.result.score+' 分 · 可在全球排行榜查看');
 }catch(error){remember(entry);mark(entry,error.message+' 本次成绩已暂存，可重试。',true);}finally{entry.saving=false;}}
function begin(){const field=$('player-name');nickname=(field?.value||nickname||'旅人').trim().slice(0,16)||'旅人';nickname=nickname.replace(/[<>\x00-\x1f]/g,'')||'旅人';write('expedition-nickname',nickname);active={key:crypto.randomUUID(),name:nickname,mode:'action',id:null};const entry=active;entry.starting=connect(entry);entry.starting.catch(()=>{});}
function finish(result){if(!active)return;active.result=result;remember(active);void save(active);}
function retry(){if(active?.result)void save(active);}
function prettyTime(seconds){return Math.floor(seconds/60)+'分'+seconds%60+'秒';}
function row(item,index){const el=document.createElement('li');el.className='rank-row';
 const rank=document.createElement('b');rank.className='rank-position';rank.textContent=view==='global'?String(index+1).padStart(2,'0'):'✧';
 const player=document.createElement('div');const name=document.createElement('strong');name.textContent=item.name;const detail=document.createElement('small');detail.textContent=(item.mode==='coop'?'双人合作':item.mode==='turn'?'回合':'即时')+' · '+(item.status==='won'?'六关通关':'完成 '+item.cleared+'/6 关')+' · Lv.'+item.level;player.append(name,detail);
 const score=document.createElement('strong');score.className='rank-score';score.textContent=item.score+' 分';
 const pace=document.createElement('span');pace.className='rank-pace';pace.textContent=item.mode==='coop'?item.turns+' 次行动':item.mode==='turn'?item.turns+' 回合':prettyTime(item.seconds);
 const date=document.createElement('small');date.className='rank-date';date.textContent=new Date(item.finishedAt).toLocaleDateString('zh-CN');el.append(rank,player,score,pace,date);return el;}
async function load(){const number=++requestNumber;$('rank-list').replaceChildren();$('rank-message').textContent='正在读取战绩……';$('rank-reload').disabled=true;
 document.querySelectorAll('[data-rank-view]').forEach(b=>{b.classList.toggle('active',b.dataset.rankView===view);b.setAttribute('aria-pressed',String(b.dataset.rankView===view));});
 document.querySelectorAll('[data-rank-mode]').forEach(b=>{b.hidden=view!=='global';b.classList.toggle('active',b.dataset.rankMode===mode);b.setAttribute('aria-pressed',String(b.dataset.rankMode===mode));});
 $('rank-scope').textContent=view==='global'?'全球最佳 30 场远征':'当前浏览器最近 30 场远征';
 try{const data=await api(view==='global'?'/api/leaderboard?mode='+mode:'/api/runs');if(number!==requestNumber)return;
 $('rank-message').textContent=data.results.length?'':view==='global'?'还没有战绩。完成第一场冒险，留下你的名字。':'还没有完成的冒险。每次通关或战败后都会保存战绩。';$('rank-list').replaceChildren(...data.results.map(row));
 }catch(error){if(number===requestNumber)$('rank-message').textContent=error.message;}finally{if(number===requestNumber)$('rank-reload').disabled=false;}
 $('rank-pending').textContent=queue.length?'有 '+queue.length+' 场成绩待上传，点击「补传战绩」重试。':'';$('retry-pending').hidden=!queue.length;
}
$('rank-dialog').addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.rankView){view=b.dataset.rankView;void load();}if(b.dataset.rankMode){mode=b.dataset.rankMode;void load();}});
$('rank-reload').addEventListener('click',()=>void load());
$('retry-pending').addEventListener('click',async()=>{const b=$('retry-pending');b.disabled=true;for(const entry of [...queue])await save(entry);b.disabled=false;void load();});
window.ExpeditionRecords={begin,finish,retry,show(){mode='action';view='global';void load();}};
})();
