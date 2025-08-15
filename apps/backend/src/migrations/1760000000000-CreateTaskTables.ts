import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTaskTables1760000000000 implements MigrationInterface {
    name = 'CreateTaskTables1760000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create task type scope enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."task_type_scope_enum" AS ENUM('system', 'organization');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create task types table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "scope" "public"."task_type_scope_enum" NOT NULL DEFAULT 'organization',
                "organizationId" uuid,
                "metadata" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "icon" character varying,
                "color" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task_types" PRIMARY KEY ("id")
            )
        `);

        // Create task lifecycle events table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task_lifecycle_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "taskTypeId" uuid NOT NULL,
                "order" integer NOT NULL,
                "color" character varying,
                "icon" character varying,
                "isFinal" boolean NOT NULL DEFAULT false,
                "isInitial" boolean NOT NULL DEFAULT false,
                "allowedTransitions" jsonb,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task_lifecycle_events" PRIMARY KEY ("id")
            )
        `);

        // Create task priority enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."task_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create task status enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."task_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create tasks table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tasks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text,
                "taskTypeId" uuid NOT NULL,
                "assigneeId" uuid,
                "createdById" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "status" "public"."task_status_enum" NOT NULL DEFAULT 'pending',
                "currentLifecycleEventId" uuid,
                "priority" "public"."task_priority_enum" NOT NULL DEFAULT 'medium',
                "dueDate" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "metadata" jsonb,
                "tags" text[] DEFAULT '{}',
                "parentTaskId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
            )
        `);

        // Create task history table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "taskId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "action" character varying NOT NULL,
                "description" text,
                "fromStatus" character varying,
                "toStatus" character varying,
                "fromLifecycleEventId" uuid,
                "toLifecycleEventId" uuid,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task_history" PRIMARY KEY ("id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "task_types" ADD CONSTRAINT "FK_task_types_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_lifecycle_events" ADD CONSTRAINT "FK_task_lifecycle_events_task_type" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_task_type" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_parent" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_history" ADD CONSTRAINT "FK_task_history_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_history" ADD CONSTRAINT "FK_task_history_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_task_types_organization" ON "task_types" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_task_types_scope" ON "task_types" ("scope")`);
        await queryRunner.query(`CREATE INDEX "IDX_task_lifecycle_events_task_type" ON "task_lifecycle_events" ("taskTypeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_organization" ON "tasks" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_assignee" ON "tasks" ("assigneeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_priority" ON "tasks" ("priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_due_date" ON "tasks" ("dueDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_task_history_task" ON "task_history" ("taskId")`);
        await queryRunner.query(`CREATE INDEX "IDX_task_history_user" ON "task_history" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_history_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_history_task"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_due_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_priority"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_assignee"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_organization"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_lifecycle_events_task_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_types_scope"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_types_organization"`);

        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT IF EXISTS "FK_task_history_user"`);
        await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT IF EXISTS "FK_task_history_task"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_parent"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_organization"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_created_by"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_assignee"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "FK_tasks_task_type"`);
        await queryRunner.query(`ALTER TABLE "task_lifecycle_events" DROP CONSTRAINT IF EXISTS "FK_task_lifecycle_events_task_type"`);
        await queryRunner.query(`ALTER TABLE "task_types" DROP CONSTRAINT IF EXISTS "FK_task_types_organization"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "task_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "task_lifecycle_events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "task_types"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."task_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."task_priority_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."task_type_scope_enum"`);
    }
}