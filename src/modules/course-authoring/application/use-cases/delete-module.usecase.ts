import {
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';
import { AuthContext } from 'src/shared/application/ports/db-context.port';

@Injectable()
export class DeleteModuleUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort
	) {}

	async execute(
		moduleId: string,
		userId: string
	): Promise<{ deletedModule: Module }> {
		const deletedModule = await this.moduleRepository.delete(moduleId, {
			userId,
			role: 'authenticated',
		});

		if (!deletedModule) throw new NotFoundException('Módulo não encontrado');

		return { deletedModule };
	}
}
