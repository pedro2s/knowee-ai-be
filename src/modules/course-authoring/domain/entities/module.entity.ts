import { v4 as uuidv4 } from 'uuid';
import { ModuleProps, CreateModuleInput } from './module.types';

export class Module {
	/** O estado é privado! O Drizzle não toca aqui */
	private constructor(private readonly props: ModuleProps) {}

	/** FACTORY METHOD: Para criar novos modulos na aplicação (Regra de Negócio) */
	static create(input: CreateModuleInput): Module {
		// Regras de Negócio aqui

		return new Module({
			id: uuidv4(),
			courseId: input.courseId,
			title: input.title,
			description: input.description || null,
			orderIndex: input.orderIndex,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * RECONSTITUITION METHOD: Para o Mapper recriar a entidade vinda do Banco.
	 * Aqui não rodamos validação de criação, pois confiamos no banco.
	 */
	static restore(props: ModuleProps): Module {
		return new Module(props);
	}

	// GETTERS (Apenas leitura)
	get id(): string {
		return this.props.id;
	}

	get courseId(): string {
		return this.props.courseId;
	}

	get title(): string {
		return this.props.title;
	}

	get description(): string | null {
		return this.props.description;
	}

	get orderIndex(): number {
		return this.props.orderIndex;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * O SECREDO DO MAPPER: Método para extrair dados brutos.
	 * Retorna uma cópia do estado para não quebrar o encapsulamento
	 */
	public toPrimitives() {
		return { ...this.props };
	}
}
