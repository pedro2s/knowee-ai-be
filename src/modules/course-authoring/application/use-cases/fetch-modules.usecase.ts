import { Injectable } from '@nestjs/common';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class FetchModulesUseCase {
	constructor(private readonly moduleRepository: ModuleRepositoryPort) {}

	execute(courseId: string, userId: string): Promise<Module[]> {
		return this.moduleRepository.findAllByCourseId(courseId, {
			userId,
			role: 'authenticated',
		});
	}
}
