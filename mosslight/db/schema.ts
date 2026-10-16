import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const runs = sqliteTable("expedition_runs", {
 id: text("id").primaryKey(), playerId: text("player_id").notNull(), name: text("name").notNull(),
 mode: text("mode").notNull(), status: text("status").notNull().default("playing"),
 startedAt: integer("started_at").notNull(), finishedAt: integer("finished_at"),
 cleared: integer("cleared").notNull().default(0), kills: integer("kills").notNull().default(0),
 level: integer("level").notNull().default(1), seconds: integer("seconds").notNull().default(0),
 turns: integer("turns").notNull().default(0), score: integer("score").notNull().default(0),teamId:text("team_id")
}, t => [index("runs_ranking").on(t.mode,t.status,t.score),index("runs_history").on(t.playerId,t.finishedAt)]);
export const rooms=sqliteTable("coop_rooms",{
 code:text("code").primaryKey(),hostId:text("host_id").notNull(),guestId:text("guest_id"),
 hostName:text("host_name").notNull(),guestName:text("guest_name"),
 phase:text("phase").notNull().default("waiting"),revision:integer("revision").notNull().default(0),
 state:text("state"),commands:text("commands").notNull().default("[]"),
 createdAt:integer("created_at").notNull(),startedAt:integer("started_at"),finishedAt:integer("finished_at"),
 expiresAt:integer("expires_at").notNull(),hostSeen:integer("host_seen").notNull(),guestSeen:integer("guest_seen")
},t=>[index("rooms_expiry").on(t.expiresAt)]);
