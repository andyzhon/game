/* Original campaign data for 苔光远征. All indices are zero-based internally. */
window.MosslightCampaign={
 chapters:[
  {name:'微光林地',image:'forest.png',tint:'#06231b0a',accent:'#c6ec95'},
  {name:'月影遗迹',image:'ruins.png',tint:'#12284612',accent:'#a1c9ed'},
  {name:'苍白霜境',image:'frost.png',tint:'#08253642',accent:'#abebf3'},
  {name:'永夜边界',image:'night.png',tint:'#2d123512',accent:'#e4b5ee'}
 ],
 bosses:[
  {name:'古林守卫',form:'boss',hp:980,atk:24,color:'#a4d28b',ability:'根须震击',pattern:'root',hint:'根须震击：红圈出现后，移动离开或防守。'},
  {name:'遗迹执政官',form:'stone',hp:2600,atk:46,color:'#c5bd91',ability:'符石连爆',pattern:'cross',hint:'符石连爆：三块符石横向排列，向上或向下闪避。'},
  {name:'霜冠狼王',form:'wolf',hp:4700,atk:70,color:'#c3eef7',ability:'寒晶猎场',pattern:'frost',hint:'寒晶猎场：避开蓝色冰圈，狼王移动更快。'},
  {name:'永夜树王',form:'boss',hp:7600,atk:98,color:'#e4b2ed',ability:'星陨裂隙',pattern:'night',hint:'星陨裂隙：错开三个预警区；半血后首领进入狂暴。'}
 ],
 zones:[
  {name:'微光林地',sub:'森林边境',quest:'清除林间的魔物',description:'从苔团与幽光蝠开始，学会挥剑、走位和星芒斩。',reward:60,waves:[['slime','slime','slime','bat'],['slime','slime','bat','bat'],['slime','wolf','bat','slime']]},
  {name:'迷雾小径',sub:'循着萤火前行',quest:'穿过影狼的领地',description:'影狼从迷雾中逼近。留好技能，迎接最后的狼群。',reward:80,waves:[['wolf','slime','bat','slime'],['wolf','wolf','bat','slime'],['wolf','wolf','wolf','bat']]},
  {name:'古树之心',sub:'第一章 · 首领关',quest:'唤醒古林守卫',description:'先击退古树附近的魔物，再避开守卫的根须震击。',reward:140,boss:0,waves:[['stone','wolf','slime','bat'],['stone','stone','wolf','bat'],['boss']]},
  {name:'断墙营地',sub:'旧王国的边境',quest:'夺回断墙营地',description:'遗迹哨兵拥有护甲。寻找空隙，优先处理远处的月影灵。',reward:120,waves:[['stone','wisp','wolf','bat'],['sentinel','stone','wisp','wolf'],['sentinel','sentinel','wisp','bat']]},
  {name:'回声回廊',sub:'符文深处的低语',quest:'熄灭回廊中的暗火',description:'月影灵会从远处发射光弹。不断移动，避免被哨兵包围。',reward:145,waves:[['wisp','wisp','stone','wolf'],['sentinel','wisp','wisp','wolf','bat'],['sentinel','sentinel','wisp','wisp','wolf']]},
  {name:'月蚀祭坛',sub:'第二章 · 首领关',quest:'击败遗迹执政官',description:'执政官会连锁引爆符石。观察预警，在符石之间寻找安全方向。',reward:220,boss:1,waves:[['sentinel','stone','wisp','wolf'],['sentinel','sentinel','wisp','wisp'],['boss']]},
  {name:'霜息谷地',sub:'寒风中的足迹',quest:'越过霜狼哨线',description:'迅捷的霜狼守住山口。保护自己，逐步穿过冰雪谷地。',reward:180,waves:[['frostwolf','slime','wisp','bat'],['frostwolf','frostwolf','wisp','stone'],['frostwolf','frostwolf','sentinel','wisp','bat']]},
  {name:'冰晶裂隙',sub:'冰封大地的心跳',quest:'打通冰晶裂隙',description:'霜狼与重甲哨兵结队巡游，用范围技能打开道路。',reward:205,waves:[['frostwolf','sentinel','wisp','wisp'],['frostwolf','frostwolf','sentinel','wisp','bat'],['frostwolf','frostwolf','frostwolf','sentinel','wisp']]},
  {name:'霜冠王庭',sub:'第三章 · 首领关',quest:'挑战霜冠狼王',description:'狼王会布下冰晶猎场。脱离预警范围后，再寻找进攻机会。',reward:300,boss:2,waves:[['frostwolf','frostwolf','sentinel','wisp'],['frostwolf','frostwolf','wisp','wisp','sentinel'],['boss']]},
  {name:'暮色深渊',sub:'永夜中的第一束光',quest:'驱散深渊的噬光者',description:'噬光团能够吸取生命。及时击倒它们，不要被拖进消耗战。',reward:240,waves:[['shade','shade','wisp','frostwolf'],['shade','sentinel','wisp','wisp','frostwolf'],['shade','shade','shade','sentinel','wisp']]},
  {name:'星陨高地',sub:'最后的营火',quest:'突破永夜防线',description:'最后一道防线聚集了各地强敌。强化装备，为终战备好药水。',reward:280,waves:[['shade','frostwolf','sentinel','wisp','bat'],['shade','shade','frostwolf','sentinel','wisp'],['sentinel','sentinel','shade','frostwolf','wisp','wisp']]},
  {name:'永夜之门',sub:'第四章 · 最终首领',quest:'终结永夜树王',description:'穿过最后的魔物，直面永夜之源。树王半血后会狂暴，准备闪避与药水。',reward:500,boss:3,waves:[['shade','frostwolf','sentinel','wisp','wisp'],['shade','shade','frostwolf','sentinel','sentinel','wisp'],['boss']]}
 ]
};
