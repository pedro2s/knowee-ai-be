import { HistoryMessage } from '../value-objects/history-message.vo';
import { CreateHistoryInput, HistoryProps } from './history.type';

export class History {
	private constructor(private readonly props: HistoryProps) {}

	/** FACTORY METHOD: Para criar novos históricos */
	static create(input: CreateHistoryInput): History {
		const { role, content } = input.message as {
			role: 'user' | 'assistant' | 'system';
			content: string;
		};
		const messageVO = HistoryMessage.create(role, content);

		return new History({
			id: crypto.randomUUID(),
			userId: input.userId,
			courseId: input.courseId,
			message: messageVO,
			createdAt: new Date(),
		});
	}

	/** RECONSTITUITION METHOD: Para reconstruir um histórico a partir de dados persistidos */
	static restore(props: HistoryProps): History {
		return new History(props);
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

	get message() {
		return this.props.message.value;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	/** Retorna os dados primitivos do histórico */
	public toPrimitives() {
		return {
			...this.props,
			message: this.props.message.value,
		};
	}
}
