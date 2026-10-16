import {getDb} from "../../../db";
import {fields,player,sameOrigin,json,cookie,validateResult,scoreResult} from "../../../lib/results";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const id=player(request);if(!id)return json({results:[]});const rows=await getDb().prepare(`SELECT ${fields} FROM expedition_runs WHERE player_id=? AND status!='playing' ORDER BY finished_at DESC LIMIT 30`).bind(id).all();return json({results:rows.results});}catch(error){console.error("History load failed",error);return json({error:"战绩暂时无法读取，请稍后重试。"},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:"请求来源无效。"},403);
 try{const payload:unknown=await request.json();if(!payload||typeof payload!=='object'||Array.isArray(payload))return json({error:'输入无效。'},400);const body=payload as Record<string,unknown>;const name=typeof body.name==='string'?body.name.trim():'';
 if(!name||Array.from(name).length>16||/[<>\x00-\x1f]/.test(name)||typeof body.mode!=='string'||body.mode!=='action')return json({error:"请填写 1 至 16 个字的昵称；当前仅支持即时动作。"},400);
 const owner=player(request)||crypto.randomUUID(),id=crypto.randomUUID();
 await getDb().prepare("INSERT INTO expedition_runs (id,player_id,name,mode,started_at) VALUES (?,?,?,?,?)").bind(id,owner,name,body.mode,Date.now()).run();
 return json({id,name,mode:body.mode},201,cookie(request,owner));
 }catch(error){console.error("Run start failed",error);return json({error:"战绩连接暂不可用，冒险仍可继续，结算时可重试保存。"},503);}
}
export async function PATCH(request:Request){
 if(!sameOrigin(request))return json({error:"请求来源无效。"},403);
 const owner=player(request);if(!owner)return json({error:"请在原来开始冒险的浏览器中保存战绩。"},401);
 try{const body=await request.json();if(!validateResult(body))return json({error:"战绩数据无效。"},400);
 const db=getDb(),run=await db.prepare("SELECT id,mode,status FROM expedition_runs WHERE id=? AND player_id=?").bind(body.id,owner).first<{id:string;mode:string;status:string}>();
 if(!run)return json({error:"找不到本次冒险。"},404);
 if(run.status==='playing')await db.prepare("UPDATE expedition_runs SET status=?,cleared=?,kills=?,level=?,seconds=?,turns=?,score=?,finished_at=? WHERE id=? AND player_id=? AND status='playing'").bind(body.won?'won':'defeated',body.cleared,body.kills,body.level,body.seconds,body.turns,scoreResult(body,run.mode),Date.now(),body.id,owner).run();
 const result=await db.prepare(`SELECT ${fields} FROM expedition_runs WHERE id=? AND player_id=?`).bind(body.id,owner).first();
 return json({result});
 }catch(error){console.error("Result save failed",error);return json({error:"战绩尚未保存，请点击重试。"},503);}
}
