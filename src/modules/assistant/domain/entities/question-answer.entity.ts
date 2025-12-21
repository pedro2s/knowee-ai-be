import {
	QuestionAnswerInput,
	QuestionAnswerProps,
} from './question-answer.types';
import { v4 as uuidv4 } from 'uuid';

export class QuestionAnswer {
	private constructor(private readonly props: QuestionAnswerProps) {}

	/** FACTORY METHOD: Para criar novas question answer (Regra de Negócio) */
	static create(input: QuestionAnswerInput): QuestionAnswer {
		return new QuestionAnswer({
			id: uuidv4(),
			userId: input.userId,
			courseId: input.courseId,
			question: input.question,
			answer: input.answer,
			createdAt: new Date(),
		});
	}

	/** RECONSTITUITION METHOD: Para o Mapper recriar a entidade vinda do banco. */
	static restore(props: QuestionAnswerProps): QuestionAnswer {
		return new QuestionAnswer(props);
	}

	// GETTERS (Apenas leitura)
	get id(): string {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get courseId(): string {
		return this.props.courseId;
	}

	get question(): string {
		return this.props.question;
	}

	get answer(): string {
		return this.props.answer;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	/** Retorna dados brutos do estado para não quebrar o encapsulamento */
	public toPrimitives() {
		return {
			...this.props,
		};
	}
}
