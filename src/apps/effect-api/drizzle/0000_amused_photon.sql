CREATE TABLE `todos_table` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL
);
