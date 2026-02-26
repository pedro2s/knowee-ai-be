import { Inject, Injectable } from '@nestjs/common';
import {
	DB_CONTEXT,
	type AuthContext,
	type DbContext,
} from 'src/shared/database/domain/ports/db-context.port';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
	CreateGenerationJobInput,
	GenerationJob,
	UpdateGenerationJobInput,
} from '../../../domain/entities/generation-job.types';
import { GenerationJobRepositoryPort } from '../../../domain/ports/generation-job-repository.port';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleGenerationJobRepository implements GenerationJobRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async create(
		input: CreateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [inserted] = await tx
				.insert(schema.generationJobs)
				.values({
					userId: input.userId,
					courseId: input.courseId ?? null,
					status: input.status ?? 'pending',
					jobType: input.jobType ?? 'course_generation',
					phase: input.phase ?? 'structure',
					progress: input.progress ?? 0,
					queueName: input.queueName ?? 'generation',
					queueJobId: input.queueJobId ?? null,
					attempts: input.attempts ?? 0,
					maxAttempts: input.maxAttempts ?? 3,
					metadata: input.metadata ?? {},
					startedAt: input.startedAt ? input.startedAt.toISOString() : null,
					heartbeatAt: input.heartbeatAt
						? input.heartbeatAt.toISOString()
						: null,
				})
				.returning();

			return this.toDomain(inserted);
		});
	}

	async findById(id: string, auth: AuthContext): Promise<GenerationJob | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const job = await tx.query.generationJobs.findFirst({
				where: eq(schema.generationJobs.id, id),
			});

			return job ? this.toDomain(job) : null;
		});
	}

	async findActiveByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<GenerationJob | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const job = await tx.query.generationJobs.findFirst({
				where: and(
					eq(schema.generationJobs.courseId, courseId),
					inArray(schema.generationJobs.status, ['pending', 'processing'])
				),
				orderBy: (table) => [desc(table.updatedAt)],
			});

			return job ? this.toDomain(job) : null;
		});
	}

	async update(
		id: string,
		input: UpdateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [updated] = await tx
				.update(schema.generationJobs)
				.set({
					...input,
					startedAt: input.startedAt ? input.startedAt.toISOString() : null,
					heartbeatAt: input.heartbeatAt
						? input.heartbeatAt.toISOString()
						: null,
					completedAt: input.completedAt
						? input.completedAt.toISOString()
						: input.completedAt,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.generationJobs.id, id))
				.returning();

			return updated ? this.toDomain(updated) : null;
		});
	}

	private toDomain(
		raw: typeof schema.generationJobs.$inferSelect
	): GenerationJob {
		return {
			id: raw.id,
			userId: raw.userId,
			courseId: raw.courseId,
			status: raw.status as GenerationJob['status'],
			jobType: raw.jobType as GenerationJob['jobType'],
			phase: raw.phase as GenerationJob['phase'],
			progress: raw.progress,
			queueName: raw.queueName,
			queueJobId: raw.queueJobId,
			attempts: raw.attempts,
			maxAttempts: raw.maxAttempts,
			metadata: (raw.metadata ?? {}) as GenerationJob['metadata'],
			error: raw.error,
			startedAt: raw.startedAt ? new Date(raw.startedAt) : null,
			heartbeatAt: raw.heartbeatAt ? new Date(raw.heartbeatAt) : null,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
			completedAt: raw.completedAt ? new Date(raw.completedAt) : null,
		};
	}
}
