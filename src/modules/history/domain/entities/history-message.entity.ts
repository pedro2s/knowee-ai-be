import { HistoryMessage } from './history-message.type';

export class HistoryMessageEntity {
	constructor(
		public readonly role: 'user' | 'assistant' | 'system',
		public readonly content: string,
	) {}

	toPlain(): HistoryMessage {
		return {
			role: this.role,
			content: this.content,
		};
	}

	static fromPlain(data: HistoryMessage): HistoryMessageEntity {
		return new HistoryMessageEntity(data.role, data.content);
	}
}
