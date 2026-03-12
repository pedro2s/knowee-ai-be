jest.mock('uuid', () => ({
	v4: () => 'module-generated-id',
}));

import { InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateModuleTreeUseCase } from './create-module-tree.usecase';
import type { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { Module } from '../../domain/entities/module.entity';

describe('CreateModuleTreeUseCase', () => {
	it('deve criar modulo com aulas e content default vazio', async () => {
		const savedModule = Module.create({
			courseId: 'course-1',
			title: 'Modulo 1',
			description: 'Descricao',
			orderIndex: 1,
		});
		const moduleRepository = {
			saveModuleTree: jest.fn().mockResolvedValue(savedModule),
		} as unknown as jest.Mocked<ModuleRepositoryPort>;

		const useCase = new CreateModuleTreeUseCase(moduleRepository);

		await expect(
			useCase.execute(
				{
					courseId: 'course-1',
					title: 'Modulo 1',
					description: 'Descricao',
					orderIndex: 1,
					lessons: [
						{
							title: 'Aula 1',
							description: 'Introducao',
							orderIndex: 2,
							lessonType: 'article',
						},
					],
				},
				'user-1'
			)
		).resolves.toBe(savedModule);

		expect(moduleRepository.saveModuleTree).toHaveBeenCalledWith(
			{
				courseId: 'course-1',
				title: 'Modulo 1',
				description: 'Descricao',
				orderIndex: 1,
				lessons: [
					{
						title: 'Aula 1',
						description: 'Introducao',
						orderIndex: 2,
						lessonType: 'article',
						content: {},
					},
				],
			},
			{ userId: 'user-1', role: 'authenticated' }
		);
	});

	it('deve encapsular falha de persistencia', async () => {
		const loggerError = jest
			.spyOn(Logger.prototype, 'error')
			.mockImplementation(() => undefined);
		const moduleRepository = {
			saveModuleTree: jest.fn().mockRejectedValue(new Error('db boom')),
		} as unknown as jest.Mocked<ModuleRepositoryPort>;

		const useCase = new CreateModuleTreeUseCase(moduleRepository);

		await expect(
			useCase.execute(
				{
					courseId: 'course-1',
					title: 'Modulo 1',
					orderIndex: 1,
				},
				'user-1'
			)
		).rejects.toMatchObject(
			new InternalServerErrorException(
				'Não foi possível criar o módulo com aulas. Motivo: db boom'
			)
		);

		expect(loggerError).toHaveBeenCalled();
		loggerError.mockRestore();
	});
});
