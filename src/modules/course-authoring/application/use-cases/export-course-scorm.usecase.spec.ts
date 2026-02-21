import { NotFoundException } from '@nestjs/common';
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
				description: 'Descrição',
				category: 'Cat',
				level: 'Beginner',
				duration: 'PT1H',
				targetAudience: 'Público',
				objectives: 'Objetivo',
				modules: [
					{
						id: 'module-1',
						title: 'Módulo 1',
						description: 'Desc módulo',
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula vídeo',
								description: 'Desc aula',
								lessonType: 'video',
								duration: 120,
								content: { finalVideoUrl: 'https://cdn.exemplo/video.mp4' },
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
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const generateScormMock = scormPackageGenerator.generate;
		expect(generateScormMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'course-1',
				modules: [
					expect.objectContaining({
						lessons: [
							expect.objectContaining({
								resolvedMediaUrl: 'https://cdn.exemplo/video.mp4',
								shouldUseVideoFallback: false,
							}),
						],
					}),
				],
			})
		);
	});

	it('deve marcar fallback para aula de vídeo sem finalVideoUrl', async () => {
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
						title: 'Módulo 1',
						description: null,
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula vídeo',
								description: null,
								lessonType: 'video',
								duration: null,
								content: {},
							},
						],
					},
				],
			}),
		} as never);
		scormPackageGenerator.generate.mockResolvedValue({
			zipPath: '/tmp/fake.zip',
			fileName: 'curso.zip',
			cleanup: () => Promise.resolve(),
		});

		await useCase.execute('course-1', 'user-1');

		// eslint-disable-next-line @typescript-eslint/unbound-method
		const generateScormMock = scormPackageGenerator.generate;
		expect(generateScormMock).toHaveBeenCalledWith(
			expect.objectContaining({
				modules: [
					expect.objectContaining({
						lessons: [
							expect.objectContaining({
								resolvedMediaUrl: null,
								shouldUseVideoFallback: true,
							}),
						],
					}),
				],
			})
		);
	});

	it('deve lançar NotFoundException quando curso não existir', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute('missing-course', 'user-1')).rejects.toThrow(
			new NotFoundException('Curso não encontrado')
		);
	});
});
