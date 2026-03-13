import {
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { GeneratedLesson } from '../../domain/entities/course.types';
import { Module } from '../../domain/entities/module.entity';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';

export interface CreateModuleTreeInput {
	courseId: string;
	title: string;
	description?: string;
	orderIndex: number;
	lessons?: Array<{
		title: string;
		description?: string;
		orderIndex: number;
		lessonType: string;
		content?: Record<string, unknown>;
	}>;
}

@Injectable()
export class CreateModuleTreeUseCase {
	private readonly logger = new Logger(CreateModuleTreeUseCase.name);

	constructor(private readonly moduleRepository: ModuleRepositoryPort) {}

	async execute(input: CreateModuleTreeInput, userId: string): Promise<Module> {
		const lessons: GeneratedLesson[] = (input.lessons ?? []).map((lesson) => ({
			title: lesson.title,
			description: lesson.description ?? '',
			orderIndex: lesson.orderIndex,
			lessonType: lesson.lessonType,
			content: lesson.content ?? {},
		}));

		try {
			return await this.moduleRepository.saveModuleTree(
				{
					courseId: input.courseId,
					title: input.title,
					description: input.description ?? '',
					orderIndex: input.orderIndex,
					lessons,
				},
				{
					userId,
					role: 'authenticated',
				}
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Erro desconhecido';
			this.logger.error(
				`Falha ao criar modulo com aulas para o curso ${input.courseId} (titulo: ${input.title}, lessons: ${lessons.length}, orderIndex: ${input.orderIndex}). Erro original: ${errorMessage}`,
				error instanceof Error ? error.stack : undefined
			);
			throw new InternalServerErrorException(
				`Não foi possível criar o módulo com aulas. Motivo: ${errorMessage}`
			);
		}
	}
}
