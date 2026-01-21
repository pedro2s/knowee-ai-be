import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class GetModuleUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort
	) {}

	async execute(moduleId: string, userId: string): Promise<Module> {
		const module = await this.moduleRepository.findById(moduleId, {
			userId,
			role: 'authenticated',
		});

		if (!module) throw new NotFoundException('Módulo não encontrado');

		return module;
	}
}
