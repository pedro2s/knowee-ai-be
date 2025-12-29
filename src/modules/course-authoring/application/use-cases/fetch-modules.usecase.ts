import { Inject, Injectable } from '@nestjs/common';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

@Injectable()
export class FetchModulesUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
	) {}

	execute(courseId: string, userId: string): Promise<Module[]> {
		return this.moduleRepository.findAllByCourseId(courseId, {
			userId,
			role: 'authenticated',
		});
	}
}
