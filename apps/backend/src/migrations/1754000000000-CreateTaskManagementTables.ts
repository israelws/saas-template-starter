import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskManagementTables1754000000000 implements MigrationInterface {
  name = 'CreateTaskManagementTables1754000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create task_types table
    await queryRunner.query(`
      CREATE TYPE "task_type_scope_enum" AS ENUM('system', 'organization');
    `);

    await queryRunner.query(`
      CREATE TABLE "task_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "scope" "task_type_scope_enum" NOT NULL DEFAULT 'organization',
        "organizationId" uuid,
        "metadata" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "icon" character varying,
        "color" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_types" PRIMARY KEY ("id")
      );
    `);

    // Create task_lifecycle_events table
    await queryRunner.query(`
      CREATE TABLE "task_lifecycle_events" (
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
      );
    `);

    // Create tasks table
    await queryRunner.query(`
      CREATE TYPE "task_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent');
    `);

    await queryRunner.query(`
      CREATE TYPE "task_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "taskTypeId" uuid NOT NULL,
        "assigneeId" uuid,
        "createdById" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "status" "task_status_enum" NOT NULL DEFAULT 'pending',
        "currentLifecycleEventId" uuid,
        "priority" "task_priority_enum" NOT NULL DEFAULT 'medium',
        "dueDate" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "metadata" jsonb,
        "tags" text[] DEFAULT '{}',
        "parentTaskId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
      );
    `);

    // Create task_history table
    await queryRunner.query(`
      CREATE TABLE "task_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "action" character varying NOT NULL,
        "description" text,
        "fromStatus" character varying,
        "toStatus" character varying,
        "fromLifecycleEventId" uuid,
        "toLifecycleEventId" uuid,
        "userId" uuid NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_history" PRIMARY KEY ("id")
      );
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "task_types"
      ADD CONSTRAINT "FK_task_types_organization"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "task_lifecycle_events"
      ADD CONSTRAINT "FK_task_lifecycle_events_task_type"
      FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_task_type"
      FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_assignee"
      FOREIGN KEY ("assigneeId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_created_by"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_organization"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_parent"
      FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "task_history"
      ADD CONSTRAINT "FK_task_history_task"
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "task_history"
      ADD CONSTRAINT "FK_task_history_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    // Create indexes for better performance
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

    // Insert default system task types
    await queryRunner.query(`
      INSERT INTO "task_types" ("name", "description", "scope", "icon", "color")
      VALUES 
        ('General Task', 'General purpose task', 'system', 'clipboard', '#6B7280'),
        ('Bug Report', 'Track and resolve bugs', 'system', 'bug', '#EF4444'),
        ('Feature Request', 'New feature development', 'system', 'sparkles', '#10B981'),
        ('Support Ticket', 'Customer support requests', 'system', 'headphones', '#3B82F6'),
        ('Documentation', 'Documentation tasks', 'system', 'book-open', '#8B5CF6');
    `);

    // Insert default lifecycle events for General Task
    const generalTaskType = await queryRunner.query(`
      SELECT id FROM "task_types" WHERE name = 'General Task' AND scope = 'system'
    `);

    if (generalTaskType && generalTaskType.length > 0) {
      const taskTypeId = generalTaskType[0].id;
      await queryRunner.query(`
        INSERT INTO "task_lifecycle_events" ("name", "description", "taskTypeId", "order", "color", "icon", "isInitial", "isFinal", "allowedTransitions")
        VALUES 
          ('Todo', 'Task is created and waiting to be started', '${taskTypeId}', 1, '#6B7280', 'circle', true, false, '["In Progress"]'),
          ('In Progress', 'Task is being worked on', '${taskTypeId}', 2, '#3B82F6', 'clock', false, false, '["Review", "Blocked", "Done"]'),
          ('Review', 'Task is under review', '${taskTypeId}', 3, '#F59E0B', 'eye', false, false, '["In Progress", "Done"]'),
          ('Blocked', 'Task is blocked', '${taskTypeId}', 4, '#EF4444', 'x-circle', false, false, '["In Progress"]'),
          ('Done', 'Task is completed', '${taskTypeId}', 5, '#10B981', 'check-circle', false, true, '[]');
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_task_history_user"`);
    await queryRunner.query(`DROP INDEX "IDX_task_history_task"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_priority"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_assignee"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_task_lifecycle_events_task_type"`);
    await queryRunner.query(`DROP INDEX "IDX_task_types_scope"`);
    await queryRunner.query(`DROP INDEX "IDX_task_types_organization"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_task_history_user"`);
    await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_task_history_task"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_parent"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_organization"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_created_by"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_task_type"`);
    await queryRunner.query(`ALTER TABLE "task_lifecycle_events" DROP CONSTRAINT "FK_task_lifecycle_events_task_type"`);
    await queryRunner.query(`ALTER TABLE "task_types" DROP CONSTRAINT "FK_task_types_organization"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "task_history"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "task_lifecycle_events"`);
    await queryRunner.query(`DROP TABLE "task_types"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "task_status_enum"`);
    await queryRunner.query(`DROP TYPE "task_priority_enum"`);
    await queryRunner.query(`DROP TYPE "task_type_scope_enum"`);
  }
}