export class CourseTitle {
	private readonly _value: string;

	private constructor(value: string) {
		this._value = value;
	}

	/** Factory Method: O único jeito de criar um título é passando pela validação */
	public static create(title: string): CourseTitle {
		if (!title || title.trim().length < 5) {
			throw new Error(
				'O título do curso deve ter no mínimo 5 caracteres.',
			);
		}
		if (title.length > 100) {
			throw new Error(
				'O título do curso deve ter no máximo 100 caracteres.',
			);
		}
		// Aqui poderia adicionar regex para sanitização, etc.

		return new CourseTitle(title.trim());
	}

	/** Getter para recuperar o valor primitivo (usado pelo Mapper) */
	get value(): string {
		return this._value;
	}

	/** Exemplo de método utilitário dentro do VO */
	public toSlug(): string {
		return this._value.toLowerCase().replace(/\s+/g, '-');
	}
}
