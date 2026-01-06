type MessageRole =
	| 'function'
	| 'user'
	| 'assistant'
	| 'system'
	| 'developer'
	| 'tool';
type MessageContent = Array<{
	type: 'text';
	text: string;
}>;

export class HistoryMessage {
	private _role: MessageRole;
	private _content: string;

	private constructor(role: MessageRole, content: string) {
		this._role = role;
		this._content = content;
	}

	public static create(
		role: MessageRole,
		content: string | MessageContent,
	): HistoryMessage {
		if (
			!content ||
			(typeof content === 'string' && content.trim().length === 0)
		) {
			throw new Error('O conteúdo da mensagem não pode ser vazio.');
		}
		if (Array.isArray(content)) {
			const texts = content
				.filter((part) => part.type === 'text')
				.map((part) => part.text);
			content = texts.join('\n').trim();
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
