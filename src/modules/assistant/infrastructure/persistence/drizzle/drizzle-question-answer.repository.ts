import { Inject, Injectable } from '@nestjs/common';
import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { QuestionAnswerRepositoryPort } from 'src/modules/assistant/domain/ports/question-anwer-repository.port';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/application/ports/db-context.port';
import * as schema from 'src/shared/infrastructure/database/drizzle/schema';
import { QuestionAnswerMapper } from './mappers/question-answer.mapper';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleQuestionAnswerRepository implements QuestionAnswerRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	create(
		questionAnswer: QuestionAnswer,
		auth: AuthContext
	): Promise<QuestionAnswer> {
		const data = QuestionAnswerMapper.toPersistence(questionAnswer);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newQuestionAnswer] = await tx
				.insert(schema.questionsAnswers)
				.values(data)
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return QuestionAnswerMapper.toDomain(newQuestionAnswer);
		});
	}

	findAllByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<QuestionAnswer[]> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;

			const questionAnswers = await tx.query.questionsAnswers.findMany({
				where: eq(schema.questionsAnswers.courseId, courseId),
			});

			return questionAnswers.map(QuestionAnswerMapper.toDomain);
		});
	}
}
