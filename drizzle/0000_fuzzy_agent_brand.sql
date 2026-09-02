CREATE TABLE `airports` (
	`id` text PRIMARY KEY NOT NULL,
	`icao` text,
	`iata` text,
	`name` text NOT NULL,
	`municipality` text,
	`country` text,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text
);
--> statement-breakpoint
CREATE TABLE `flights` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text,
	`sequence` integer,
	`origin_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`departure` text NOT NULL,
	`arrival` text,
	`airline` text,
	`flight_number` text,
	`aircraft_type` text,
	`aircraft_registration` text,
	`seat` text,
	`cabin_class` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`origin_id`) REFERENCES `airports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_id`) REFERENCES `airports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`created_at` integer NOT NULL
);
