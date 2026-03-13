import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class GetModuleUseCase {
	constructor(private readonly moduleRepository: ModuleRepositoryPort) {}

	async execute(moduleId: string, userId: string): Promise<Module> {
		const module = await this.moduleRepository.findById(moduleId, {
			userId,
			role: 'authenticated',
		});

		if (!module) throw new NotFoundException('Módulo não encontrado');

		return module;
	}
}
