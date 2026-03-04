import { CourseGenerationOrchestratorUseCase } from './course-generation-orchestrator.usecase';
import type { GenerateCourseUseCase } from './generate-course.usecase';
import type { GenerateLessonScriptUseCase } from './generate-lesson-script.usecase';
import type { GenerateLessonStoryboardUseCase } from './generate-lesson-storyboard.usecase';
import type { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import type { GenerationEventsService } from '../services/generation-events.service';
import type { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import type { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { MarkFreemiumSampleConsumedUseCase } from 'src/modules/access-control/application/use-cases/mark-freemium-sample-consumed.usecase';

describe('CourseGenerationOrchestratorUseCase', () => {
	let useCase: CourseGenerationOrchestratorUseCase;
	let generateCourseUseCase: jest.Mocked<GenerateCourseUseCase>;
	let generateLessonScriptUseCase: jest.Mocked<GenerateLessonScriptUseCase>;
	let generateLessonStoryboardUseCase: jest.Mocked<GenerateLessonStoryboardUseCase>;
	let generateSectionVideoUseCase: jest.Mocked<GenerateSectionVideoUseCase>;
	let generationEventsService: jest.Mocked<GenerationEventsService>;
	let generationJobRepository: jest.Mocked<GenerationJobRepositoryPort>;
	let courseRepository: jest.Mocked<CourseRepositoryPort>;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let markFreemiumSampleConsumedUseCase: jest.Mocked<MarkFreemiumSampleConsumedUseCase>;

	const input = {
		jobId: 'job-1',
		userId: 'user-1',
		data: {
			title: 'Curso',
			description: 'Descrição',
		} as never,
		files: [] as Express.Multer.File[],
	};

	beforeEach(() => {
		generateCourseUseCase = {
			execute: jest.fn().mockResolvedValue({ id: 'course-1' }),
		} as never;

		generateLessonScriptUseCase = {
			execute: jest.fn().mockResolvedValue({
				scriptSections: [{ id: 'section-1', content: 'texto' }],
			}),
		} as never;

		generateLessonStoryboardUseCase = {
			execute: jest.fn().mockResolvedValue({
				courseId: 'course-1',
				moduleId: 'module-1',
				lessonId: 'lesson-1',
				totalSections: 1,
				totalScenes: 3,
			}),
		} as never;

		generateSectionVideoUseCase = {
			execute: jest.fn().mockResolvedValue({
				videoUrl: 'https://cdn.test/demo.mp4',
			}),
		} as never;

		generationEventsService = {
			stream: jest.fn(),
			publish: jest.fn(),
		} as never;

		generationJobRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findActiveByCourseId: jest.fn(),
			update: jest.fn().mockResolvedValue(null),
		};

		courseRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn().mockResolvedValue({
				id: 'course-1',
				modules: [
					{
						id: 'module-1',
						lessons: [
							{
								id: 'lesson-1',
								title: 'Aula 1',
								description: 'desc',
								content: {},
							},
						],
					},
				],
			}),
			findAllByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveCourseTree: jest.fn(),
		};

		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn().mockResolvedValue({
				id: 'lesson-1',
				moduleId: 'module-1',
				content: {
					scriptSections: [{ id: 'section-1' }],
				},
			}),
			findAllByModuleId: jest.fn(),
			update: jest.fn().mockResolvedValue(null),
			delete: jest.fn(),
		};

		markFreemiumSampleConsumedUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as never;

		useCase = new CourseGenerationOrchestratorUseCase(
			generateCourseUseCase,
			generateLessonScriptUseCase,
			generateLessonStoryboardUseCase,
			generateSectionVideoUseCase,
			generationEventsService,
			generationJobRepository,
			courseRepository,
			lessonRepository,
			markFreemiumSampleConsumedUseCase
		);
	});

	it('emite demo_storyboard@75, demo_section_video started@75, demo_section_video completed@95 e completed@100 no caminho de sucesso', async () => {
		await useCase.run(input);

		const publishCalls = generationEventsService.publish.mock.calls;
		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.completed',
			expect.objectContaining({
				phase: 'demo_script',
				progress: 65,
				courseId: 'course-1',
			}),
		]);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.started',
			expect.objectContaining({
				phase: 'demo_storyboard',
				progress: 70,
				courseId: 'course-1',
			}),
		]);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.completed',
			expect.objectContaining({
				phase: 'demo_storyboard',
				progress: 75,
				courseId: 'course-1',
			}),
		]);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.started',
			expect.objectContaining({
				phase: 'demo_section_video',
				progress: 75,
				courseId: 'course-1',
			}),
		]);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.completed',
			expect.objectContaining({
				phase: 'demo_section_video',
				progress: 95,
				courseId: 'course-1',
				demoSectionVideoStatus: 'ready',
			}),
		]);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.completed',
			expect.objectContaining({
				courseId: 'course-1',
				progress: 100,
			}),
		]);

		const storyboardUpdateCall = generationJobRepository.update.mock.calls.find(
			(call) =>
				call[0] === 'job-1' &&
				call[1].phase === 'demo_storyboard' &&
				call[1].progress === 70
		);
		expect(storyboardUpdateCall).toBeDefined();
	});

	it('mantém fluxo best-effort quando vídeo demo falha e fecha demo_section_video em 95 com status failed', async () => {
		generateSectionVideoUseCase.execute.mockRejectedValueOnce(
			new Error('video failed')
		);

		await useCase.run(input);

		const publishCalls = generationEventsService.publish.mock.calls;
		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.completed',
			expect.objectContaining({
				phase: 'demo_section_video',
				progress: 95,
				demoSectionVideoStatus: 'failed',
			}),
		]);

		const completedUpdateCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completedUpdateCall?.[1].metadata).toEqual(
			expect.objectContaining({
				demoSectionVideoStatus: 'failed',
			})
		);
	});

	it('quando não há firstSection, marca demoSectionVideoStatus missing e fecha fase em 95 antes do done', async () => {
		lessonRepository.findById.mockResolvedValueOnce({
			id: 'lesson-1',
			moduleId: 'module-1',
			content: {
				scriptSections: [],
			},
		} as never);

		await useCase.run(input);

		const publishCalls = generationEventsService.publish.mock.calls;
		expect(
			publishCalls.some(
				(call) =>
					call[1] === 'generation.phase.started' &&
					(call[2] as { phase?: string }).phase === 'demo_section_video'
			)
		).toBe(false);

		expect(publishCalls).toContainEqual([
			'job-1',
			'generation.phase.completed',
			expect.objectContaining({
				phase: 'demo_section_video',
				progress: 95,
				demoSectionVideoStatus: 'missing',
			}),
		]);

		const phase95UpdateCall = generationJobRepository.update.mock.calls.find(
			(call) =>
				call[1].phase === 'demo_section_video' && call[1].progress === 95
		);
		expect(phase95UpdateCall).toBeDefined();

		const completedUpdateCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completedUpdateCall?.[1].metadata).toEqual(
			expect.objectContaining({
				demoSectionVideoStatus: 'missing',
			})
		);
	});
});
