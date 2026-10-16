const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../public/game'),elements=new Map(),registered={};
const drawnImages=[];
const ctx=new Proxy({drawImage:image=>drawnImages.push(image.src),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
function el(id=''){if(elements.has(id))return elements.get(id);const e={id,innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},listeners:{},setAttribute(){},addEventListener(name,fn){this.listeners[name]=fn},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()},focus(){},replaceChildren(){},append(){},querySelector:()=>el('button'),getContext:()=>ctx,getBoundingClientRect:()=>({width:1000,height:607,left:0,top:0})};elements.set(id,e);return e;}
let elementId=0;const document={getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>el('node-'+(++elementId)),createTextNode:t=>({textContent:t}),addEventListener(){},modelContext:{registerTool:t=>registered[t.name]=t}};
const handlers={};const window={addEventListener(name,fn){handlers[name]=fn},devicePixelRatio:1};let seed=12345;const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const context=vm.createContext({document,window,Math:math,Image:class{complete=true;naturalWidth=64;},AbortController,HTMLElement:class{},requestAnimationFrame(){},console});
vm.runInContext(fs.readFileSync(path.join(root,'campaign.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'equipment.js'),'utf8'),context);
let source=fs.readFileSync(path.join(root,'game.js'),'utf8');
source=source.replace('sync();requestAnimationFrame(frame);',`window.test={createEnemy,gearStats,skillCooldown,addItem,openEquipment,closeEquipment,equipItem,sellItem,bagSnapshot,buyEquipment,merchantStock,saveGearState,saveCheckpoint,spawnWave,get inventory(){return inventory},get equipped(){return equipped},get reviveUsed(){return reviveUsed},setEnemies(value){enemies=value},setCamp(){state='camp';showCamp()},start,action,upgrade,buy,nextArea,update,draw,snapshot,togglePause,showTitle,damageEnemy,damageHero,resolveProgress,retryStage,shopCosts,gearLimit,warningCircles,bossStrike,keys,get hero(){return hero},get enemies(){return enemies},get state(){return state},get pending(){return pendingLevels},get projectiles(){return projectiles},get checkpoint(){return checkpoint},setPointer(v){pointer=v},setStage(a,w=0){area=a;wave=w;state='running';hero.invuln=0;hero.x=W/2;hero.y=H/2;spawnWave()},setHero(v){Object.assign(hero,v)}};sync();`);
vm.runInContext(source,context);const g=window.test,config=window.MosslightCampaign;
assert.equal(config.zones.length,6);assert.equal(config.chapters.length,4);assert.equal(config.zones.flatMap(z=>z.waves).length,18);assert.equal(config.zones.filter(z=>z.boss!==undefined).length,4);
for(const ch of config.chapters)assert(fs.existsSync(path.join(root,ch.image)),ch.image);
const expectedKills=config.zones.flatMap(z=>z.waves).flat().length;
g.draw();assert.equal(g.state,'title');assert.throws(()=>registered.start_adventure.execute({mode:'bad'}));
assert.throws(()=>registered.start_adventure.execute({mode:'turn'}));assert.equal(registered.take_combat_turn,undefined);assert.equal(g.start('turn'),false);assert.equal(g.state,'title');
registered.start_adventure.execute();assert.equal(g.snapshot().mode,'action');assert.throws(()=>registered.start_adventure.execute());
let before=g.snapshot();const idlePositions=JSON.stringify(g.enemies.map(e=>[e.x,e.y]));for(let i=0;i<100;i++)g.update(.05);assert.notEqual(JSON.stringify(g.enemies.map(e=>[e.x,e.y])),idlePositions);assert(!('turn' in g.snapshot()));
g.start();g.setPointer({x:g.hero.x,y:g.hero.y+200});g.keys.add('d');const dashY=g.hero.y;g.action('dash');assert.equal(g.hero.y,dashY);
// A single timely dodge can escape every boss pattern without waiting for a turn.
for(const area of [1,3,4,5]){g.start();g.setStage(area,2);const boss=g.enemies[0];boss.marked=g.warningCircles(boss);boss.windup=.25;const savedHp=g.hero.hp;g.keys.add('s');g.action('dash');for(let i=0;i<12;i++)g.update(.05);assert.equal(g.hero.hp,savedHp,'Boss dodge, area '+area);g.draw();}
// Retry restores the entrance snapshot, including earned loot and equipment.
g.start('action');const original=JSON.stringify(g.checkpoint.hero);g.setHero({gold:999,level:9,hp:1});g.damageHero(10000);assert.equal(g.state,'dead');assert(g.retryStage());assert.equal(JSON.stringify(g.hero),original);assert.equal(g.snapshot().area,1);assert.equal(g.snapshot().wave,1);
function campShopping(){let safe=0;while(safe++<30){const costs=g.shopCosts(),lim=g.gearLimit(),kind=g.hero.weapon<=g.hero.armor?'weapon':'armor';if(g.hero[kind]<lim&&g.hero.gold>=costs[kind])g.buy(kind);else break;}while(g.hero.potions<5&&g.hero.gold>=g.shopCosts().potion)g.buy('potion');}
function chooseUpgrade(){g.upgrade(g.hero.level%3===0?'magic':g.hero.level%3===1?'vitality':'power');}
let steps=0,camps=0,seen=new Set();
// Real-time movement, attacks, cooldowns, projectiles and all four bosses.
g.start('action');steps=0;camps=0;seen=new Set();
while(!['won','dead'].includes(g.state)&&steps++<100000){
 seen.add(g.snapshot().area+':'+g.snapshot().wave);
 if(g.state==='upgrade'){chooseUpgrade();continue;}if(g.state==='camp'){camps++;assert(elements.get('campaign-progress').textContent.includes('已完成 '+g.snapshot().area+' / 6'));campShopping();g.nextArea();continue;}if(g.state==='transition'){g.update(2);continue;}
 g.keys.clear();const target=g.enemies.reduce((a,e)=>!a||Math.hypot(e.x-g.hero.x,e.y-g.hero.y)<Math.hypot(a.x-g.hero.x,a.y-g.hero.y)?e:a,null);let dx=0,dy=0;
 const warnings=g.enemies.flatMap(e=>e.marked||[]);const danger=warnings.some(c=>Math.hypot(g.hero.x-c.x,g.hero.y-c.y)<c.r+15);
 if(danger){let best=null;for(const [x,y] of [[0,1],[0,-1],[1,0],[-1,0]]){const p={x:Math.max(78,Math.min(1042,g.hero.x+x*160)),y:Math.max(105,Math.min(615,g.hero.y+y*160))};const score=Math.min(...warnings.map(c=>Math.hypot(p.x-c.x,p.y-c.y)-c.r));if(!best||score>best.score)best={x,y,score};}dx=best.x;dy=best.y;}
 else if(target&&Math.hypot(target.x-g.hero.x,target.y-g.hero.y)>85){dx=target.x-g.hero.x;dy=target.y-g.hero.y;}
 if(Math.abs(dx)>2||danger&&dx){g.keys.add(dx>0?'d':'a');}if(Math.abs(dy)>2||danger&&dy){g.keys.add(dy>0?'s':'w');}
 if(danger)g.action('dash');if(g.hero.hp<g.hero.maxHp*.42&&g.hero.potions)g.action('potion');
 if(!danger){if(g.enemies.some(e=>Math.hypot(e.x-g.hero.x,e.y-g.hero.y)<200)&&g.hero.skillCd===0)g.action('skill');g.action('attack');}
 g.update(.05);
}
console.log('Action result',JSON.stringify(g.snapshot()));assert.equal(g.state,'won');assert.equal(camps,5);assert.equal(seen.size,18);assert.equal(g.hero.kills,expectedKills);
// Pause freezes real-time combat and projectiles, not only the visible overlay.
g.start('action');g.setStage(4);for(let i=0;i<100;i++)g.update(.05);g.togglePause();before=JSON.stringify({hp:g.hero.hp,shots:g.projectiles});for(let i=0;i<100;i++)g.update(.05);assert.equal(JSON.stringify({hp:g.hero.hp,shots:g.projectiles}),before);g.togglePause();
console.log('PASS: 6 areas, 18 waves, 4 bosses, full action playthrough, valid and invalid actions, boss dodge, retry snapshot, pause and assets.');
// Equipment ownership, UI operations and actual combat behavior.
const definitions=window.MosslightEquipment.items;assert.equal(definitions.filter(i=>!i.starter).length,18);assert.equal(new Set(definitions.map(i=>i.id)).size,21);
function putOn(id){const owned=g.inventory.find(i=>i.itemId===id)||g.addItem(id);assert(g.openEquipment());if(g.equipped[definitions.find(i=>i.id===id).slot]!==owned.uid)assert(g.equipItem(owned.uid));g.closeEquipment();return owned.uid;}
g.start('action');assert.equal(registered.read_equipment_inventory.execute().items.length,6);assert.throws(()=>registered.equip_inventory_item.execute({instanceId:'missing'}));
registered.open_equipment_bag.execute();assert.equal(g.state,'inventory');let frozen=JSON.stringify(g.snapshot());g.update(10);assert.equal(JSON.stringify(g.snapshot()),frozen);assert.throws(()=>registered.equip_inventory_item.execute({instanceId:'missing'}));
let oldSword=g.inventory.find(i=>i.itemId==='traveler_sword').uid,blood=g.equipped.weapon;registered.equip_inventory_item.execute({instanceId:oldSword});assert.equal(g.gearStats().atk,18);g.equipItem(blood);assert.equal(g.gearStats().atk,23);g.equipItem(oldSword);g.equipItem(blood);assert.equal(g.gearStats().atk,23);assert(!g.sellItem(blood));g.closeEquipment();assert.equal(g.state,'running');
g.setHero({hp:50,skillCd:3});putOn('ancient_mail');assert.equal(g.hero.hp,50);assert.equal(g.gearStats().maxHp,200);putOn('briar_mail');assert.equal(g.hero.hp,50);assert.equal(g.gearStats().maxHp,120);assert.equal(g.hero.skillCd,3);
// Retry rolls back all loot and restores the same deterministic drop sequence.
g.start('action');const initialBag=JSON.stringify(g.saveGearState());g.damageEnemy(g.enemies[0],10000,'thorns');const firstDrop=g.inventory.at(-1).itemId;assert.equal(g.inventory.length,7);g.damageHero(10000);assert.equal(g.state,'dead');g.retryStage();assert.equal(JSON.stringify(g.saveGearState()),initialBag);g.damageEnemy(g.enemies[0],10000,'thorns');assert.equal(g.inventory.at(-1).itemId,firstDrop);
// Lifesteal cannot heal from overkill or from reflected damage.
g.start('action');g.setHero({hp:50});let foe=g.enemies[0];foe.hp=10;foe.xp=0;g.damageEnemy(foe,10000,'basic');assert.equal(g.hero.hp,51);foe=g.enemies[0];foe.hp=10;foe.xp=0;g.damageEnemy(foe,10000,'thorns');assert.equal(g.hero.hp,51);
// Lightning procs once per third landed action, with at most two secondary targets.
g.start('action');putOn('thunderblade');g.enemies.forEach((e,i)=>{e.x=g.hero.x+(i?210+i*10:55);e.y=g.hero.y+(i?i*15:0);e.hp=e.maxHp=5000;e.atk=0;e.speed=0;});const targets=[...g.enemies];g.action('attack');g.setHero({attackCd:0});g.action('attack');assert.equal(targets[1].hp,5000);g.setHero({attackCd:0});g.action('attack');assert(targets[1].hp<5000);assert(targets[2].hp<5000);assert.equal(targets[3].hp,5000);g.draw();
// Spear retains its reach; slowing affects movement instead of base speed.
g.start('action');putOn('frostlance');foe=g.enemies[0];foe.x=g.hero.x+170;foe.y=g.hero.y;foe.hp=foe.maxHp=5000;g.setEnemies([foe]);const heroX=g.hero.x,baseSpeed=foe.speed;g.action('attack');assert.equal(g.hero.x,heroX);assert.equal(foe.slowLeft,2);assert.equal(foe.speed,baseSpeed);assert(foe.x>g.hero.x+110);
// Thorns can finish a wave without a subsequent player action.
g.start('action');foe=g.enemies[0];Object.assign(foe,{hp:1,xp:0,x:g.hero.x,y:g.hero.y,atk:20,cd:0});g.setEnemies([foe]);g.update(.05);assert.equal(g.state,'transition');assert.equal(g.enemies.length,0);
// One revival per area survives gear swapping; retry returns the entrance state.
g.start('action');putOn('phoenix_mail');g.saveCheckpoint();g.setHero({hp:1});g.damageHero(10000);assert.equal(g.state,'running');assert.equal(g.hero.hp,Math.round(g.gearStats().maxHp*.35));assert(g.reviveUsed);putOn('briar_mail');putOn('phoenix_mail');g.setHero({hp:1,invuln:0});g.damageHero(10000);assert.equal(g.state,'dead');g.retryStage();assert.equal(g.reviveUsed,false);assert.equal(g.equipped.armor,g.checkpoint.gear.equipped.armor);
// Wave healing fires only at wave entry; skill cooldown combines item bonuses.
g.start('action');putOn('ancient_mail');g.setHero({hp:50});g.openEquipment();g.closeEquipment();assert.equal(g.hero.hp,50);g.spawnWave();assert.equal(g.hero.hp,74);putOn('hourglass');putOn('moon_robe');assert(Math.abs(g.skillCooldown()-3.025)<1e-9);g.setHero({skillCd:3});putOn('wood_charm');assert.equal(g.hero.skillCd,3);
// Purchase and sale are atomic. Equipped items cannot be sold, repeated buys fail.
g.start('action');g.setCamp();g.setHero({gold:1000,hp:83,skillCd:2});let stock=g.merchantStock()[0],balance=g.hero.gold;const previousWeapon=g.equipped.weapon;assert.equal(stock.id,'thunderblade');assert(g.buyEquipment(stock.id));assert.equal(g.hero.gold,balance-stock.price);assert.equal(g.hero.hp,83);assert.equal(g.hero.skillCd,2);assert(g.inventory.some(i=>i.uid===previousWeapon));const purchase=g.inventory.at(-1).uid;assert.equal(g.equipped.weapon,purchase);assert(el('weapon-glyph').innerHTML.includes('weapons/thunderblade.svg'));drawnImages.length=0;g.draw();assert(drawnImages.includes('weapons/thunderblade.svg'));assert(!g.buyEquipment(stock.id));assert.equal(g.hero.gold,balance-stock.price);assert.equal(g.equipped.weapon,purchase);g.openEquipment();assert(!g.equipItem(purchase));assert(!g.sellItem(purchase));g.equipItem(g.inventory.find(i=>i.itemId==='traveler_sword').uid);balance=g.hero.gold;assert(g.sellItem(purchase));assert.equal(g.hero.gold,balance+Math.floor(stock.price*.32));assert(!g.sellItem(purchase));g.closeEquipment();assert.equal(g.state,'camp');
console.log('PASS equipment: 18 unique additions, backpack, derived stats, safe swapping, deterministic retry, lifesteal, chain lightning, spear slow, thorns transitions, revival, wave heal, cooldown and merchant transactions.');

// Every shortened chapter, gear pool and boss reward stays reachable.
assert.deepEqual(Array.from(config.zones,z=>z.chapter),[0,0,1,1,2,3]);
assert(definitions.every(i=>i.unlock<=config.zones.length));
for(const [area,item] of [[1,'ancient_mail'],[3,'moonblade'],[4,'dawnblade'],[5,'night_crown']]){g.start('action');g.setStage(area,2);g.damageEnemy(g.enemies[0],100000,'basic');assert(g.inventory.some(i=>i.itemId===item));}
for(const type of ['thornbloom','charger','cinderbeetle']){
 assert(config.zones.some(z=>z.waves.some(w=>w.includes(type))));
 // Real-time windups freeze during backpack use, then resolve once.
 g.start('action');let e=g.createEnemy(type,0,1);Object.assign(e,{x:g.hero.x-(type==='cinderbeetle'?50:180),y:g.hero.y,specialCd:0,hp:9999,maxHp:9999,atk:60});g.setEnemies([e]);let hp=g.hero.hp;g.update(.05);assert(e.marked?.length);assert.equal(g.hero.hp,hp);const windup=e.windup;g.openEquipment();g.update(3);assert.equal(e.windup,windup);g.closeEquipment();
 if(type==='thornbloom'){g.update(1.1);assert.equal(g.projectiles.length,3);assert.equal(new Set(g.projectiles.map(p=>p.vy)).size,3);assert(g.projectiles.every(p=>p.ownerId===e.id));}
 else{g.update(1.3);assert(g.hero.hp<hp,type+' real-time hit');if(type==='charger')assert(Math.abs(e.x-g.hero.x)<1);}
 g.draw();
 // A killed attacker cannot finish an outstanding windup.
 g.start('action');e=g.createEnemy(type,0,1);Object.assign(e,{x:g.hero.x-50,y:g.hero.y,specialCd:0,xp:0});g.setEnemies([e]);g.update(.05);g.damageEnemy(e,100000,'thorns');hp=g.hero.hp;g.update(1.4);assert.equal(g.hero.hp,hp);assert.equal(g.projectiles.length,0);
}
console.log('PASS: new monster telegraphs, real-time charge/blast/fan, paused windups, kill cancellation, six-area chapter map and boss loot.');

for(const mode of ['action']){g.start(mode);const weaponIds=[];for(let area=0;area<5;area++){if(area)g.nextArea();g.setCamp();g.setHero({gold:2000});const weapon=g.merchantStock()[0];assert(g.buyEquipment(weapon.id));assert.equal(g.inventory.find(i=>i.uid===g.equipped.weapon).itemId,weapon.id);drawnImages.length=0;g.draw();assert(drawnImages.includes('weapons/'+weapon.id+'.svg'));weaponIds.push(weapon.id);}assert.deepEqual(weaponIds,['thunderblade','frostlance','runic_axe','moonblade','dawnblade']);}
console.log('PASS: every weapon purchase auto-equips and renders its matching image in action combat.');

// Strategy regression checks: actual actions, costs, timings and interrupt behavior.
function durable(type='slime',distance=70){const e=g.createEnemy(type,0,1);Object.assign(e,{x:g.hero.x+distance,y:g.hero.y,hp:99999,maxHp:99999,xp:0,atk:0,speed:0,cd:100});return e;}
g.start();let e=durable();g.setEnemies([e]);g.setHero({stamina:29});const position=g.hero.x;assert(!g.action('dash'));assert.equal(g.hero.x,position);assert.equal(g.hero.dashCd,0);assert.equal(g.hero.stamina,29);
g.setHero({stamina:44});assert(!g.action('skill'));assert.equal(g.hero.skillCd,0);assert.equal(g.hero.stamina,44);
g.setHero({stamina:100});assert(g.action('skill'));assert.equal(g.hero.stamina,55);assert(!g.action('skill'));assert.equal(g.hero.stamina,55);
g.update(.3);assert.equal(g.hero.stamina,55);g.update(.3);assert.equal(g.hero.stamina,55);g.update(.15);assert(Math.abs(g.hero.stamina-55.8)<1e-9);
g.setHero({stamina:30,staminaDelay:0,attackCd:0});g.setEnemies([e,durable('stone')]);assert(g.action('attack'));assert.equal(g.hero.stamina,36,'One recovery per swing, not per target');g.setHero({attackCd:0});e.x=1000;g.setEnemies([e]);g.action('attack');assert.equal(g.hero.stamina,36,'Misses do not restore stamina');
// Pausing freezes resource regeneration, focus and enemy windups together.
g.setHero({stamina:40,focus:3,staminaDelay:.4,swing:0});g.togglePause();const resources=JSON.stringify(g.hero);g.update(4);assert.equal(JSON.stringify(g.hero),resources);g.togglePause();g.openEquipment();g.update(4);assert.equal(JSON.stringify(g.hero),resources);g.closeEquipment();
// An early dodge spends the full cost; a threatened last-moment dodge grants focus.
g.start();e=durable('charger',100);e.marked=[{x:g.hero.x,y:g.hero.y,r:34}];e.windup=.8;g.setEnemies([e]);g.action('dash');assert.equal(g.hero.focus,0);assert.equal(g.hero.stamina,70);
g.start();e=durable('charger',100);e.marked=[{x:g.hero.x,y:g.hero.y,r:34}];e.windup=.25;g.setEnemies([e]);g.action('dash');assert.equal(g.hero.focus,5);assert.equal(g.hero.stamina,85);assert.equal(g.snapshot().hero.focusSeconds,5);
// A projectile that is receding cannot grant focus; an incoming one can.
g.start();e=durable();g.setEnemies([e]);g.projectiles.push({x:g.hero.x+30,y:g.hero.y,vx:210,vy:0,atk:30,life:3,color:'#fff'});g.action('dash');assert.equal(g.hero.focus,0);
g.start();e=durable();g.setEnemies([e]);g.projectiles.push({x:g.hero.x+30,y:g.hero.y,vx:-210,vy:0,atk:30,life:3,color:'#fff'});g.action('dash');assert.equal(g.hero.focus,5);
// Focus expires in real time, is consumed once, and grants exactly 50% more skill damage.
g.start();e=durable();g.setEnemies([e]);g.setHero({focus:.1});g.update(.15);assert.equal(g.hero.focus,0);
g.start();e=durable();g.setEnemies([e]);const savedRandom=math.random;math.random=()=>.99;const hp=e.hp;g.action('skill');const baseDamage=hp-e.hp;e.hp=hp;g.setHero({focus:5,skillCd:0,stamina:100});g.action('skill');assert.equal(g.hero.focus,0);assert(Math.abs((hp-e.hp)-baseDamage*1.5)<=1);assert.equal(g.hero.stamina,55);math.random=savedRandom;
// Normal skills interrupt specials; bosses require an empowered skill.
for(const type of ['charger','thornbloom','cinderbeetle','boss']){
 g.start();if(type==='boss')g.setStage(1,2);e=type==='boss'?g.enemies[0]:durable(type);Object.assign(e,{x:g.hero.x+80,y:g.hero.y,hp:99999,maxHp:99999,xp:0,windup:.4,marked:[{x:g.hero.x,y:g.hero.y,r:100}]});g.setEnemies([e]);g.action('skill');
 if(type==='boss'){assert(e.marked);assert(!e.stagger);g.setHero({skillCd:0,stamina:100,focus:5});g.action('skill');}
 assert.equal(e.marked,null,type+' interrupted');assert.equal(e.stagger,.8);assert.equal(e.vulnerable,2);const x=e.x;g.update(.05);assert.equal(e.x,x,'Stagger stops movement');g.draw();
}
// Exposed armor loses its mitigation as well as taking the counterattack bonus.
g.start();e=durable('sentinel');g.setEnemies([e]);g.damageEnemy(e,100,'thorns');const armored=99999-e.hp;e.hp=99999;e.vulnerable=2;g.damageEnemy(e,100,'thorns');assert.equal(armored,80);assert.equal(99999-e.hp,125);
// Invalid/dead/paused actions cannot consume resources, and a new run resets them.
g.togglePause();const pausedStamina=g.hero.stamina;assert(!g.action('dash'));assert.equal(g.hero.stamina,pausedStamina);g.showTitle();assert.equal(g.hero.stamina,100);assert.equal(g.hero.focus,0);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!/data-mode|data-coop|coop.js|回合战斗|coop-dialog|data-rank-mode="turn"/.test(html));
console.log('PASS strategy: stamina costs and recovery, pause freezing, early/perfect/projectile dodges, focus expiry and consumption, special/boss interrupts, stagger, exposed armor, and action-only UI/tools.');
