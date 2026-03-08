jest.mock('fs/promises', () => ({
	mkdtemp: jest.fn(),
	writeFile: jest.fn(),
	readFile: jest.fn(),
	rm: jest.fn(),
}));

import fs from 'fs/promises';
import { GenerateLessonAudioUseCase } from './generate-lesson-audio.usecase';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { MediaPort } from 'src/shared/media/domain/ports/media.port';
import type { ProviderRegistry } from 'src/shared/ai-providers/infrastructure/registry/provider.registry';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

describe('GenerateLessonAudioUseCase', () => {
	let useCase: GenerateLessonAudioUseCase;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let registry: jest.Mocked<ProviderRegistry>;
	let mediaService: jest.Mocked<MediaPort>;
	let storage: jest.Mocked<StoragePort>;
	let audioGenerator: { generate: jest.Mock };

	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(123);
		(fs.mkdtemp as jest.Mock).mockResolvedValue('/tmp/audio-dir');
		(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
		(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('merged-audio'));
		(fs.rm as jest.Mock).mockResolvedValue(undefined);

		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		audioGenerator = {
			generate: jest
				.fn()
				.mockResolvedValue({ content: Buffer.from('section') }),
		};
		registry = {
			get: jest.fn().mockReturnValue(audioGenerator),
		} as never;

		mediaService = {
			getAudioDuration: jest.fn().mockResolvedValue(125),
			mergeAudios: jest.fn().mockResolvedValue(undefined),
			addBackgroundMusic: jest.fn(),
			cutMedia: jest.fn(),
			imageToVideo: jest.fn(),
			concatVideos: jest.fn(),
			syncVideoWithAudio: jest.fn(),
			createDynamicScene: jest.fn(),
		};

		storage = {
			upload: jest.fn().mockResolvedValue({
				path: 'user-1/lesson-1/123-audio.mp3',
				url: 'https://cdn/audio.mp3',
			}),
			deleteObject: jest.fn().mockResolvedValue(undefined),
			download: jest.fn(),
			getPublicUrl: jest.fn(),
		};

		useCase = new GenerateLessonAudioUseCase(
			lessonRepository,
			registry,
			mediaService,
			storage
		);
	});

	it('remove áudio anterior, faz upload do mp3 final e persiste audioPath/audioUrl', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			title: 'Lesson',
			content: {
				audioPath: 'old/audio.mp3',
				scriptSections: [{ content: 'Parte 1' }, { content: 'Parte 2' }],
			},
		} as never);

		const result = await useCase.execute({
			lessonId: 'lesson-1',
			audioProvider: 'openai',
			audioVoiceId: 'nova',
			userId: 'user-1',
			runInBackground: false,
		});

		expect(storage.deleteObject.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-audios',
			path: 'old/audio.mp3',
		});
		expect(storage.upload.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-audios',
			path: 'user-1/lesson-1/123-audio.mp3',
			buffer: Buffer.from('merged-audio'),
			contentType: 'audio/mpeg',
			upsert: true,
		});
		expect(lessonRepository.update.mock.calls[0]).toEqual([
			'lesson-1',
			{
				content: {
					audioPath: 'user-1/lesson-1/123-audio.mp3',
					audioUrl: 'https://cdn/audio.mp3',
					scriptSections: [{ content: 'Parte 1' }, { content: 'Parte 2' }],
				},
				duration: 3,
			},
			{ userId: 'user-1', role: 'authenticated' },
		]);
		expect(result).toEqual({ message: 'Geração de áudio concluída.' });
		expect(fs.rm).toHaveBeenCalledWith('/tmp/audio-dir', {
			recursive: true,
			force: true,
		});
	});
});
