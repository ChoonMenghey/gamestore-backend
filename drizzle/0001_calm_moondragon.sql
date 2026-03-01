CREATE TYPE "public"."game_status" AS ENUM('Available', 'Pending', 'Not Available');--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "status" "game_status" DEFAULT 'Available' NOT NULL;