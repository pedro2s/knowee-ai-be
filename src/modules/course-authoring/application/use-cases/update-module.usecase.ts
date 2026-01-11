import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';
import { UpdateModuleDto } from '../dtos/update-module.dto';

@Injectable()
export class UpdateModuleUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort
	) {}

	async execute(
		moduleId: string,
		updateData: UpdateModuleDto,
		userId: string
	): Promise<Module> {
		const updatedModule = await this.moduleRepository.update(
			moduleId,
			updateData,
			{
				userId,
				role: 'authenticated',
			}
		);

		if (!updatedModule) throw new NotFoundException('Módulo não encontrado');

		return updatedModule;
	}
}
