(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
const W=1120,H=680, TAU=Math.PI*2;
const {chapters,bosses,zones}=window.MosslightCampaign;
const backgrounds=chapters.map(ch=>{const image=new Image();image.src=ch.image;return image;});
const chapterIndex=()=>Math.floor(area/3);
const MAX_GEAR=12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

const species={
 slime:{name:'苔团',hp:36,atk:9,speed:47,xp:12,gold:10,r:20,color:'#98d49c'},
 bat:{name:'幽光蝠',hp:30,atk:8,speed:75,xp:12,gold:10,r:17,color:'#a5bbeb'},
 wolf:{name:'影狼',hp:63,atk:13,speed:79,xp:18,gold:14,r:23,color:'#8babc7'},
 stone:{name:'遗迹石灵',hp:82,atk:16,speed:39,xp:22,gold:18,r:28,color:'#b6c0a5'},
 wisp:{name:'月影灵',form:'bat',ranged:true,hp:38,atk:11,speed:42,xp:12,gold:14,r:19,color:'#d7c5fb'},
 frostwolf:{name:'霜牙狼',form:'wolf',hp:70,atk:15,speed:103,xp:14,gold:17,r:24,color:'#b5e9f0'},
 sentinel:{name:'符甲哨兵',form:'stone',armored:true,hp:90,atk:16,speed:33,xp:14,gold:17,r:28,color:'#b6ad87'},
 shade:{name:'噬光团',form:'slime',drain:true,hp:58,atk:14,speed:62,xp:13,gold:16,r:24,color:'#d6a5e4'},
 boss:{name:'古林守卫',hp:620,atk:25,speed:42,xp:80,gold:100,r:56,color:'#a4d28b'}
};
const freshHero=()=>({x:W/2,y:H/2+30,hp:120,maxHp:120,atk:18,def:3,level:1,xp:0,nextXp:36,gold:0,kills:0,potions:3,skillPower:1,weapon:0,armor:0,facing:1,invuln:0,swing:0,attackCd:0,skillCd:0,dashCd:0,guard:false});
let hero=freshHero(), state='title',mode='action',area=0,wave=0,enemies=[],effects=[],floaters=[],pendingLevels=0;
let keys=new Set(),pointer=null,clock=0,elapsed=0,turns=0,last=0,toastTimer=0,transition=0,areaKills=0,shake=0,muted=true,audio=null,helpPaused=false;
let camera={x:0,y:0,scale:1},revision=0,checkpoint=null,projectiles=[];
const gearNames={weapon:['旅人的短剑','符纹长剑','月辉之刃','星陨圣剑'],armor:['苔色斗篷','林卫轻甲','秘银护甲','古树圣铠']};
function gearName(kind){const rank=hero[kind];return rank===0?gearNames[kind][0]:gearNames[kind][Math.min(3,Math.ceil(rank/4))]+' · '+rank+'阶';}
function gearLimit(){return Math.min(MAX_GEAR,area+2);}
function shopCosts(){return{weapon:60+30*hero.weapon,armor:50+25*hero.armor,potion:30+10*chapterIndex()};}
$('journey-list').innerHTML=zones.map((z,i)=>'<li id=stage-node-'+i+'><b>'+String(i+1).padStart(2,'0')+'</b><span>'+z.name+'</span><small>'+(z.boss!==undefined?'首领关':'3 波战斗')+'</small></li>').join('');
let journal=['风里传来了森林的低语。'];
const initialOverlay=$('overlay').innerHTML;
function sound(kind){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);const tones={attack:[330,110,.09],hit:[190,70,.12],level:[523,1046,.4],skill:[260,900,.3],gold:[880,1200,.1],hurt:[140,75,.15]};const [a,b,d]=tones[kind]||tones.hit;o.type=kind==='hurt'?'sawtooth':'sine';o.frequency.setValueAtTime(a,audio.currentTime);o.frequency.exponentialRampToValueAtTime(b,audio.currentTime+d);g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.start();o.stop(audio.currentTime+d);}catch{}}
function log(text){journal.unshift(text);journal=journal.slice(0,4);$('journal').replaceChildren(...journal.map((t,i)=>{const li=document.createElement('li');if(i>1)li.className='muted';const s=document.createElement('span');s.textContent=i===0?'✧':'·';li.append(s,document.createTextNode(t));return li;}));}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');toastTimer=2.5;}
function float(text,x,y,color='#e9f0cf',size=22){floaters.push({text,x,y,color,size,life:1.1,max:1.1});}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){let a=Math.random()*TAU,s=35+Math.random()*100;effects.push({type:'particle',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,color,life:.5+Math.random()*.4,max:.9});}}
function ring(x,y,r,color,life=.5){effects.push({type:'ring',x,y,r,color,life,max:life});}
function showOverlay(html){keys.clear();pointer=null;$('overlay').hidden=false;$('overlay').innerHTML='<div class="modal-card">'+html+'</div>';sync();const first=$('overlay').querySelector('button:not(:disabled)');if(first)first.focus({preventScroll:true});}
function hideOverlay(){$('overlay').hidden=true;canvas.focus({preventScroll:true});sync();}
function totalArea(){return zones[area].waves.flat().length;}
function sync(){
 revision++;
 $('level').textContent=hero.level;$('health-label').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;$('health-bar').style.width=(100*hero.hp/hero.maxHp)+'%';
 $('xp-label').textContent=hero.xp+' / '+hero.nextXp;$('xp-bar').style.width=(100*hero.xp/hero.nextXp)+'%';
 $('attack-stat').textContent=hero.atk;$('defense-stat').textContent=hero.def;$('gold-stat').textContent=hero.gold;$('kills-stat').textContent=hero.kills;
 $('potion-count').textContent='× '+hero.potions;
 $('weapon-name').textContent=gearName('weapon');$('weapon-description').textContent=hero.weapon?'每次强化增加 8 点攻击':'平凡的起点，不平凡的旅程';
 $('armor-name').textContent=gearName('armor');$('armor-description').textContent=hero.armor?'每次强化：防御 +3，生命 +20':'森林会庇护勇敢的人';
 document.querySelector('.rarity').textContent=hero.weapon?'强化 +'+hero.weapon:'初始';$('armor-rarity').textContent=hero.armor?'强化 +'+hero.armor:'初始';
 $('location-title').textContent=zones[area].name;$('location-subtitle').textContent='第 '+(area+1)+' / '+zones.length+' 关 · '+zones[area].sub;
 $('quest-title').textContent=zones[area].quest;$('quest-description').textContent=zones[area].description;
 const pct=Math.min(100,Math.round(areaKills/totalArea()*100));$('quest-count').textContent=state==='title'?'等待出发':'清除魔物 '+Math.min(areaKills,totalArea())+' / '+totalArea();$('quest-percent').textContent=pct+'%';$('quest-bar').style.width=pct+'%';
 $('reward-label').textContent=zones[area].reward+' 金币 · 生命补给';
 for(let i=0;i<chapters.length;i++)$('zone-chip-'+i).className=state==='won'||i<chapterIndex()||(state==='camp'&&i===chapterIndex()&&(area+1)%3===0)?'complete':i===chapterIndex()?'active':'';
 for(let i=0;i<zones.length;i++)$('stage-node-'+i).className=state==='won'||i<area||(state==='camp'&&i===area)?'cleared':i===area?'current':'';
 $('journey-progress').textContent='第 '+(area+1)+' / '+zones.length+' 关 · '+zones[area].name;
 $('campaign-progress').textContent='第 '+(chapterIndex()+1)+' 章 · 已完成 '+(area+(['camp','won'].includes(state)?1:0))+' / '+zones.length+' 关';
 $('mode-badge').textContent=mode==='action'?'即时动作':'回合战斗';
 $('dash-title').innerHTML=mode==='turn'?'防守<kbd>E</kbd>':'疾风步<kbd>E</kbd>';
 $('wave-info').hidden=state==='title'||state==='won';$('wave-label').textContent='第 '+(wave+1)+' 波 / '+zones[area].waves.length;$('wave-progress').textContent=enemies.length?'剩余 '+enemies.length+' 只魔物':'林间重新归于宁静';
 const boss=enemies.find(e=>e.type==='boss');$('boss-hud').hidden=!boss;if(boss){$('boss-health').style.width=(100*boss.hp/boss.maxHp)+'%';$('boss-name').textContent=boss.name+(boss.enraged?' · 狂暴':'');}
 const labels={title:['准备好出发了吗','选择你的战斗方式'],running:[mode==='turn'?'轮到你了 · 第 '+(turns+1)+' 回合':'远征进行中',mode==='turn'?'每次行动，敌人随后出招':'走位躲避，靠近后挥剑'],paused:['冒险暂歇','森林会等你回来'],upgrade:['微光汇聚，力量觉醒','选择一项成长'],camp:['营地时光','补充装备，继续向前'],dead:['远征暂时结束','重新出发，还有新的可能'],won:['森林重获微光','你的故事被森林记住了'],transition:['道路正在显现','下一波魔物即将出现']};
 const l=labels[state]||labels.running;$('turn-title').textContent=l[0];$('turn-subtitle').textContent=l[1];
 updateButtons();
}
function updateButtons(){const active=state==='running';$('attack').disabled=!active||hero.attackCd>0;$('skill').disabled=!active||hero.skillCd>0;$('dash').disabled=!active||(mode==='action'&&hero.dashCd>0);$('potion').disabled=!active||hero.potions<=0||hero.hp>=hero.maxHp;$('pause').disabled=!['running','paused','transition'].includes(state);$('skill-cd').textContent=hero.skillCd>0?(mode==='turn'?Math.ceil(hero.skillCd)+'回合':Math.ceil(hero.skillCd)+'s'):'';$('dash-cd').textContent=mode==='action'&&hero.dashCd>0?Math.ceil(hero.dashCd)+'s':'';}
function start(selected=mode){
 mode=selected;hero=freshHero();area=0;wave=0;enemies=[];effects=[];floaters=[];projectiles=[];checkpoint=null;pendingLevels=0;areaKills=0;elapsed=0;turns=0;transition=0;state='running';journal=[];log('踏入微光林地，远征开始了。');hideOverlay();saveCheckpoint();spawnWave();toast(mode==='turn'?'回合模式：每次出招后，敌人才会行动':'WASD 移动 · 空格挥剑 · Q 星芒斩');sync();
}
function saveCheckpoint(){checkpoint={hero:{...hero},area,elapsed,turns,journal:[...journal]};}
function retryStage(){if(state!=='dead'||!checkpoint)return false;hero={...checkpoint.hero};area=checkpoint.area;elapsed=checkpoint.elapsed;turns=checkpoint.turns;journal=[...checkpoint.journal];wave=0;areaKills=0;pendingLevels=0;enemies=[];projectiles=[];effects=[];floaters=[];transition=0;state='running';hideOverlay();spawnWave();log('重新挑战第 '+(area+1)+' 关：'+zones[area].name);return true;}
function createEnemy(type,i,count){
 const base=species[type],angle=TAU*i/count+.6,d=area,ch=chapterIndex();
 const hpBase=45+25*d+6*d*d,ratios={slime:.8,bat:.66,wolf:1,stone:1.35,wisp:.78,frostwolf:1.08,sentinel:1.45,shade:.96};
 let hp=Math.round(hpBase*(ratios[type]||1)*(mode==='action'?1.8:1));
 let atk=Math.round((10+6*d)*({bat:.82,slime:.9,stone:1.14,sentinel:1.18,wisp:.92}[type]||1));
 const b=type==='boss'?bosses[zones[area].boss]:null;
 if(b){hp=Math.round(b.hp*(mode==='action'?2.2:1));atk=b.atk;}
 const e={...base,...(b||{}),type,id:Math.random().toString(36).slice(2),x:W/2+Math.cos(angle)*340,y:H/2+Math.sin(angle)*195,maxHp:hp,hp,atk,xp:b?50+ch*20:10+ch*2,gold:b?120+ch*60:12+d*2,cd:.6+i*.2,hit:0,phase:Math.random()*TAU,windup:0,bossCd:3,bossTurn:0,marked:null,tacticalCd:1+i%2,enraged:false};
 if(type==='frostwolf')e.speed=103;if(b?.pattern==='frost')e.speed=83;
 return e;
}
function spawnWave(){
 state='running';transition=0;projectiles=[];const list=zones[area].waves[wave];enemies=list.map((type,i)=>createEnemy(type,i,list.length));
 const boss=enemies.find(e=>e.type==='boss');
 if(boss){hero.x=W/2;hero.y=H/2+150;boss.x=W/2;boss.y=200;log(boss.name+'出现了。'+boss.hint);toast(boss.hint);}
 else toast('第 '+(area+1)+' / '+zones.length+' 关 · '+zones[area].name+' · 第 '+(wave+1)+' 波');sync();
}
function warningCircles(e){
 const r=mode==='turn'?62:112,x=hero.x,y=hero.y;let points=[{x,y,r}];
 if(e.pattern==='cross')points.push({x:x-145,y,r},{x:x+145,y,r});
 if(e.pattern==='frost')points.push({x:x-150,y:y-115,r:r*.8},{x:x+150,y:y-115,r:r*.8});
 if(e.pattern==='night'){points.push({x:clamp(x+165,80,W-80),y:clamp(y-110,100,H-80),r:r*.8},{x:clamp(x-165,80,W-80),y:clamp(y+110,100,H-80),r:r*.8});}
 return points;
}
function bossStrike(e){
 if(!e.marked)return;
 const hit=e.marked.some(p=>dist(hero,p)<p.r);for(const p of e.marked){ring(p.x,p.y,p.r,e.color,.65);burst(p.x,p.y,e.color,15);}
 if(hit)damageHero(e.atk*(e.enraged?1.8:1.5));e.marked=null;e.vulnerable=mode==='turn'?1:1.3;
}
function enemyHit(e){const dealt=damageHero(e.atk);if(e.drain&&dealt>0){e.hp=Math.min(e.maxHp,e.hp+Math.round(dealt*.5));float('汲取',e.x,e.y-35,e.color,14);}}

function nearest(){return enemies.reduce((a,e)=>!a||dist(hero,e)<dist(hero,a)?e:a,null);}
function moveHero(dx,dy,amount){const len=Math.hypot(dx,dy);if(!len)return;hero.x=clamp(hero.x+dx/len*amount,78,W-78);hero.y=clamp(hero.y+dy/len*amount,105,H-65);if(dx)hero.facing=dx>0?1:-1;}
function damageEnemy(e,amount){if(!enemies.includes(e))return;const crit=Math.random()<.1,dmg=Math.round(amount*(crit?1.5:1)*(e.armored?.8:1)*(e.vulnerable>0?1.2:1));e.hp-=dmg;e.hit=.18;float((crit?'暴击 ':'')+dmg,e.x,e.y-e.r-6,crit?'#ffe4a2':'#f2f4db',crit?25:21);burst(e.x,e.y,e.color,5);sound('hit');if(e.hp<=0){enemies=enemies.filter(x=>x!==e);hero.kills++;areaKills++;hero.gold+=e.gold;hero.xp+=e.xp;float('+'+e.xp+' 经验',e.x,e.y+12,'#96ded4',16);burst(e.x,e.y,'#d4eca0',18);while(hero.xp>=hero.nextXp){hero.xp-=hero.nextXp;hero.level++;hero.maxHp+=20;hero.hp=hero.maxHp;hero.atk+=3;hero.def++;hero.nextXp=36+(hero.level-1)*18;pendingLevels++;}if(e.type==='boss')log(e.name+'倒下，第 '+(chapterIndex()+1)+' 章的暗影消散。');}sync();}
function damageHero(amount){if(state!=='running'||hero.invuln>0)return 0;const dmg=Math.max(1,Math.round((amount-hero.def)*(hero.guard?.3:1)));hero.hp=Math.max(0,hero.hp-dmg);hero.invuln=mode==='action'?.65:0;shake=5;float('-'+dmg,hero.x,hero.y-40,'#ffb5a7',24);burst(hero.x,hero.y,'#e28d81',7);sound('hurt');if(hero.hp<=0)finish(false);sync();return dmg;}
function action(kind){if(state!=='running')return false;
 if(kind==='attack'){
  if(hero.attackCd>0)return false;const target=nearest();if(!target)return false;
  if(mode==='turn'&&dist(hero,target)>105){const d=dist(hero,target);moveHero(target.x-hero.x,target.y-hero.y,Math.min(d-75,290));}
  const target2=nearest();if(target2)hero.facing=target2.x>=hero.x?1:-1;hero.swing=.25;hero.attackCd=mode==='action'?.43:0;sound('attack');
  const hit=enemies.filter(e=>dist(hero,e)<115+e.r);hit.forEach(e=>damageEnemy(e,hero.atk));ring(hero.x+hero.facing*32,hero.y,75,'#ecf8b9',.25);
  if(!hit.length)toast(mode==='turn'?'向最近的敌人靠近了一步':'再靠近一点，剑就能击中它');
 }else if(kind==='skill'){
  if(hero.skillCd>0){toast('星芒斩还在恢复');return false;}hero.skillCd=mode==='turn'?4:5.5;
  const target=nearest();if(mode==='turn'&&target&&dist(hero,target)>185)moveHero(target.x-hero.x,target.y-hero.y,Math.min(240,dist(hero,target)-130));
  ring(hero.x,hero.y,205,'#8ee5ce',.6);burst(hero.x,hero.y,'#b0ffe2',36);sound('skill');enemies.filter(e=>dist(hero,e)<205+e.r).forEach(e=>damageEnemy(e,hero.atk*2.25*hero.skillPower));
 }else if(kind==='dash'){
  if(mode==='turn'){hero.guard=true;hero.hp=Math.min(hero.maxHp,hero.hp+5);ring(hero.x,hero.y,55,'#9cd6f1');toast('凝神防守：本回合减伤 70%，回复 5 生命');}
  else{if(hero.dashCd>0)return false;const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);burst(hero.x,hero.y,'#c3e9e7',20);const vx=dx||dy?dx:pointer?pointer.x-hero.x:hero.facing,vy=dx||dy?dy:pointer?pointer.y-hero.y:0;moveHero(vx,vy,165);hero.invuln=.5;hero.dashCd=2.8;ring(hero.x,hero.y,38,'#b0e4e4',.3);}
 }else if(kind==='potion'){
  if(!hero.potions||hero.hp>=hero.maxHp){toast(hero.potions?'现在不需要生命药水':'药水用完了，营地可以补给');return false;}hero.potions--;const heal=Math.min(hero.maxHp-hero.hp,Math.round(hero.maxHp*.5));hero.hp+=heal;float('+'+heal,hero.x,hero.y-45,'#bcef9d',26);ring(hero.x,hero.y,55,'#bee997');sound('gold');log('使用生命药水，回复 '+heal+' 点生命。');
 }else return false;
 if(mode==='turn')enemyTurn(kind);
 resolveProgress();sync();return true;
}
function tacticalMove(dx,dy){if(state!=='running'||mode!=='turn')return false;moveHero(dx,dy,85);enemyTurn('move');resolveProgress();sync();return true;}
function enemyTurn(kind){
 turns++;if(kind!=='skill')hero.skillCd=Math.max(0,hero.skillCd-1);let attacks=0;
 for(const e of [...enemies].sort((a,b)=>dist(a,hero)-dist(b,hero))){
  if(state!=='running')break;e.vulnerable=Math.max(0,(e.vulnerable||0)-1);
  if(e.type==='boss'){
   e.bossTurn++;if(e.pattern==='night'&&e.hp<e.maxHp*.5&&!e.enraged){e.enraged=true;toast('永夜树王狂暴！注意预警，及时补给。');}
   if(e.marked){bossStrike(e);continue;}
   if(e.bossTurn%(e.enraged?2:3)===0){e.marked=warningCircles(e);toast(e.ability+'蓄力：下一回合移动或防守');continue;}
  }
  const d=dist(e,hero),reach=e.r+30;
  if(e.ranged&&d<270){e.tacticalCd--;if(e.tacticalCd<=0&&attacks<2){enemyHit(e);e.tacticalCd=2;attacks++;ring(hero.x,hero.y,30,e.color,.25);}continue;}
  if(d>reach){const step=Math.min(d-reach+2,e.type==='boss'?62:e.type==='frostwolf'?85:65);e.x+=((hero.x-e.x)/d)*step;e.y+=((hero.y-e.y)/d)*step;}
  if(dist(e,hero)<reach+8&&(e.type==='boss'||attacks<2)){enemyHit(e);if(e.type!=='boss')attacks++;}
 }
 hero.guard=false;
}
function resolveProgress(){if(state!=='running')return;if(pendingLevels>0){levelChoice();return;}if(enemies.length===0){if(wave<zones[area].waves.length-1){state='transition';transition=1.5;toast('这一波清除完毕 · 准备迎接下一波');sync();}else completeArea();}}
function levelChoice(){state='upgrade';sound('level');log('升至 '+hero.level+' 级！生命已完全恢复。');showOverlay('<span class="intro-symbol">✧</span><p class="eyebrow">LEVEL UP · '+hero.level+'</p><h2>微光，回应了你。</h2><p>生命已回满。选择一项强化，继续成长。</p><div class="upgrade-list"><button data-upgrade="power"><span class="upgrade-icon">⚔</span><span><strong>利刃之心</strong><small>攻击力永久 +7，每一次挥剑更有力量</small></span></button><button data-upgrade="vitality"><span class="upgrade-icon">♡</span><span><strong>古树庇护</strong><small>最大生命 +30，防御 +2</small></span></button><button data-upgrade="magic"><span class="upgrade-icon">✺</span><span><strong>星芒共鸣</strong><small>星芒斩伤害倍率 +35 个百分点</small></span></button></div>');}
function upgrade(type){if(state!=='upgrade'||!['power','vitality','magic'].includes(type))return;if(type==='power')hero.atk+=7;if(type==='vitality'){hero.maxHp+=30;hero.hp=hero.maxHp;hero.def+=2;}if(type==='magic')hero.skillPower+=.35;pendingLevels--;state='running';hideOverlay();ring(hero.x,hero.y,100,'#daf3ab',.9);resolveProgress();sync();}
function completeArea(){hero.gold+=zones[area].reward;hero.hp=hero.maxHp;hero.potions=Math.min(9,hero.potions+1);hero.skillCd=0;hero.dashCd=0;log(zones[area].name+'已净化，获得 '+zones[area].reward+' 金币。');if(area===zones.length-1){finish(true);return;}state='camp';showCamp();}
function showCamp(){
 const cost=shopCosts(),limit=gearLimit();
 showOverlay('<span class="intro-symbol">♧</span><p class="eyebrow">第 '+(area+1)+' / '+zones.length+' 关已完成</p><h2>篝火旁，歇一歇。</h2><p>'+zones[area].name+'已净化。生命回满，药水 +1。</p><p class="shop-balance">金币 <b>'+hero.gold+'</b> · 当前可强化至 '+limit+' 阶 / 上限 '+MAX_GEAR+' 阶</p><div class="shop-grid"><button data-buy="weapon" '+(hero.gold<cost.weapon||hero.weapon>=limit?'disabled':'')+'>⚔ 强化武器 · 攻击 +8<small>'+(hero.weapon>=limit?'当前强化已满':cost.weapon+' 金币 · 当前 '+hero.weapon+' 阶')+'</small></button><button data-buy="armor" '+(hero.gold<cost.armor||hero.armor>=limit?'disabled':'')+'>♜ 强化护甲 · 防御 +3<small>'+(hero.armor>=limit?'当前强化已满':cost.armor+' 金币 · 生命 +20')+'</small></button><button data-buy="potion" '+(hero.gold<cost.potion||hero.potions>=9?'disabled':'')+'>♥ 生命药水 +1<small>'+(hero.potions>=9?'药水已满':cost.potion+' 金币 · 回复 50% 生命')+'</small></button><button data-buy="rest" disabled>✧ 休整完毕<small>生命 '+hero.hp+' / '+hero.maxHp+'</small></button></div><button class="primary" data-next>第 '+(area+2)+' 关 · '+zones[area+1].name+'</button>');
}
function buy(item){if(state!=='camp')return false;const costs=shopCosts(),limit=gearLimit();if(!costs[item]||hero.gold<costs[item]||(item==='weapon'&&hero.weapon>=limit)||(item==='armor'&&hero.armor>=limit)||(item==='potion'&&hero.potions>=9))return false;hero.gold-=costs[item];if(item==='weapon'){hero.atk+=8;hero.weapon++;log('武器升至 '+hero.weapon+' 阶，攻击力 +8。');}if(item==='armor'){hero.def+=3;hero.maxHp+=20;hero.hp=hero.maxHp;hero.armor++;log('护甲升至 '+hero.armor+' 阶，防御 +3。');}if(item==='potion')hero.potions++;sound('gold');showCamp();sync();return true;}

function nextArea(){if(state!=='camp')return;area++;wave=0;areaKills=0;hero.x=W/2;hero.y=H/2+30;state='running';hideOverlay();saveCheckpoint();spawnWave();log('抵达'+zones[area].name+'。新的挑战正在等待。');}
function finish(won){state=won?'won':'dead';keys.clear();pointer=null;projectiles=[];showOverlay('<span class="intro-symbol">'+(won?'✧':'◇')+'</span><p class="eyebrow">'+(won?'十二关远征 · 全部完成':'第 '+(area+1)+' / '+zones.length+' 关')+'</p><h2>'+(won?'长夜尽头，微光重生。':'稍作休息，再出发。')+'</h2><p>'+(won?'你穿过林地、遗迹、霜境与永夜，击败了四位首领。<br>所有十二处秘境，都重新迎来了光。':'这次的脚步停在了'+zones[area].name+'。<br>可以带着进入本关时的装备与等级，重新挑战。')+'</p><div class="result-stats"><div><b>'+hero.level+'</b><span>冒险等级</span></div><div><b>'+hero.kills+'</b><span>击败魔物</span></div><div><b>'+(won?zones.length:area)+' / '+zones.length+'</b><span>已通关</span></div></div>'+(won?'<button class="primary" data-restart>再来一场远征</button>':'<button class="primary" data-retry>重试第 '+(area+1)+' 关</button>')+'<button class="secondary" data-title>返回开始界面</button>');if(won)sound('level');sync();}

let beforePause='running';
function togglePause(){if(state==='paused'){state=beforePause;hideOverlay();}else if(state==='running'||state==='transition'){beforePause=state;state='paused';showOverlay('<span class="intro-symbol">☾</span><p class="eyebrow">TAKE YOUR TIME</p><h2>森林会等你。</h2><p>准备好了，再继续这一段旅程。</p><button class="primary" data-resume>继续冒险</button><button class="secondary" data-confirm-restart>重新开始</button>');}sync();}
function showTitle(){state='title';hero=freshHero();enemies=[];effects=[];floaters=[];projectiles=[];checkpoint=null;area=0;wave=0;areaKills=0;keys.clear();pointer=null;$('overlay').innerHTML=initialOverlay;$('overlay').hidden=false;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));sync();}
$('overlay').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mode){mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b));sync();}else if(b.id==='start'||b.hasAttribute('data-restart'))start();else if(b.hasAttribute('data-retry'))retryStage();else if(b.dataset.upgrade)upgrade(b.dataset.upgrade);else if(b.dataset.buy)buy(b.dataset.buy);else if(b.hasAttribute('data-next'))nextArea();else if(b.hasAttribute('data-resume'))togglePause();else if(b.hasAttribute('data-title'))showTitle();else if(b.hasAttribute('data-confirm-restart'))showOverlay('<h2>重新开始远征？</h2><p>本次等级与装备将重置。</p><button class="primary" data-restart>重新开始</button><button class="secondary" data-resume>继续当前远征</button>');});
for(const name of ['attack','skill','dash','potion'])$(name).addEventListener('click',()=>action(name));
$('pause').addEventListener('click',togglePause);
$('sound').addEventListener('click',()=>{muted=!muted;$('sound').innerHTML='♪<span>音效'+(muted?'关':'开')+'</span>';$('sound').setAttribute('aria-label',muted?'开启音效':'关闭音效');$('sound').title=muted?'开启音效':'关闭音效';if(!muted)sound('gold');});
$('help').onclick=()=>{helpPaused=state==='running'||state==='transition';if(helpPaused)togglePause();$('help-dialog').showModal();};
const closeHelp=()=>$('help-dialog').close();$('close-help').onclick=closeHelp;$('help-ok').onclick=closeHelp;
$('help-dialog').addEventListener('close',()=>{if(helpPaused&&state==='paused')togglePause();helpPaused=false;});
const keyActions={' ':'attack',q:'skill',e:'dash',f:'potion'};
const directions={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if($('help-dialog').open)return;if(k==='escape'){e.preventDefault();togglePause();return;}if(state!=='running')return;if(directions[k]||keyActions[k]){e.preventDefault();if(e.target instanceof HTMLElement&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(directions[k]){keys.add(k);if(mode==='turn'&&!e.repeat)tacticalMove(...directions[k]);}else if(!e.repeat||(mode==='action'&&k===' '))action(keyActions[k]);}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function loseFocus(){keys.clear();pointer=null;if(state==='running'||state==='transition')togglePause();}
window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/camera.scale+camera.x,y:(e.clientY-r.top)/camera.scale+camera.y};}
canvas.addEventListener('pointerdown',e=>{if(state!=='running')return;e.preventDefault();canvas.focus({preventScroll:true});const p=point(e);if(mode==='turn'){tacticalMove(p.x-hero.x,p.y-hero.y);}else{pointer=p;canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(pointer)pointer=point(e);});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
const moveKeys={up:'w',down:'s',left:'a',right:'d'};
for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='running')return;b.setPointerCapture(e.pointerId);const k=moveKeys[b.dataset.move];if(mode==='turn')tacticalMove(...directions[k]);else keys.add(k);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(moveKeys[b.dataset.move]));}
function update(dt){
 clock+=dt;if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
 for(const f of floaters){f.life-=dt;f.y-=dt*32;}floaters=floaters.filter(f=>f.life>0);
 for(const f of effects){f.life-=dt;if(f.type==='particle'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.97;f.vy*=.97;}}effects=effects.filter(f=>f.life>0);
 shake=Math.max(0,shake-dt*20);hero.swing=Math.max(0,hero.swing-dt);for(const e of enemies)e.hit=Math.max(0,e.hit-dt);
 if(state==='transition'){transition-=dt;if(transition<=0){wave++;spawnWave();}return;}
 if(state!=='running')return;elapsed+=dt;if(mode==='turn')return;
 hero.invuln=Math.max(0,hero.invuln-dt);hero.attackCd=Math.max(0,hero.attackCd-dt);hero.skillCd=Math.max(0,hero.skillCd-dt);hero.dashCd=Math.max(0,hero.dashCd-dt);
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 if(pointer&&!dx&&!dy){dx=pointer.x-hero.x;dy=pointer.y-hero.y;if(Math.hypot(dx,dy)<6){pointer=null;dx=dy=0;}}
 if(dx||dy)moveHero(dx,dy,205*dt);if(keys.has(' '))action('attack');
 for(const e of enemies){
  if(state!=='running')break;e.cd-=dt;e.vulnerable=Math.max(0,(e.vulnerable||0)-dt);
  if(e.type==='boss'){
   if(e.pattern==='night'&&e.hp<e.maxHp*.5&&!e.enraged){e.enraged=true;e.speed*=1.3;toast('永夜树王进入狂暴！蓄力更快了。');sync();}
   e.bossCd-=dt;
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){bossStrike(e);e.bossCd=e.enraged?2.2:3.8;e.cd=1;}continue;}
   if(e.bossCd<=0){e.windup=e.enraged?.85:1.15;e.marked=warningCircles(e);continue;}
  }
  const d=dist(e,hero),reach=e.r+20;
  if(e.ranged&&d<360){if(e.cd<=0){const a=Math.atan2(hero.y-e.y,hero.x-e.x);projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,atk:e.atk,life:3,color:e.color});e.cd=2.1;ring(e.x,e.y,23,e.color,.3);}continue;}
  if(d>reach){e.x+=(hero.x-e.x)/d*e.speed*dt;e.y+=(hero.y-e.y)/d*e.speed*dt;}
  if(d<reach+7&&e.cd<=0){enemyHit(e);e.cd=e.type==='boss'?1.4:1.15;}
 }
 if(state==='running'){for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(dist(p,hero)<21){damageHero(p.atk);p.life=0;}}projectiles=projectiles.filter(p=>p.life>0&&p.x>0&&p.x<W&&p.y>0&&p.y<H);}
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j],d=dist(a,b),min=(a.r+b.r)*.8;if(d<min&&d>.01){const push=(min-d)*.4,nx=(a.x-b.x)/d,ny=(a.y-b.y)/d;a.x=clamp(a.x+nx*push,55,W-55);a.y=clamp(a.y+ny*push,90,H-45);b.x=clamp(b.x-nx*push,55,W-55);b.y=clamp(b.y-ny*push,90,H-45);}}
 updateButtons();
}

function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function drawHero(){
 const h=hero,bob=state==='running'?Math.sin(clock*8)*1.7:Math.sin(clock*2)*1.1;ctx.save();ctx.translate(h.x,h.y);ellipse(0,16,22,8,'#061c22aa');
 if(h.invuln>0){ctx.strokeStyle='#b8edf1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-5,33,0,TAU);ctx.stroke();}
 ctx.translate(0,bob);ctx.scale(h.facing,1);
 // Compact pixel sprite; gameplay actor rendered at world coordinates.
 rect(-12,3,9,16,'#21373c');rect(4,3,8,16,'#21373c');rect(-15,16,12,5,'#b7b2a0');rect(3,16,13,5,'#b7b2a0');
 rect(-19,-17,37,27,'#203e40');rect(-16,-19,29,27,'#507d69');rect(-12,-17,25,23,'#71977b');rect(-13,-17,7,26,'#8eaf86');
 rect(-14,-36,27,24,'#2b3235');rect(-16,-35,30,11,'#d5d8ba');rect(-18,-30,7,16,'#a2b4a1');rect(-11,-25,22,15,'#e5c9a3');rect(-4,-24,3,4,'#283b37');rect(7,-24,3,4,'#283b37');rect(-5,-13,15,4,'#c1a179');
 rect(-14,-39,26,6,'#94bd7f');rect(-5,-43,7,6,'#c5e69c');rect(-20,-27,7,9,'#a0b889');
 rect(-15,0,29,4,'#aa9870');rect(-2,-1,7,6,'#e5c98f');rect(-23,-11,8,17,'#496958');rect(-24,4,9,7,'#dfc29c');
 ctx.save();ctx.translate(21,0);ctx.rotate(h.swing>0?-1.5+2.7*(1-h.swing/.25):.22);rect(-3,-5,6,16,'#ad9060');rect(-10,-9,20,5,'#b6c49f');rect(-3,-38,6,29,'#dcecc8');rect(-1,-40,3,28,'#fbffe5');ctx.restore();
 ctx.restore();
 ctx.font='12px "Noto Sans SC",sans-serif';ctx.textAlign='center';ctx.fillStyle='#e8f1cc';ctx.shadowColor='#092523';ctx.shadowBlur=5;ctx.fillText('旅林者',h.x,h.y-49);ctx.shadowBlur=0;
 ctx.strokeStyle='#c3e6a077';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(h.x,h.y+21,27,12,0,0,TAU);ctx.stroke();
}
function drawEnemy(e){
 const kind=e.form||e.type;const bob=Math.sin(clock*(kind==='bat'?8:3)+e.phase)*3;ctx.save();ctx.translate(e.x,e.y);ellipse(0,e.r*.5,e.r*.95,e.r*.35,'#071c22aa');ctx.translate(0,bob);if(e.hit>0)ctx.globalAlpha=.62;
 if(e.type==='boss'&&kind!=='boss')ctx.scale(1.9,1.9);
 if(e.type==='wisp'||e.type==='shade'||e.pattern==='night')ctx.filter='hue-rotate(125deg)';
 if(e.type==='frostwolf'||e.pattern==='frost')ctx.filter='hue-rotate(20deg) brightness(1.3)';
 if(kind==='slime'){
  const g=ctx.createLinearGradient(0,-22,0,17);g.addColorStop(0,'#b4e9b7');g.addColorStop(1,'#4d9b78');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-24,9);ctx.bezierCurveTo(-28,-24,-3,-31,13,-18);ctx.bezierCurveTo(26,-10,31,11,18,16);ctx.bezierCurveTo(4,21,-16,21,-24,9);ctx.fill();ellipse(-10,-13,7,4,'#deffe17a');rect(-9,-2,4,6,'#173d35');rect(8,-2,4,6,'#173d35');rect(-2,7,6,2,'#2d6853');
 }else if(kind==='bat'){
  ctx.fillStyle='#91a9d0';const flap=Math.sin(clock*12+e.phase)*10;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-34,-17-flap);ctx.lineTo(-27,8);ctx.lineTo(-18,1);ctx.lineTo(-10,13);ctx.lineTo(0,8);ctx.lineTo(10,13);ctx.lineTo(18,1);ctx.lineTo(27,8);ctx.lineTo(34,-17-flap);ctx.lineTo(5,0);ctx.fill();ellipse(0,-1,10,15,'#bbcdeb');rect(-8,-18,5,10,'#bbcae1');rect(3,-18,5,10,'#bbcae1');rect(-6,-4,3,4,'#343f69');rect(3,-4,3,4,'#343f69');
 }else if(kind==='wolf'){
  ctx.scale(e.x>hero.x?-1:1,1);rect(-22,-8,34,20,'#688c9f');rect(-18,-15,28,12,'#94afbb');rect(5,-25,23,26,'#95b3c2');rect(22,-11,13,10,'#bac7c8');rect(28,-10,8,5,'#283e4c');rect(7,-34,7,14,'#557b8e');rect(23,-32,6,11,'#557b8e');rect(21,-21,5,4,'#ddf29a');rect(-18,9,8,14,'#527b91');rect(5,9,8,14,'#527b91');rect(-32,-14,15,7,'#7da5b5');rect(-37,-20,8,12,'#a5bdc4');
 }else if(kind==='stone'){
  ctx.fillStyle='#6b8f89';ctx.beginPath();ctx.moveTo(-25,16);ctx.lineTo(-29,-7);ctx.lineTo(-17,-29);ctx.lineTo(13,-31);ctx.lineTo(28,-12);ctx.lineTo(24,17);ctx.lineTo(0,26);ctx.closePath();ctx.fill();ctx.fillStyle='#9daf9b';ctx.beginPath();ctx.moveTo(-17,-29);ctx.lineTo(10,-31);ctx.lineTo(15,-8);ctx.lineTo(-7,4);ctx.lineTo(-24,-6);ctx.closePath();ctx.fill();rect(-32,1,10,18,'#587e77');rect(24,-2,10,19,'#587e77');rect(-16,19,11,10,'#526e67');rect(7,18,11,10,'#526e67');rect(-11,-8,7,5,'#d9f2a3');rect(7,-9,7,5,'#d9f2a3');rect(-3,4,6,10,'#c4eaa0');
 }else{
  // Boss silhouette and glowing attack core.
  ctx.strokeStyle='#647c54';ctx.lineWidth=9;ctx.lineCap='round';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*21,-29);ctx.lineTo(side*39,-59);ctx.lineTo(side*29,-78);ctx.moveTo(side*37,-57);ctx.lineTo(side*60,-67);ctx.lineTo(side*61,-82);ctx.stroke();rect(side<0?-60:34,-1,25,48,'#607755');rect(side<0?-57:36,27,22,27,'#87a66a');rect(side<0?-34:12,41,23,24,'#687b53');}
  ctx.fillStyle='#63866a';ctx.beginPath();ctx.moveTo(-37,41);ctx.lineTo(-42,-22);ctx.lineTo(-24,-43);ctx.lineTo(27,-43);ctx.lineTo(44,-16);ctx.lineTo(36,44);ctx.lineTo(0,55);ctx.closePath();ctx.fill();rect(-26,-39,51,46,'#93aa78');rect(-17,-28,12,8,'#efffa3');rect(8,-28,12,8,'#efffa3');rect(-10,-11,22,8,'#36584b');rect(-21,9,43,28,'#486e5a');ctx.shadowColor='#d5f998';ctx.shadowBlur=20;ellipse(1,20,11,15,'#d3f398');ctx.shadowBlur=0;
 }
 ctx.restore();
 if(e.type!=='boss'){const w=42;rect(e.x-w/2,e.y-e.r-24,w,4,'#102624');rect(e.x-w/2,e.y-e.r-24,w*Math.max(0,e.hp/e.maxHp),4,'#d8a99c');ctx.font='11px "Noto Sans SC",sans-serif';ctx.textAlign='center';ctx.fillStyle='#c8dbd0';ctx.shadowColor='#06202a';ctx.shadowBlur=5;ctx.fillText(e.name,e.x,e.y-e.r-31);ctx.shadowBlur=0;}
}
function draw(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),pw=Math.round(r.width*dpr),ph=Math.round(r.height*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const scale=Math.max(r.width/W,r.height/H);camera.scale=scale;const vw=r.width/scale,vh=r.height/scale;camera.x=clamp(hero.x-vw/2,0,W-vw);camera.y=clamp(hero.y-vh/2,0,H-vh);
 ctx.setTransform(dpr*scale,0,0,dpr*scale,-camera.x*dpr*scale,-camera.y*dpr*scale);ctx.clearRect(camera.x,camera.y,vw,vh);ctx.save();if(shake&&state==='running')ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const background=backgrounds[chapterIndex()].naturalWidth?backgrounds[chapterIndex()]:backgrounds[0];
 if(background.complete&&background.naturalWidth)ctx.drawImage(background,0,0,W,H);else{ctx.fillStyle='#173d33';ctx.fillRect(0,0,W,H);}
 ctx.fillStyle=chapters[chapterIndex()].tint;ctx.fillRect(0,0,W,H);
 // Ambient fireflies are subtle and stay behind all interactive actors.
 for(let i=0;i<32;i++){const x=(i*173+Math.sin(clock*.25+i)*25)%W,y=(i*97+Math.cos(clock*.2+i)*16)%H;ctx.globalAlpha=.2+(Math.sin(clock+i)+1)*.18;ellipse(x,y,1.7,1.7,'#d2ecc0');}ctx.globalAlpha=1;
 for(const e of enemies){if(e.marked)for(const p of e.marked){ctx.fillStyle=e.pattern==='frost'?'#82d7ef3b':'#ef846a35';ctx.strokeStyle=e.pattern==='frost'?'#b0efffaa':'#ffac88cc';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-13,p.y);ctx.lineTo(p.x+13,p.y);ctx.moveTo(p.x,p.y-13);ctx.lineTo(p.x,p.y+13);ctx.stroke();}}
 for(const p of projectiles){ctx.shadowColor=p.color;ctx.shadowBlur=12;ellipse(p.x,p.y,6,6,p.color);ctx.shadowBlur=0;}

 if(state!=='title'){
  const actors=[...enemies,{type:'player',y:hero.y}].sort((a,b)=>a.y-b.y);for(const a of actors)if(a.type==='player')drawHero();else drawEnemy(a);
  if(pointer){ctx.strokeStyle='#d6efa299';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,9,0,TAU);ctx.stroke();}
 }
 for(const e of effects){ctx.globalAlpha=clamp(e.life/e.max,0,1);if(e.type==='particle'){rect(e.x,e.y,3,3,e.color);}else{ctx.strokeStyle=e.color;ctx.lineWidth=4*e.life/e.max;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1-e.life/e.max)+10,0,TAU);ctx.stroke();}}ctx.globalAlpha=1;
 for(const f of floaters){ctx.globalAlpha=clamp(f.life/.4,0,1);ctx.font='600 '+f.size+'px "Noto Sans SC",sans-serif';ctx.textAlign='center';ctx.fillStyle=f.color;ctx.shadowColor='#0a2127';ctx.shadowBlur=5;ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;}ctx.globalAlpha=1;
 // Direction markers for monsters outside the mobile camera.
 if(state==='running'&&vw<W-10){for(const e of enemies){if(e.x<camera.x+20||e.x>camera.x+vw-20){const left=e.x<camera.x;ctx.fillStyle='#debd9b';ctx.font='19px sans-serif';ctx.textAlign='center';ctx.fillText(left?'‹':'›',left?camera.x+15:camera.x+vw-15,clamp(e.y,camera.y+125,camera.y+vh-80));}}}
 ctx.restore();
}
function frame(t){const dt=Math.min((t-last)/1000||.016,.05);last=t;update(dt);draw();requestAnimationFrame(frame);}
function snapshot(){return{state,mode,region:zones[area].name,chapter:chapters[chapterIndex()].name,area:area+1,totalAreas:zones.length,wave:wave+1,wavesInArea:zones[area].waves.length,turn:turns+1,hero:{level:hero.level,hp:Math.ceil(hero.hp),maxHp:hero.maxHp,attack:hero.atk,defense:hero.def,xp:hero.xp,nextXp:hero.nextXp,gold:hero.gold,potions:hero.potions,kills:hero.kills,skillCooldown:Math.ceil(hero.skillCd)},enemies:enemies.map(e=>({name:e.name,hp:Math.max(0,e.hp),maxHp:e.maxHp})),revision};}
// Page-scoped tools reuse precisely the same actions as the visible controls.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_adventure_state',title:'查看冒险状态',description:'Read the current region, combat mode, hero stats and remaining enemies.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>snapshot()});
 register({name:'start_adventure',title:'开启新的远征',description:'Start a new adventure from the title or completed result screen, with action or turn combat.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['action','turn']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!['action','turn'].includes(input.mode)||Object.keys(input).some(k=>k!=='mode'))throw new Error('请选择 action 或 turn');if(!['title','dead','won'].includes(state))throw new Error('当前远征尚未结束');start(input.mode);return snapshot();}});
 register({name:'take_combat_turn',title:'执行战斗回合',description:'In turn mode only, perform attack, skill, guard, potion, or one directional move. Enemies act afterward.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['attack','skill','guard','potion','up','down','left','right']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{const valid=['attack','skill','guard','potion','up','down','left','right'];if(!input||!valid.includes(input.action)||Object.keys(input).some(k=>k!=='action'))throw new Error('无效的战斗动作');if(mode!=='turn'||state!=='running')throw new Error('请先进入回合战斗，并完成当前弹窗选择');const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};const ok=dirs[input.action]?tacticalMove(...dirs[input.action]):action(input.action==='guard'?'dash':input.action);if(!ok)throw new Error('当前无法使用此招式');return snapshot();}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
sync();requestAnimationFrame(frame);
})();
