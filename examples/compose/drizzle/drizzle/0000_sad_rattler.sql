CREATE TABLE "Member" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Task" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"projectId" text NOT NULL,
	"assigneeId" text
);
--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_Member_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."Member"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "Task_projectId_idx" ON "Task" USING btree ("projectId");