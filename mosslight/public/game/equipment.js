/* Original equipment: item identity is separate from the owned instance. */
window.MosslightEquipment={
 rarities:{common:{name:'普通',color:'#a7b6ac'},uncommon:{name:'精良',color:'#a8d894'},rare:{name:'稀有',color:'#8fc5f5'},epic:{name:'史诗',color:'#cfadef'},legendary:{name:'传说',color:'#f1cd87'}},
 slots:{weapon:'武器',armor:'护甲',charm:'饰品'},
 items:[
  {id:'traveler_sword',name:'旅人的短剑',slot:'weapon',icon:'⚔',rarity:'common',unlock:1,price:30,starter:true,stats:{},effect:'可靠的起点，剑刃仍然锋利。'},
  {id:'moss_cloak',name:'苔色斗篷',slot:'armor',icon:'♜',rarity:'common',unlock:1,price:30,starter:true,stats:{},effect:'一件陪你走进森林的旧斗篷。'},
  {id:'wood_charm',name:'木叶护符',slot:'charm',icon:'♧',rarity:'common',unlock:1,price:20,starter:true,stats:{},effect:'一片木叶，寄托平安的愿望。'},
  {id:'bloodthorn',name:'赤棘短刃',slot:'weapon',icon:'⚔',rarity:'uncommon',unlock:1,price:120,stats:{atk:5,lifesteal:.08},effect:'普通攻击吸取实际伤害的 8%，回复生命。'},
  {id:'thunderblade',name:'雷鸣长刃',slot:'weapon',icon:'ϟ',rarity:'rare',unlock:2,price:250,stats:{atk:9,chain:.55},effect:'每 3 次命中的普通攻击，连锁电击附近最多 2 名敌人，各造成攻击力 55% 的伤害。'},
  {id:'frostlance',name:'霜牙长枪',slot:'weapon',icon:'♆',rarity:'rare',unlock:3,price:280,stats:{atk:11,reach:45,slow:.35},effect:'攻击范围 +45；普攻命中使敌人移速降低 35%，持续 2 秒 / 2 次敌方行动。'},
  {id:'runic_axe',name:'破甲战斧',slot:'weapon',icon:'⚒',rarity:'rare',unlock:2,price:260,stats:{atk:18,pierce:1,heavy:.12},effect:'攻击无视符甲哨兵的护甲减伤；即时模式普攻间隔增加 12%。'},
  {id:'moonblade',name:'月蚀法刃',slot:'weapon',icon:'☾',rarity:'epic',unlock:4,price:430,stats:{atk:15,skillPower:.55},effect:'气功伤害倍率增加 55 个百分点。'},
  {id:'dawnblade',name:'星陨巨剑',slot:'weapon',icon:'✧',rarity:'legendary',unlock:5,price:680,stats:{atk:26,crit:.15,critDamage:.5,bossBonus:.2},effect:'暴击率 +15%，暴击倍率 +0.5，对首领伤害 +20%。'},
  {id:'briar_mail',name:'荆棘战甲',slot:'armor',icon:'♜',rarity:'uncommon',unlock:1,price:110,stats:{def:3,thorns:.4},effect:'受击后向攻击者反弹实际承伤的 40%；反伤不会触发吸血。'},
  {id:'wind_cloak',name:'追风披风',slot:'armor',icon:'≈',rarity:'uncommon',unlock:1,price:120,stats:{def:1,maxHp:15,speed:.18},effect:'移动速度与回合移动距离 +18%。'},
  {id:'frost_plate',name:'霜晶重甲',slot:'armor',icon:'❄',rarity:'rare',unlock:3,price:300,stats:{def:7,maxHp:35,reduction:.12,speed:-.08},effect:'受到的伤害降低 12%，移动速度与回合移动距离降低 8%。'},
  {id:'moon_robe',name:'月织法袍',slot:'armor',icon:'☽',rarity:'epic',unlock:4,price:410,stats:{def:3,maxHp:25,cooldown:.2,skillPower:.25},effect:'气功冷却缩短 20%，伤害倍率增加 25 个百分点。'},
  {id:'ancient_mail',name:'古树圣铠',slot:'armor',icon:'♧',rarity:'epic',unlock:2,price:420,stats:{def:6,maxHp:80,waveHeal:.12},effect:'每波开始时回复最大生命的 12%。'},
  {id:'phoenix_mail',name:'不烬战甲',slot:'armor',icon:'♨',rarity:'legendary',unlock:5,price:690,stats:{def:8,maxHp:70,revive:.35},effect:'每关首次致命伤害时，复苏至最大生命的 35%；换装不会重置次数。'},
  {id:'fang_pendant',name:'猎牙挂坠',slot:'charm',icon:'◇',rarity:'uncommon',unlock:1,price:110,stats:{crit:.12},effect:'普攻与技能暴击率 +12%。'},
  {id:'spring_charm',name:'露泉护符',slot:'charm',icon:'♡',rarity:'uncommon',unlock:1,price:120,stats:{killHeal:.04},effect:'每击败一只魔物，回复最大生命的 4%。'},
  {id:'hourglass',name:'流沙吊坠',slot:'charm',icon:'⌛',rarity:'rare',unlock:2,price:260,stats:{cooldown:.25},effect:'气功冷却缩短 25%；回合模式按整回合计算。'},
  {id:'star_seal',name:'星纹法印',slot:'charm',icon:'✺',rarity:'epic',unlock:4,price:390,stats:{skillPower:.65},effect:'气功伤害倍率增加 65 个百分点。'},
  {id:'raven_coin',name:'旅鸦金币',slot:'charm',icon:'◎',rarity:'rare',unlock:2,price:230,stats:{goldBonus:.25,dropBonus:.12},effect:'击杀金币 +25%，普通魔物装备掉落率增加 12 个百分点。'},
  {id:'night_crown',name:'永夜王冠',slot:'charm',icon:'♛',rarity:'legendary',unlock:5,price:700,stats:{atk:12,def:3,execute:.25},effect:'对生命低于 30% 的敌人造成额外 25% 伤害。'}
 ]
};
