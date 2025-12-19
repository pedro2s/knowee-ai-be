import { v4 as uuidv4 } from 'uuid';
import { CourseProps, CreateCourseInput } from './course.types';

export class Course {
	/** O estado é privado! O Drizzle não toca aqui */
	private constructor(private readonly props: CourseProps) {}

	/** FACTORY METHOD: Para criar novos cursos na aplicação (Regra de Negócio) */
	static create(input: CreateCourseInput): Course {
		// if (input.title.length < 5) {
		// 	throw new Error('O título do curso deve ter pelo menos 5 caracteres.')
		// }

		return new Course({
			id: uuidv4(),
			title: input.title,
			description: input.description || null,
			category: input.category || null,
			level: input.level || null,
			duration: input.duration || null,
			targetAudience: input.targetAudience || null,
			objectives: input.objectives || null,
			files: input.files || null,
			userId: input.userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * RECONSTITUITION METHOD: Para o Mapper recriar a entidade vinda do Banco.
	 * Aqui não rodamos validação de criação, pois confiamos no banco.
	 */
	static restore(props: CourseProps): Course {
		return new Course(props);
	}

	// GETTERS (Apenas leitura)
	get id(): string {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get title(): string {
		return this.props.title;
	}

	get description(): string | null {
		return this.props.description;
	}

	get category(): string | null {
		return this.props.category;
	}

	get level(): string | null {
		return this.props.level;
	}

	get duration(): string | null {
		return this.props.duration;
	}

	get targetAudience(): string | null {
		return this.props.targetAudience;
	}

	get objectives(): string | null {
		return this.props.objectives;
	}

	get files(): unknown {
		return this.props.files;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * O SEGREDO DO MAPPER: Método para extrair dados brutos.
	 * Retorna uma cópia do estado para não quebrar o encapsulamento
	 */
	public toPrimitives(): CourseProps {
		return { ...this.props };
	}
}
