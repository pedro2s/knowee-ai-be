import { v4 as uuidv4 } from 'uuid';
import { CreateLessonInput } from './lesson.types';
import { LessonProps } from './lesson.types';

export class Lesson {
	/** O estado é privado! O Drizzle não toca aqui */
	private constructor(private readonly props: LessonProps) {}

	/** FACTORY METHOD: Para criar novas aulas na aplicação (Regra de Negócio) */
	static create(input: CreateLessonInput): Lesson {
		// Regras de Negócio aqui
		return new Lesson({
			id: uuidv4(),
			moduleId: input.moduleId,
			courseId: input.courseId,
			title: input.title,
			description: input.description || null,
			lessonType: input.lessonType,
			content: input.content || null,
			assets: input.assets || null,
			orderIndex: input.orderIndex,
			duration: input.duration || null,
			isPublished: input.isPublished || false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * RECONSTITUITION METHOD: Para o Mapper recriar a entidade vinda do Banco.
	 */
	// Aqui não rodamos validação de criação, pois confiamos no banco.
	static restore(props: LessonProps): Lesson {
		return new Lesson(props);
	}

	get id() {
		return this.props.id;
	}

	get moduleId() {
		return this.props.moduleId;
	}

	get title() {
		return this.props.title;
	}

	get description() {
		return this.props.description;
	}

	get lessonType() {
		return this.props.lessonType;
	}

	get content() {
		return this.props.content;
	}

	get assets() {
		return this.props.assets;
	}

	get orderIndex() {
		return this.props.orderIndex;
	}

	get duration() {
		return this.props.duration;
	}

	get createdAt() {
		return this.props.createdAt;
	}

	get updatedAt() {
		return this.props.updatedAt;
	}

	/**
	 * O SEGREDO DO MAPPER: Método para extrair dados brutos.
	 * Retorna uma cópia do estado para não quebrar o encapsulamento
	 */
	public toPrimitives() {
		return { ...this.props };
	}
}
