import { AssetsGenerationOrchestratorUseCase } from './assets-generation-orchestrator.usecase';
import type { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { GenerationEventsService } from '../services/generation-events.service';
import type { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import type { MergeLessonSectionsVideoUseCase } from './merge-lesson-sections-video.usecase';
import type { GenerateLessonAudioUseCase } from './generate-lesson-audio.usecase';
import type { GenerateArticleUseCase } from './generate-article.usecase';
import type { GenerateQuizUseCase } from './generate-quiz.usecase';

describe('AssetsGenerationOrchestratorUseCase', () => {
	let useCase: AssetsGenerationOrchestratorUseCase;
	let generationJobRepository: jest.Mocked<GenerationJobRepositoryPort>;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let generationEventsService: jest.Mocked<GenerationEventsService>;
	let generateSectionVideoUseCase: jest.Mocked<GenerateSectionVideoUseCase>;
	let mergeLessonSectionsVideoUseCase: jest.Mocked<MergeLessonSectionsVideoUseCase>;
	let generateLessonAudioUseCase: jest.Mocked<GenerateLessonAudioUseCase>;
	let generateArticleUseCase: jest.Mocked<GenerateArticleUseCase>;
	let generateQuizUseCase: jest.Mocked<GenerateQuizUseCase>;
	let lessonUpdateMock: jest.Mock;
	let generateArticleExecuteMock: jest.Mock;
	let generateQuizExecuteMock: jest.Mock;

	const providerSelection = {
		imageProvider: 'openai',
		audioProvider: 'openai',
		audioVoiceId: 'nova',
		videoProvider: 'openai',
	};

	beforeEach(() => {
		generationJobRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findActiveByCourseId: jest.fn(),
			update: jest.fn().mockResolvedValue(null),
		};

		lessonUpdateMock = jest.fn().mockResolvedValue(null);
		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: lessonUpdateMock,
			delete: jest.fn(),
		};

		generationEventsService = {
			stream: jest.fn(),
			publish: jest.fn(),
		};

		generateSectionVideoUseCase = {
			execute: jest.fn(),
		} as unknown as jest.Mocked<GenerateSectionVideoUseCase>;

		mergeLessonSectionsVideoUseCase = {
			execute: jest.fn(),
		} as unknown as jest.Mocked<MergeLessonSectionsVideoUseCase>;

		generateLessonAudioUseCase = {
			execute: jest.fn(),
		} as unknown as jest.Mocked<GenerateLessonAudioUseCase>;

		generateArticleExecuteMock = jest.fn();
		generateArticleUseCase = {
			execute: generateArticleExecuteMock,
		} as unknown as jest.Mocked<GenerateArticleUseCase>;

		generateQuizExecuteMock = jest.fn();
		generateQuizUseCase = {
			execute: generateQuizExecuteMock,
		} as unknown as jest.Mocked<GenerateQuizUseCase>;

		useCase = new AssetsGenerationOrchestratorUseCase(
			generationJobRepository,
			lessonRepository,
			generationEventsService,
			generateSectionVideoUseCase,
			mergeLessonSectionsVideoUseCase,
			generateLessonAudioUseCase,
			generateArticleUseCase,
			generateQuizUseCase
		);
	});

	it('gera article com fallback de descrição e persiste articleContent mesclando content', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-article',
			moduleId: 'module-1',
			title: 'Aula Artigo',
			description: null,
			lessonType: 'article',
			content: { keep: 'value', articleContent: 'old' },
		} as never);
		generateArticleExecuteMock.mockResolvedValue({
			content: 'novo artigo',
		});

		await useCase.run({
			jobId: 'job-1',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-article'],
			strategy: 'selected',
			providerSelection,
		});

		expect(generateArticleExecuteMock).toHaveBeenCalledWith(
			{
				courseId: 'course-1',
				moduleId: 'module-1',
				title: 'Aula Artigo',
				description: 'Aula Artigo',
				ai: { provider: 'openai' },
			},
			'user-1'
		);

		expect(lessonUpdateMock).toHaveBeenCalledWith(
			'lesson-article',
			expect.objectContaining({
				content: expect.objectContaining({
					keep: 'value',
					articleContent: 'novo artigo',
				}),
			}),
			expect.objectContaining({ userId: 'user-1' })
		);
	});

	it('gera quiz e persiste quizQuestions', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-quiz',
			moduleId: 'module-1',
			title: 'Quiz 1',
			description: 'desc',
			lessonType: 'quiz',
			content: { keep: 'value' },
		} as never);
		generateQuizExecuteMock.mockResolvedValue({
			quizQuestions: [
				{
					id: 'q1',
					question: 'Pergunta',
					options: ['A', 'B', 'C', 'D'],
					correctAnswer: 0,
				},
			],
		});

		await useCase.run({
			jobId: 'job-2',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-quiz'],
			strategy: 'selected',
			providerSelection,
		});

		expect(generateQuizExecuteMock).toHaveBeenCalledWith(
			{ courseId: 'course-1', moduleId: 'module-1' },
			'user-1'
		);
		expect(lessonUpdateMock).toHaveBeenCalledWith(
			'lesson-quiz',
			expect.objectContaining({
				content: expect.objectContaining({
					keep: 'value',
					quizQuestions: expect.any(Array),
				}),
			}),
			expect.objectContaining({ userId: 'user-1' })
		);
	});

	it('marca article como failed quando output estiver vazio', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-article',
			moduleId: 'module-1',
			title: 'Aula Artigo',
			description: 'desc',
			lessonType: 'article',
			content: {},
		} as never);
		generateArticleExecuteMock.mockResolvedValue({ content: '   ' });

		await useCase.run({
			jobId: 'job-3',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-article'],
			strategy: 'selected',
			providerSelection,
		});

		const completedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completedCall).toBeDefined();
		expect(completedCall?.[1].metadata?.lessonSummary).toEqual(
			expect.objectContaining({
				total: 1,
				success: 0,
				failed: 1,
				skipped: 0,
			})
		);
	});

	it('marca tipo não suportado como skipped', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-pdf',
			moduleId: 'module-1',
			title: 'PDF',
			description: 'desc',
			lessonType: 'pdf',
			content: {},
		} as never);

		await useCase.run({
			jobId: 'job-4',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-pdf'],
			strategy: 'selected',
			providerSelection,
		});

		const completedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completedCall?.[1].metadata?.lessonSummary).toEqual(
			expect.objectContaining({
				total: 1,
				success: 0,
				failed: 0,
				skipped: 1,
			})
		);
	});

	it('continua processamento quando uma aula falha e a próxima tem sucesso', async () => {
		lessonRepository.findById.mockImplementation((id: string) => {
			if (id === 'lesson-article') {
				return {
					id,
					moduleId: 'module-1',
					title: 'Artigo',
					description: 'desc',
					lessonType: 'article',
					content: {},
				} as never;
			}
			return {
				id,
				moduleId: 'module-1',
				title: 'Quiz',
				description: 'desc',
				lessonType: 'quiz',
				content: {},
			} as never;
		});

		generateArticleExecuteMock.mockRejectedValue(new Error('article boom'));
		generateQuizExecuteMock.mockResolvedValue({
			quizQuestions: [
				{
					id: 'q1',
					question: 'Pergunta',
					options: ['A', 'B', 'C', 'D'],
					correctAnswer: 1,
				},
			],
		});

		await useCase.run({
			jobId: 'job-5',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-article', 'lesson-quiz'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateQuizExecuteMock).toHaveBeenCalledTimes(1);

		const completedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completedCall?.[1].metadata?.lessonSummary).toEqual(
			expect.objectContaining({
				total: 2,
				success: 1,
				failed: 1,
				skipped: 0,
			})
		);
	});
});
