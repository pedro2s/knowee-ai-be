jest.mock('fs/promises', () => ({
	mkdtemp: jest.fn(),
	writeFile: jest.fn(),
	readFile: jest.fn(),
	rm: jest.fn(),
}));

import fs from 'fs/promises';
import { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import type { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import type { MediaPort } from 'src/shared/media/domain/ports/media.port';
import type { StoryboardGeneratorPort } from '../../domain/ports/storyboard-generator.port';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';
import type { ProviderRegistry as SharedProviderRegistry } from 'src/shared/ai-providers/infrastructure/registry/provider.registry';
import type { ProviderRegistry } from '../../infrastructure/providers/provider.registry';

describe('GenerateSectionVideoUseCase', () => {
	let useCase: GenerateSectionVideoUseCase;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let courseRepository: jest.Mocked<CourseRepositoryPort>;
	let moduleRepository: jest.Mocked<ModuleRepositoryPort>;
	let mediaService: jest.Mocked<MediaPort>;
	let storyboardGenerator: jest.Mocked<StoryboardGeneratorPort>;
	let storage: jest.Mocked<StoragePort>;
	let sharedProviderRegistry: jest.Mocked<SharedProviderRegistry>;
	let imageGenerator: { generate: jest.Mock };
	let audioGenerator: { generate: jest.Mock };

	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(123);
		(fs.mkdtemp as jest.Mock).mockResolvedValue('/tmp/video-dir');
		(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
		(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('video-file'));
		(fs.rm as jest.Mock).mockResolvedValue(undefined);

		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		courseRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			fetchAll: jest.fn(),
			saveCourseTree: jest.fn(),
		} as never;
		moduleRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByCourseId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveModuleTree: jest.fn(),
		} as never;
		mediaService = {
			getAudioDuration: jest.fn().mockResolvedValue(58),
			mergeAudios: jest.fn(),
			addBackgroundMusic: jest.fn(),
			cutMedia: jest.fn(),
			imageToVideo: jest.fn().mockResolvedValue(undefined),
			concatVideos: jest.fn().mockResolvedValue(undefined),
			syncVideoWithAudio: jest.fn(),
			createDynamicScene: jest.fn(),
		};
		storyboardGenerator = {
			generate: jest.fn(),
		};
		storage = {
			upload: jest.fn().mockResolvedValue({
				path: 'user-1/lesson-1/123-video.mp4',
				url: 'https://cdn/video.mp4',
			}),
			deleteObject: jest.fn().mockResolvedValue(undefined),
			download: jest.fn(),
			getAccessUrl: jest.fn(),
		};
		imageGenerator = {
			generate: jest.fn().mockResolvedValue({ content: Buffer.from('image') }),
		};
		audioGenerator = {
			generate: jest.fn().mockResolvedValue({ content: Buffer.from('audio') }),
		};
		sharedProviderRegistry = {
			get: jest
				.fn()
				.mockImplementation((provider: string, type: string) =>
					type === 'image' ? imageGenerator : audioGenerator
				),
		} as never;

		useCase = new GenerateSectionVideoUseCase(
			lessonRepository,
			courseRepository,
			moduleRepository,
			mediaService,
			storyboardGenerator,
			mediaService,
			storage,
			{} as ProviderRegistry,
			sharedProviderRegistry
		);
	});

	it('remove vídeo anterior, faz upload do mp4 final e persiste só o path da seção', async () => {
		const scriptSections = [
			{
				id: 'section-1',
				content: 'Narration',
				isRecorded: false,
				status: 'draft',
				notes: '',
				time: 0,
				timerActive: false,
				videoPath: 'old/video.mp4',
				storyboard: [
					{
						id: 1,
						narration: 'Narration',
						visualConcept: 'Concept',
						textOverlay: 'Overlay',
					},
				],
			},
		];

		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			moduleId: 'module-1',
			title: 'Lesson',
			description: 'Desc',
			content: {
				videoPath: 'old/video.mp4',
				scriptSections,
			},
		} as never);
		moduleRepository.findById.mockResolvedValue({
			id: 'module-1',
			courseId: 'course-1',
			title: 'Module',
			description: 'Desc',
		} as never);
		courseRepository.findById.mockResolvedValue({
			id: 'course-1',
			title: 'Course',
			description: 'Desc',
		} as never);

		const result = await useCase.execute(
			{
				lessonId: 'lesson-1',
				sectionId: 'section-1',
				audioProvider: 'openai',
				audioVoiceId: 'nova',
				imageProvider: 'openai',
			},
			'user-1'
		);

		expect(storage.deleteObject.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-videos',
			path: 'old/video.mp4',
		});
		expect(storage.upload.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-videos',
			path: 'user-1/lesson-1/123-video.mp4',
			buffer: Buffer.from('video-file'),
			contentType: 'video/mp4',
			upsert: true,
		});
		expect(lessonRepository.update.mock.lastCall).toEqual([
			'lesson-1',
			{
				content: {
					scriptSections: [
						expect.objectContaining({
							videoPath: 'user-1/lesson-1/123-video.mp4',
							videoDuration: 58,
							videoStatus: 'ready',
							isRecorded: true,
						}),
					],
				},
			},
			{ userId: 'user-1', role: 'authenticated' },
		]);
		expect(result).toEqual(
			expect.objectContaining({
				videoPath: 'user-1/lesson-1/123-video.mp4',
				videoUrl: 'https://cdn/video.mp4',
				videoDuration: 58,
				videoStatus: 'ready',
				isRecorded: true,
			})
		);
	});
});
