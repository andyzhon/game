export const fields="id,name,mode,status,cleared,kills,level,seconds,turns,score,finished_at AS finishedAt";
export function player(request:Request){const value=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith("expedition_player="))?.split("=")[1];return value&&/^[a-f0-9-]{36}$/.test(value)?value:null;}
export function sameOrigin(request:Request){const origin=request.headers.get("origin");return (!origin||origin===new URL(request.url).origin)&&request.headers.get("sec-fetch-site")!=="cross-site";}
export function json(value:unknown,status=200,cookie?:string){return Response.json(value,{status,headers:{"Cache-Control":"no-store",...(cookie?{"Set-Cookie":cookie}:{})}});}
export function cookie(request:Request,id:string){return `expedition_player=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export type ResultInput={id:string;cleared:number;kills:number;level:number;seconds:number;turns:number;won:boolean};
export function validateResult(value:unknown):value is ResultInput{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const body=value as Record<string,unknown>;
 if(typeof body.id!=="string")return false;
 const ints=[['cleared',0,6],['kills',0,64],['level',1,20],['seconds',0,86400],['turns',0,20000]] as const;
 for(const [key,min,max] of ints)if(typeof body[key]!=="number"||!Number.isInteger(body[key])||(body[key] as number)<min||(body[key] as number)>max)return false;
 if(typeof body.won!=="boolean"||body.won!==(body.cleared===6))return false;
 const cleared=body.cleared as number,kills=body.kills as number,limits=[0,12,21,33,42,52,64];
 return kills>=limits[cleared]&&kills<=limits[Math.min(6,cleared+1)]&&(!body.won||kills===64);
}
export function scoreResult(body:{cleared:number;kills:number;level:number;seconds:number;turns:number;won:boolean},mode:string){
 const pace=mode==='turn'||mode==='coop'?body.turns*4:body.seconds;
 return body.cleared*1000+body.kills*10+body.level*25+(body.won?2000+Math.max(0,1000-pace):0);
}
