import {getDb} from "../../../db";
import {fields,json} from "../../../lib/results";
export const dynamic="force-dynamic";
export async function GET(request:Request){const mode=new URL(request.url).searchParams.get('mode')||'action';if(!['action','turn','coop'].includes(mode))return json({error:'模式无效。'},400);try{
 const rows=await getDb().prepare(`SELECT ${fields} FROM expedition_runs WHERE mode=? AND status!='playing' AND (mode!='coop' OR id=team_id) ORDER BY score DESC,finished_at ASC,id ASC LIMIT 30`).bind(mode).all();return json({results:rows.results});
}catch(error){console.error('Leaderboard load failed',error);return json({error:'全球排行榜暂时无法读取，请稍后重试。'},503);}}
