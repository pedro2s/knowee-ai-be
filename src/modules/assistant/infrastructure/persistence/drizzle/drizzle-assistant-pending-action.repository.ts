import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssistantPendingAction } from 'src/modules/assistant/domain/entities/assistant-pending-action.entity';
import { AssistantPendingActionRepositoryPort } from 'src/modules/assistant/domain/ports/assistant-pending-action-repository.port';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/database/domain/ports/db-context.port';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { AssistantPendingActionMapper } from './mappers/assistant-pending-action.mapper';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleAssistantPendingActionRepository implements AssistantPendingActionRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	save(
		action: AssistantPendingAction,
		auth: AuthContext
	): Promise<AssistantPendingAction> {
		const data = AssistantPendingActionMapper.toPersistence(action);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [saved] = await tx
				.insert(schema.assistantPendingActions)
				.values(data)
				.onConflictDoUpdate({
					target: schema.assistantPendingActions.id,
					set: data,
				})
				.returning();

			return AssistantPendingActionMapper.toDomain(saved);
		});
	}

	findPendingByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<AssistantPendingAction | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const pending = await tx.query.assistantPendingActions.findFirst({
				where: and(
					eq(schema.assistantPendingActions.courseId, courseId),
					eq(schema.assistantPendingActions.userId, auth.userId),
					eq(schema.assistantPendingActions.status, 'pending')
				),
				orderBy: [desc(schema.assistantPendingActions.createdAt)],
			});

			return pending ? AssistantPendingActionMapper.toDomain(pending) : null;
		});
	}
}
