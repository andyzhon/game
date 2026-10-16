CREATE TABLE `coop_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`guest_id` text,
	`host_name` text NOT NULL,
	`guest_name` text,
	`phase` text DEFAULT 'waiting' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text,
	`commands` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`expires_at` integer NOT NULL,
	`host_seen` integer NOT NULL,
	`guest_seen` integer
);
--> statement-breakpoint
CREATE INDEX `rooms_expiry` ON `coop_rooms` (`expires_at`);--> statement-breakpoint
ALTER TABLE `expedition_runs` ADD `team_id` text;