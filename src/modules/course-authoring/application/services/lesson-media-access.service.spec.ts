import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LessonMediaAccessService } from './lesson-media-access.service';
import { Lesson } from '../../domain/entities/lesson.entity';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

describe('LessonMediaAccessService', () => {
	let service: LessonMediaAccessService;
	let storage: jest.Mocked<StoragePort>;

	beforeEach(() => {
		storage = {
			upload: jest.fn(),
			deleteObject: jest.fn(),
			download: jest.fn(),
			getAccessUrl: jest.fn().mockResolvedValue('https://signed.example/file'),
		};
		service = new LessonMediaAccessService(storage);
	});

	it('enriquece o conteúdo da aula com URLs temporárias', async () => {
		const result = await service.enrichContent({
			audioPath: 'user-1/lesson-1/audio.mp3',
			pdfPath: 'user-1/lesson-1/file.pdf',
			finalVideoPath: 'user-1/lesson-1/final.mp4',
			scriptSections: [
				{
					id: 'section-1',
					videoPath: 'user-1/lesson-1/section.mp4',
				},
			],
		});

		expect(storage.getAccessUrl.mock.calls).toHaveLength(4);
		expect(result).toEqual({
			audioPath: 'user-1/lesson-1/audio.mp3',
			audioUrl: 'https://signed.example/file',
			pdfPath: 'user-1/lesson-1/file.pdf',
			pdfUrl: 'https://signed.example/file',
			finalVideoPath: 'user-1/lesson-1/final.mp4',
			finalVideoUrl: 'https://signed.example/file',
			scriptSections: [
				{
					id: 'section-1',
					videoPath: 'user-1/lesson-1/section.mp4',
					videoUrl: 'https://signed.example/file',
				},
			],
		});
	});

	it('gera acesso temporário para vídeo de seção', async () => {
		const lesson = Lesson.restore({
			id: 'lesson-1',
			moduleId: 'module-1',
			courseId: 'course-1',
			title: 'Lesson',
			description: null,
			lessonType: 'video',
			content: {
				scriptSections: [
					{
						id: 'section-1',
						videoPath: 'user-1/lesson-1/section.mp4',
					},
				],
			},
			assets: null,
			orderIndex: 0,
			duration: null,
			isPublished: false,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
		});

		const result = await service.getLessonMediaAccess(lesson, {
			kind: 'sectionVideo',
			sectionId: 'section-1',
			disposition: 'attachment',
		});

		expect(storage.getAccessUrl.mock.calls[0]?.[0]).toEqual(
			expect.objectContaining({
				bucket: 'lesson-videos',
				path: 'user-1/lesson-1/section.mp4',
				disposition: 'attachment',
			})
		);
		expect(result.url).toBe('https://signed.example/file');
		expect(result.expiresAt).toEqual(expect.any(String));
	});

	it('falha quando sectionId não é enviado para sectionVideo', async () => {
		const lesson = Lesson.restore({
			id: 'lesson-1',
			moduleId: 'module-1',
			courseId: 'course-1',
			title: 'Lesson',
			description: null,
			lessonType: 'video',
			content: {},
			assets: null,
			orderIndex: 0,
			duration: null,
			isPublished: false,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
		});

		await expect(
			service.getLessonMediaAccess(lesson, {
				kind: 'sectionVideo',
			})
		).rejects.toThrow(BadRequestException);
	});

	it('falha quando a mídia não existe', async () => {
		const lesson = Lesson.restore({
			id: 'lesson-1',
			moduleId: 'module-1',
			courseId: 'course-1',
			title: 'Lesson',
			description: null,
			lessonType: 'audio',
			content: {},
			assets: null,
			orderIndex: 0,
			duration: null,
			isPublished: false,
			createdAt: new Date('2025-01-01T00:00:00.000Z'),
			updatedAt: new Date('2025-01-01T00:00:00.000Z'),
		});

		await expect(
			service.getLessonMediaAccess(lesson, {
				kind: 'audio',
			})
		).rejects.toThrow(NotFoundException);
	});
});
