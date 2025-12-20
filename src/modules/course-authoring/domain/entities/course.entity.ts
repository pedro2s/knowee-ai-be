import { v4 as uuidv4 } from 'uuid';
import { CourseProps, CreateCourseInput } from './course.types';
import { CourseTitle } from '../value-objects/course-title.vo';
import { Module } from './module.entity';

export class Course {
	/** O estado é privado! O Drizzle não toca aqui */
	private constructor(private readonly props: CourseProps) {}

	/** FACTORY METHOD: Para criar novos cursos na aplicação (Regra de Negócio) */
	static create(input: CreateCourseInput): Course {
		// Cria o VO. Se for inválido, estoura o erro aqui mesmo.
		const titleVO = CourseTitle.create(input.title);

		return new Course({
			id: uuidv4(),
			title: titleVO,
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
	 */
	// Aqui não rodamos validação de criação, pois confiamos no banco.
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

	// Getters podem expor o VO ou o valor primitivo, depende da sua estratégia.
	// Geralmente expor o valor primitivo facilita para a camada de View/DTO
	get title(): string {
		return this.props.title.value;
	}

	// Se precisar acessar métodos do VO (ex: slug)
	get slug(): string {
		return this.props.title.toSlug();
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

	get modules(): Module[] | undefined {
		return this.props.modules;
	}

	/**
	 * O SEGREDO DO MAPPER: Método para extrair dados brutos.
	 * Retorna uma cópia do estado para não quebrar o encapsulamento
	 */
	public toPrimitives() {
		return {
			...this.props,
			title: this.props.title.value,
			modules: this.props.modules?.map((module) => module.toPrimitives()),
		};
	}
}
