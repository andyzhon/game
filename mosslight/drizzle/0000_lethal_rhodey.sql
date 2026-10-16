CREATE TABLE `expedition_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`cleared` integer DEFAULT 0 NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`turns` integer DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runs_ranking` ON `expedition_runs` (`mode`,`status`,`score`);--> statement-breakpoint
CREATE INDEX `runs_history` ON `expedition_runs` (`player_id`,`finished_at`);