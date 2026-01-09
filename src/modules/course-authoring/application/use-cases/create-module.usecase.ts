import {
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { CreateModuleDto } from '../dtos/create-module.dto';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class CreateModuleUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort
	) {}

	async execute(input: CreateModuleDto, userId: string): Promise<Module> {
		const module = Module.create({
			courseId: input.courseId,
			title: input.title,
			description: input.description,
			orderIndex: input.orderIndex,
		});

		try {
			await this.moduleRepository.create(module, {
				userId,
				role: 'authenticated',
			});
		} catch (error) {
			throw new InternalServerErrorException(
				'Não foi possível criar o módulo.'
			);
		}

		return module;
	}
}
