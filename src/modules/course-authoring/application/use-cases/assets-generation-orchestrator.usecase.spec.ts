import { AssetsGenerationOrchestratorUseCase } from './assets-generation-orchestrator.usecase';
import type { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { GenerationEventsService } from '../services/generation-events.service';
import type { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import type { MergeLessonSectionsVideoUseCase } from './merge-lesson-sections-video.usecase';
import type { GenerateLessonAudioUseCase } from './generate-lesson-audio.usecase';
import type { GenerateArticleUseCase } from './generate-article.usecase';
import type { GenerateQuizUseCase } from './generate-quiz.usecase';
import type { GenerateLessonScriptUseCase } from './generate-lesson-script.usecase';

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
	let generateLessonScriptUseCase: jest.Mocked<GenerateLessonScriptUseCase>;
	let lessonUpdateMock: jest.Mock;
	let generateArticleExecuteMock: jest.Mock;
	let generateQuizExecuteMock: jest.Mock;
	let generateLessonScriptExecuteMock: jest.Mock;

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

		generateLessonScriptExecuteMock = jest.fn();
		generateLessonScriptUseCase = {
			execute: generateLessonScriptExecuteMock,
		} as unknown as jest.Mocked<GenerateLessonScriptUseCase>;

		useCase = new AssetsGenerationOrchestratorUseCase(
			generationJobRepository,
			lessonRepository,
			generationEventsService,
			generateSectionVideoUseCase,
			mergeLessonSectionsVideoUseCase,
			generateLessonAudioUseCase,
			generateArticleUseCase,
			generateQuizUseCase,
			generateLessonScriptUseCase
		);
	});

	it('gera article com fallback de descrição e persiste articleContent mesclando content', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-article',
			moduleId: 'module-1',
			title: 'Aula Artigo',
			description: null,
			lessonType: 'article',
			content: { keep: 'value' },
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

	it('gera script automaticamente para aula de video sem roteiro e exige finalVideoPath', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-video',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
					finalVideoPath: 'user-1/lesson-video/final.mp4',
				},
			} as never);

		generateLessonScriptExecuteMock.mockResolvedValue({
			scriptSections: [{ id: 'section-1', content: 'texto' }],
		});
		generateSectionVideoUseCase.execute.mockResolvedValue({} as never);
		mergeLessonSectionsVideoUseCase.execute.mockResolvedValue({} as never);

		await useCase.run({
			jobId: 'job-video',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-video'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateLessonScriptExecuteMock).toHaveBeenCalledTimes(1);
		expect(generateSectionVideoUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				lessonId: 'lesson-video',
				sectionId: 'section-1',
				videoProvider: 'openai',
			}),
			'user-1'
		);
		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				isExportReady: true,
				lessonSummary: expect.objectContaining({
					skipped: 0,
				}),
				blockingIssues: [],
			})
		);
	});

	it('gera script automaticamente para aula de audio sem roteiro e exige audioPath', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-audio',
				moduleId: 'module-1',
				title: 'Aula Audio',
				description: 'desc',
				lessonType: 'audio',
				content: {},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-audio',
				moduleId: 'module-1',
				title: 'Aula Audio',
				description: 'desc',
				lessonType: 'audio',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-audio',
				moduleId: 'module-1',
				title: 'Aula Audio',
				description: 'desc',
				lessonType: 'audio',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
					audioPath: 'user-1/lesson-audio/final.mp3',
				},
			} as never);

		generateLessonScriptExecuteMock.mockResolvedValue({
			scriptSections: [{ id: 'section-1', content: 'texto' }],
		});
		generateLessonAudioUseCase.execute.mockResolvedValue({} as never);

		await useCase.run({
			jobId: 'job-audio',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-audio'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateLessonScriptExecuteMock).toHaveBeenCalledTimes(1);
		expect(generateLessonAudioUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				lessonId: 'lesson-audio',
				audioProvider: 'openai',
			})
		);
		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				isExportReady: true,
				lessonSummary: expect.objectContaining({
					skipped: 0,
				}),
				blockingIssues: [],
			})
		);
	});

	it('reaproveita video final e secoes prontas sem regerar nada e marca a aula como skipped', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-video-existing',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-1',
							content: 'texto',
							videoPath: 'user-1/lesson-video-existing/section-1.mp4',
						},
					],
					finalVideoPath: 'user-1/lesson-video-existing/final.mp4',
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video-existing',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-1',
							content: 'texto',
							videoPath: 'user-1/lesson-video-existing/section-1.mp4',
						},
					],
					finalVideoPath: 'user-1/lesson-video-existing/final.mp4',
				},
			} as never);

		await useCase.run({
			jobId: 'job-video-existing',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-video-existing'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateSectionVideoUseCase.execute).not.toHaveBeenCalled();
		expect(mergeLessonSectionsVideoUseCase.execute).not.toHaveBeenCalled();

		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				lessonSummary: expect.objectContaining({
					success: 0,
					skipped: 1,
					items: expect.arrayContaining([
						expect.objectContaining({
							lessonId: 'lesson-video-existing',
							status: 'skipped',
							readiness: 'ready',
						}),
					]),
				}),
			})
		);
	});

	it('executa apenas o merge final quando as secoes ja possuem video', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-video-merge-only',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-1',
							content: 'texto',
							videoUrl: 'https://cdn.test/section-1.mp4',
						},
					],
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video-merge-only',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-1',
							content: 'texto',
							videoUrl: 'https://cdn.test/section-1.mp4',
						},
					],
					finalVideoPath: 'user-1/lesson-video-merge-only/final.mp4',
				},
			} as never);
		mergeLessonSectionsVideoUseCase.execute.mockResolvedValue({} as never);

		await useCase.run({
			jobId: 'job-video-merge-only',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-video-merge-only'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateSectionVideoUseCase.execute).not.toHaveBeenCalled();
		expect(mergeLessonSectionsVideoUseCase.execute).toHaveBeenCalledWith(
			'lesson-video-merge-only',
			'user-1'
		);
	});

	it('gera apenas as secoes sem video quando a aula esta parcialmente pronta', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-video-partial',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-ready',
							content: 'texto pronto',
							videoPath: 'user-1/lesson-video-partial/ready.mp4',
						},
						{
							id: 'section-missing',
							content: 'texto faltante',
						},
					],
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video-partial',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [
						{
							id: 'section-ready',
							content: 'texto pronto',
							videoPath: 'user-1/lesson-video-partial/ready.mp4',
						},
						{
							id: 'section-missing',
							content: 'texto faltante',
							videoPath: 'user-1/lesson-video-partial/missing.mp4',
						},
					],
					finalVideoPath: 'user-1/lesson-video-partial/final.mp4',
				},
			} as never);
		generateSectionVideoUseCase.execute.mockResolvedValue({} as never);
		mergeLessonSectionsVideoUseCase.execute.mockResolvedValue({} as never);

		await useCase.run({
			jobId: 'job-video-partial',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-video-partial'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateSectionVideoUseCase.execute).toHaveBeenCalledTimes(1);
		expect(generateSectionVideoUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				lessonId: 'lesson-video-partial',
				sectionId: 'section-missing',
			}),
			'user-1'
		);
		expect(mergeLessonSectionsVideoUseCase.execute).toHaveBeenCalledWith(
			'lesson-video-partial',
			'user-1'
		);
	});

	it('reaproveita audio existente e marca a aula como skipped', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-audio-existing',
				moduleId: 'module-1',
				title: 'Aula Audio',
				description: 'desc',
				lessonType: 'audio',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
					audioPath: 'user-1/lesson-audio-existing/audio.mp3',
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-audio-existing',
				moduleId: 'module-1',
				title: 'Aula Audio',
				description: 'desc',
				lessonType: 'audio',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
					audioPath: 'user-1/lesson-audio-existing/audio.mp3',
				},
			} as never);

		await useCase.run({
			jobId: 'job-audio-existing',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-audio-existing'],
			strategy: 'all',
			providerSelection,
		});

		expect(generateLessonAudioUseCase.execute).not.toHaveBeenCalled();
		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				lessonSummary: expect.objectContaining({
					success: 0,
					skipped: 1,
					items: expect.arrayContaining([
						expect.objectContaining({
							lessonId: 'lesson-audio-existing',
							status: 'skipped',
						}),
					]),
				}),
			})
		);
	});

	it('reaproveita article existente e nao chama a geracao novamente', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-article-existing',
			moduleId: 'module-1',
			title: 'Aula Artigo',
			description: 'desc',
			lessonType: 'article',
			content: { articleContent: 'conteudo pronto' },
		} as never);

		await useCase.run({
			jobId: 'job-article-existing',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-article-existing'],
			strategy: 'selected',
			providerSelection,
		});

		expect(generateArticleExecuteMock).not.toHaveBeenCalled();
		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				lessonSummary: expect.objectContaining({
					success: 0,
					skipped: 1,
					items: expect.arrayContaining([
						expect.objectContaining({
							lessonId: 'lesson-article-existing',
							status: 'skipped',
						}),
					]),
				}),
			})
		);
	});

	it('reaproveita quiz existente e nao chama a geracao novamente', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-quiz-existing',
			moduleId: 'module-1',
			title: 'Quiz 1',
			description: 'desc',
			lessonType: 'quiz',
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
		} as never);

		await useCase.run({
			jobId: 'job-quiz-existing',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-quiz-existing'],
			strategy: 'selected',
			providerSelection,
		});

		expect(generateQuizExecuteMock).not.toHaveBeenCalled();
		const completionCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'completed'
		);
		expect(completionCall?.[1].metadata).toEqual(
			expect.objectContaining({
				lessonSummary: expect.objectContaining({
					success: 0,
					skipped: 1,
					items: expect.arrayContaining([
						expect.objectContaining({
							lessonId: 'lesson-quiz-existing',
							status: 'skipped',
						}),
					]),
				}),
			})
		);
	});

	it('falha o job quando aula de video termina sem finalVideoPath', async () => {
		lessonRepository.findById
			.mockResolvedValueOnce({
				id: 'lesson-video',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
				},
			} as never)
			.mockResolvedValueOnce({
				id: 'lesson-video',
				moduleId: 'module-1',
				title: 'Aula Video',
				description: 'desc',
				lessonType: 'video',
				content: {
					scriptSections: [{ id: 'section-1', content: 'texto' }],
				},
			} as never);
		generateSectionVideoUseCase.execute.mockResolvedValue({} as never);
		mergeLessonSectionsVideoUseCase.execute.mockResolvedValue({} as never);

		await useCase.run({
			jobId: 'job-video-missing',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-video'],
			strategy: 'all',
			providerSelection,
		});

		const failedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'failed'
		);
		expect(failedCall?.[1].metadata).toEqual(
			expect.objectContaining({
				isExportReady: false,
				blockingIssues: expect.arrayContaining([
					expect.objectContaining({ code: 'video_final_missing' }),
				]),
			})
		);
	});

	it('marca pdf sem pdfPath como bloqueante', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-pdf',
			moduleId: 'module-1',
			title: 'PDF',
			description: 'desc',
			lessonType: 'pdf',
			content: {},
		} as never);

		await useCase.run({
			jobId: 'job-pdf',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-pdf'],
			strategy: 'selected',
			providerSelection,
		});

		const failedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'failed'
		);
		expect(failedCall?.[1].metadata).toEqual(
			expect.objectContaining({
				isExportReady: false,
				blockingIssues: expect.arrayContaining([
					expect.objectContaining({ code: 'pdf_missing' }),
				]),
			})
		);
	});

	it('marca external sem externalUrl como bloqueante', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-external',
			moduleId: 'module-1',
			title: 'Link',
			description: 'desc',
			lessonType: 'external',
			content: {},
		} as never);

		await useCase.run({
			jobId: 'job-external',
			userId: 'user-1',
			courseId: 'course-1',
			lessonIds: ['lesson-external'],
			strategy: 'selected',
			providerSelection,
		});

		const failedCall = generationJobRepository.update.mock.calls.find(
			(call) => call[1].status === 'failed'
		);
		expect(failedCall?.[1].metadata).toEqual(
			expect.objectContaining({
				isExportReady: false,
				blockingIssues: expect.arrayContaining([
					expect.objectContaining({ code: 'external_url_missing' }),
				]),
			})
		);
	});
});
