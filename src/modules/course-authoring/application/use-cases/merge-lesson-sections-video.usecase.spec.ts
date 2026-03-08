jest.mock('fs/promises', () => ({
	mkdtemp: jest.fn(),
	writeFile: jest.fn(),
	readFile: jest.fn(),
	rm: jest.fn(),
}));

import fs from 'fs/promises';
import { MergeLessonSectionsVideoUseCase } from './merge-lesson-sections-video.usecase';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { MediaPort } from 'src/shared/media/domain/ports/media.port';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

describe('MergeLessonSectionsVideoUseCase', () => {
	let useCase: MergeLessonSectionsVideoUseCase;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let storage: jest.Mocked<StoragePort>;
	let mediaService: jest.Mocked<MediaPort>;

	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(123);
		(fs.mkdtemp as jest.Mock).mockResolvedValue('/tmp/merge-dir');
		(fs.writeFile as jest.Mock).mockResolvedValue(undefined);
		(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('merged-video'));
		(fs.rm as jest.Mock).mockResolvedValue(undefined);

		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		storage = {
			upload: jest.fn().mockResolvedValue({
				path: 'user-1/lesson-1/merged-lesson-123.mp4',
				url: 'https://cdn/final.mp4',
			}),
			deleteObject: jest.fn(),
			download: jest.fn().mockResolvedValue(Buffer.from('section-video')),
			getAccessUrl: jest.fn(),
		};
		mediaService = {
			getAudioDuration: jest.fn().mockResolvedValue(180),
			mergeAudios: jest.fn(),
			addBackgroundMusic: jest.fn(),
			cutMedia: jest.fn(),
			imageToVideo: jest.fn(),
			concatVideos: jest.fn().mockResolvedValue(undefined),
			syncVideoWithAudio: jest.fn(),
			createDynamicScene: jest.fn(),
		};

		useCase = new MergeLessonSectionsVideoUseCase(
			lessonRepository,
			storage,
			mediaService
		);
	});

	it('baixa vídeos das seções, sobe o vídeo final e persiste só finalVideoPath', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			title: 'Lesson',
			content: {
				scriptSections: [
					{
						id: 'section-1',
						videoPath: 'path-1.mp4',
					},
					{
						id: 'section-2',
						videoPath: 'path-2.mp4',
					},
				],
			},
		} as never);

		const result = await useCase.execute('lesson-1', 'user-1');

		expect(storage.download.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-videos',
			path: 'path-1.mp4',
		});
		expect(storage.download.mock.calls[1]?.[0]).toEqual({
			bucket: 'lesson-videos',
			path: 'path-2.mp4',
		});
		expect(storage.upload.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-videos',
			path: 'user-1/lesson-1/merged-lesson-123.mp4',
			buffer: Buffer.from('merged-video'),
			contentType: 'video/mp4',
			upsert: true,
		});
		expect(lessonRepository.update.mock.calls[0]).toEqual([
			'lesson-1',
			{
				content: {
					scriptSections: [
						{
							id: 'section-1',
							videoPath: 'path-1.mp4',
						},
						{
							id: 'section-2',
							videoPath: 'path-2.mp4',
						},
					],
					finalVideoPath: 'user-1/lesson-1/merged-lesson-123.mp4',
					finalVideoStatus: 'ready',
				},
				duration: 3,
			},
			{ userId: 'user-1', role: 'authenticated' },
		]);
		expect(result).toEqual({
			message: 'Vídeos das seções mesclados com sucesso!',
			mergedVideoUrl: 'https://cdn/final.mp4',
		});
	});
});
