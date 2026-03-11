import { Inject, Injectable } from '@nestjs/common';
import {
	DB_CONTEXT,
	type AuthContext,
	type DbContext,
} from 'src/shared/database/domain/ports/db-context.port';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
	CreateGenerationJobInput,
	GenerationJob,
	UpdateGenerationJobInput,
} from '../../../domain/entities/generation-job.types';
import { GenerationJobRepositoryPort } from '../../../domain/ports/generation-job-repository.port';
import { GenerationJobDescriptorService } from '../../../application/services/generation-job-descriptor.service';

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
					jobFamily: input.jobFamily ?? 'course',
					jobIntent: input.jobIntent ?? 'Gerando curso',
					phase: input.phase ?? 'structure',
					progress: input.progress ?? 0,
					dedupeKey: input.dedupeKey ?? null,
					targetLabel: input.targetLabel ?? null,
					scopeCourseId: input.scope?.courseId ?? null,
					scopeLessonId: input.scope?.lessonId ?? null,
					scopeSectionId: input.scope?.sectionId ?? null,
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
		const [job] = await this.findActiveJobsByCourseId(courseId, auth);
		return job ?? null;
	}

	async findActiveJobsByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<GenerationJob[]> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const jobs = await tx.query.generationJobs.findMany({
				where: and(
					eq(schema.generationJobs.courseId, courseId),
					inArray(schema.generationJobs.status, ['pending', 'processing'])
				),
				orderBy: [
					sql`CASE
						WHEN ${schema.generationJobs.jobType} = 'course_generation' THEN 1
						WHEN ${schema.generationJobs.jobType} = 'assets_generation' THEN 2
						ELSE 3
					END`,
					desc(schema.generationJobs.updatedAt),
				],
			});

			return jobs.map((job) => this.toDomain(job));
		});
	}

	async findActiveByDedupeKey(
		dedupeKey: string,
		auth: AuthContext
	): Promise<GenerationJob | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const job = await tx.query.generationJobs.findFirst({
				where: and(
					eq(schema.generationJobs.dedupeKey, dedupeKey),
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
			const { scope, ...rest } = input;
			const [updated] = await tx
				.update(schema.generationJobs)
				.set({
					...rest,
					scopeCourseId: scope?.courseId,
					scopeLessonId: scope?.lessonId,
					scopeSectionId: scope?.sectionId,
					startedAt: rest.startedAt ? rest.startedAt.toISOString() : null,
					heartbeatAt: rest.heartbeatAt ? rest.heartbeatAt.toISOString() : null,
					completedAt: rest.completedAt
						? rest.completedAt.toISOString()
						: rest.completedAt,
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
		const fallbackDescriptor =
			GenerationJobDescriptorService.fallbackFromMetadata(
				raw.jobType as GenerationJob['jobType'],
				(raw.metadata ?? {}) as GenerationJob['metadata'],
				raw.courseId
			);

		return {
			id: raw.id,
			userId: raw.userId,
			courseId: raw.courseId,
			status: raw.status as GenerationJob['status'],
			jobType: raw.jobType as GenerationJob['jobType'],
			jobFamily:
				(raw.jobFamily as GenerationJob['jobFamily']) ??
				fallbackDescriptor.jobFamily,
			jobIntent: raw.jobIntent ?? fallbackDescriptor.jobIntent,
			phase: raw.phase as GenerationJob['phase'],
			progress: raw.progress,
			dedupeKey: raw.dedupeKey ?? fallbackDescriptor.dedupeKey,
			targetLabel: raw.targetLabel ?? fallbackDescriptor.targetLabel,
			scope: {
				courseId:
					raw.scopeCourseId ??
					raw.courseId ??
					fallbackDescriptor.scope.courseId,
				lessonId: raw.scopeLessonId ?? fallbackDescriptor.scope.lessonId,
				sectionId: raw.scopeSectionId ?? fallbackDescriptor.scope.sectionId,
			},
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
