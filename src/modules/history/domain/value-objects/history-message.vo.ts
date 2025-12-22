type MessageRole = 'user' | 'assistant' | 'system';

export class HistoryMessage {
	private _role: MessageRole;
	private _content: string;

	private constructor(role: MessageRole, content: string) {
		this._role = role;
		this._content = content;
	}

	public static create(role: MessageRole, content: string): HistoryMessage {
		if (!content || content.trim().length === 0) {
			throw new Error('O conteúdo da mensagem não pode ser vazio.');
		}
		return new HistoryMessage(role, content.trim());
	}

	get value() {
		return {
			role: this._role as string,
			content: this._content,
		};
	}
}
