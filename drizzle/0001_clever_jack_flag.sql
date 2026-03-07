ALTER TABLE "games" RENAME COLUMN "developer_name" TO "developer_id";--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "banner_cld_pub_id" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_developer_id_user_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_developer_id_idx" ON "games" USING btree ("developer_id");