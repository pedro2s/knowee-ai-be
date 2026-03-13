import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class DeleteModuleUseCase {
	constructor(private readonly moduleRepository: ModuleRepositoryPort) {}

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
