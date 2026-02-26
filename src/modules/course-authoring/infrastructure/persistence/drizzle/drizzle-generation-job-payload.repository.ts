import { Inject, Injectable } from '@nestjs/common';
import {
	DB_CONTEXT,
	type AuthContext,
	type DbContext,
} from 'src/shared/database/domain/ports/db-context.port';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { eq } from 'drizzle-orm';
import { GenerationJobPayloadRepositoryPort } from '../../../domain/ports/generation-job-payload-repository.port';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleGenerationJobPayloadRepository implements GenerationJobPayloadRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async save(
		input: {
			jobId: string;
			userId: string;
			payload: Record<string, unknown>;
		},
		auth: AuthContext
	): Promise<void> {
		await this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			await tx
				.insert(schema.generationJobPayloads)
				.values({
					jobId: input.jobId,
					userId: input.userId,
					payload: input.payload,
				})
				.onConflictDoUpdate({
					target: schema.generationJobPayloads.jobId,
					set: {
						payload: input.payload,
						updatedAt: new Date().toISOString(),
					},
				});
		});
	}

	async findByJobId(
		jobId: string,
		auth: AuthContext
	): Promise<Record<string, unknown> | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const row = await tx.query.generationJobPayloads.findFirst({
				where: eq(schema.generationJobPayloads.jobId, jobId),
			});
			if (!row) {
				return null;
			}

			return row.payload as Record<string, unknown>;
		});
	}

	async deleteByJobId(jobId: string, auth: AuthContext): Promise<void> {
		await this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			await tx
				.delete(schema.generationJobPayloads)
				.where(eq(schema.generationJobPayloads.jobId, jobId));
		});
	}
}
