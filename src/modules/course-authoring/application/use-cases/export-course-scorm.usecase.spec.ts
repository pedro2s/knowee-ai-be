import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ExportCourseScormUseCase } from './export-course-scorm.usecase';
import type { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import type {
	ScormPackageGeneratorPort,
	ScormPackageGeneratorResult,
} from '../../domain/ports/scorm-package-generator.port';

describe('ExportCourseScormUseCase', () => {
	let useCase: ExportCourseScormUseCase;
	let courseRepository: jest.Mocked<CourseRepositoryPort>;
	let scormPackageGenerator: jest.Mocked<ScormPackageGeneratorPort>;

	beforeEach(() => {
		courseRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveCourseTree: jest.fn(),
		};

		scormPackageGenerator = {
			generate: jest.fn(),
		};

		useCase = new ExportCourseScormUseCase(
			courseRepository,
			scormPackageGenerator
		);
	});

	it('deve chamar o gerador com curso mapeado e retornar metadados do pacote', async () => {
		const cleanup = jest.fn(() => Promise.resolve());
		const generatorResult: ScormPackageGeneratorResult = {
			zipPath: '/tmp/fake.zip',
			fileName: 'curso.zip',
			cleanup,
		};

		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso de Teste',
				description: 'Descricao',
				category: 'Cat',
				level: 'Beginner',
				duration: 'PT1H',
				targetAudience: 'Publico',
				objectives: 'Objetivo',
				modules: [
					{
						id: 'module-1',
						title: 'Modulo 1',
						description: 'Desc modulo',
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula video',
								description: 'Desc aula',
								lessonType: 'video',
								duration: 120,
								content: {
									scriptSections: [{ id: 'section-1', content: 'texto' }],
									finalVideoPath: 'user-1/lesson-1/video.mp4',
								},
							},
							{
								id: 'lesson-2',
								title: 'Quiz',
								description: 'Teste',
								lessonType: 'quiz',
								duration: 15,
								content: {
									quizQuestions: [
										{
											id: 'q1',
											question: 'Pergunta',
											options: ['A', 'B', 'C', 'D'],
											correctAnswer: 0,
										},
									],
								},
							},
						],
					},
				],
			}),
		} as never);

		scormPackageGenerator.generate.mockResolvedValue(generatorResult);

		const result = await useCase.execute('course-1', 'user-1', {
			exportFormat: 'scorm',
		});

		expect(result).toBe(generatorResult);
		expect(scormPackageGenerator.generate).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'course-1',
				modules: [
					expect.objectContaining({
						lessons: expect.arrayContaining([
							expect.objectContaining({
								id: 'lesson-1',
								mediaSourcePath: 'user-1/lesson-1/video.mp4',
								shouldUseVideoFallback: false,
							}),
						]),
					}),
				],
			})
		);
	});

	it('deve rejeitar export quando aula de video nao tiver finalVideoPath', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso de Teste',
				description: null,
				category: null,
				level: null,
				duration: null,
				targetAudience: null,
				objectives: null,
				modules: [
					{
						id: 'module-1',
						title: 'Modulo 1',
						description: null,
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula video',
								description: null,
								lessonType: 'video',
								duration: null,
								content: {
									scriptSections: [{ id: 'section-1', content: 'texto' }],
								},
							},
						],
					},
				],
			}),
		} as never);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new PreconditionFailedException(
				'A aula de video nao possui video final pronto para exportacao.'
			)
		);
	});

	it('deve rejeitar export quando aula pdf nao tiver arquivo', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso de Teste',
				description: null,
				category: null,
				level: null,
				duration: null,
				targetAudience: null,
				objectives: null,
				modules: [
					{
						id: 'module-1',
						title: 'Modulo 1',
						description: null,
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula PDF',
								description: null,
								lessonType: 'pdf',
								duration: null,
								content: {},
							},
						],
					},
				],
			}),
		} as never);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new PreconditionFailedException(
				'A aula PDF precisa de um arquivo anexado antes da exportacao.'
			)
		);
	});

	it('deve rejeitar export quando aula external nao tiver url', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso de Teste',
				description: null,
				category: null,
				level: null,
				duration: null,
				targetAudience: null,
				objectives: null,
				modules: [
					{
						id: 'module-1',
						title: 'Modulo 1',
						description: null,
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula externa',
								description: null,
								lessonType: 'external',
								duration: null,
								content: {},
							},
						],
					},
				],
			}),
		} as never);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new PreconditionFailedException(
				'A aula externa precisa de uma URL valida antes da exportacao.'
			)
		);
	});

	it('deve lançar NotFoundException quando curso não existir', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute('missing-course', 'user-1')).rejects.toThrow(
			new NotFoundException('Curso não encontrado')
		);
	});
});
