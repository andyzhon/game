/* Original campaign data for 远征. All indices are zero-based internally. */
window.MosslightCampaign={
 chapters:[
  {name:'微光林地',image:'forest.png',tint:'#06231b0a',accent:'#c6ec95'},
  {name:'月影遗迹',image:'ruins.png',tint:'#12284612',accent:'#a1c9ed'},
  {name:'苍白霜境',image:'frost.png',tint:'#08253642',accent:'#abebf3'},
  {name:'永夜边界',image:'night.png',tint:'#2d123512',accent:'#e4b5ee'}
 ],
 bosses:[
  {name:'古林守卫',form:'boss',hp:620,atk:20,color:'#a4d28b',ability:'根须震击',pattern:'root',hint:'根须震击：红圈出现后，移动离开或防守。'},
  {name:'遗迹执政官',form:'stone',hp:1450,atk:34,color:'#c5bd91',ability:'符石连爆',pattern:'cross',hint:'符石连爆：三块符石横向排列，向上或向下闪避。'},
  {name:'霜冠狼王',form:'wolf',hp:2150,atk:44,color:'#c3eef7',ability:'寒晶猎场',pattern:'frost',hint:'寒晶猎场：避开蓝色冰圈，狼王移动更快。'},
  {name:'永夜树王',form:'boss',hp:3100,atk:56,color:'#e4b2ed',ability:'星陨裂隙',pattern:'night',hint:'星陨裂隙：错开三个预警区；半血后首领进入狂暴。'}
 ],
 zones:[
  {chapter:0,name:'微光林地',sub:'森林边境',quest:'清除林间的魔物',description:'从苔团与幽光蝠开始，最后躲开荆刺花妖的扇形飞刺。',reward:90,waves:[['slime','slime','slime','bat'],['slime','slime','bat','bat'],['slime','wolf','bat','thornbloom']]},
  {chapter:0,name:'古树之心',sub:'第一章 · 首领关',quest:'唤醒古林守卫',description:'侧身躲过裂蹄蛮兽的冲撞，再挑战古林守卫。',reward:160,boss:0,waves:[['charger','wolf','slime','bat'],['stone','charger','wolf','thornbloom'],['boss']]},
  {chapter:1,name:'断墙营地',sub:'旧王国的边境',quest:'夺回断墙营地',description:'熔核甲虫会蓄力爆炸，荆刺花妖从远处散射。先离开预警，再反击。',reward:140,waves:[['cinderbeetle','wisp','wolf','bat'],['sentinel','cinderbeetle','thornbloom','wolf'],['sentinel','charger','thornbloom','cinderbeetle']]},
  {chapter:1,name:'月蚀祭坛',sub:'第二章 · 首领关',quest:'击败遗迹执政官',description:'执政官会连锁引爆符石。观察预警，在符石之间寻找安全方向。',reward:220,boss:1,waves:[['sentinel','cinderbeetle','thornbloom','wolf'],['sentinel','cinderbeetle','wisp','thornbloom'],['boss']]},
  {chapter:2,name:'霜冠王庭',sub:'第三章 · 首领关',quest:'挑战霜冠狼王',description:'狼王会布下冰晶猎场。脱离预警范围后，再寻找进攻机会。',reward:300,boss:2,waves:[['frostwolf','charger','sentinel','thornbloom'],['frostwolf','cinderbeetle','wisp','charger','sentinel'],['boss']]},
  {chapter:3,name:'永夜之门',sub:'第四章 · 最终首领',quest:'终结永夜树王',description:'穿过最后的魔物，直面永夜之源。树王半血后会狂暴，准备闪避与药水。',reward:500,boss:3,waves:[['shade','charger','sentinel','thornbloom','wisp'],['shade','cinderbeetle','frostwolf','charger','thornbloom','wisp'],['boss']]}
 ]
};
