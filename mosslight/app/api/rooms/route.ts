import {json} from '../../../lib/results';
export const dynamic='force-dynamic';
// Retired turn-based rooms cannot create or resume a playable session.
const retired=()=>json({error:'回合制合作玩法已下线，请返回开始界面体验即时动作远征。'},410);
export async function GET(){return retired();}
export async function POST(){return retired();}
