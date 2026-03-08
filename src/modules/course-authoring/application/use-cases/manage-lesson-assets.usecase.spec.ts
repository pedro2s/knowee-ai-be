import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ManageLessonAssetsUseCase } from './manage-lesson-assets.usecase';
import type { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import type { StoragePort } from 'src/shared/storage/domain/ports/storage.port';

describe('ManageLessonAssetsUseCase', () => {
	let useCase: ManageLessonAssetsUseCase;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let storage: jest.Mocked<StoragePort>;

	beforeEach(() => {
		lessonRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		storage = {
			upload: jest.fn(),
			deleteObject: jest.fn(),
			download: jest.fn(),
			getAccessUrl: jest.fn(),
		};

		useCase = new ManageLessonAssetsUseCase(lessonRepository, storage);
	});

	it('remove o arquivo anterior, faz upload e persiste path/url do áudio', async () => {
		jest.spyOn(Date, 'now').mockReturnValue(123);
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			content: {
				audioPath: 'old/audio.mp3',
				keep: 'value',
			},
		} as never);
		storage.upload.mockResolvedValue({
			path: 'user-1/lesson-1/123-audio.mp3',
			url: 'https://cdn/audio.mp3',
		});

		const result = await useCase.uploadAudio({
			lessonId: 'lesson-1',
			userId: 'user-1',
			file: {
				originalname: 'audio.mp3',
				mimetype: 'audio/mpeg',
				buffer: Buffer.from('audio'),
			} as Express.Multer.File,
		});

		expect(storage.deleteObject.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-audios',
			path: 'old/audio.mp3',
		});
		expect(storage.upload.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-audios',
			path: 'user-1/lesson-1/123-audio.mp3',
			buffer: Buffer.from('audio'),
			contentType: 'audio/mpeg',
			upsert: true,
		});
		expect(lessonRepository.update.mock.calls[0]).toEqual([
			'lesson-1',
			{
				content: {
					audioPath: 'user-1/lesson-1/123-audio.mp3',
					keep: 'value',
				},
			},
			{ userId: 'user-1', role: 'authenticated' },
		]);
		expect(result).toEqual({
			path: 'user-1/lesson-1/123-audio.mp3',
			url: 'https://cdn/audio.mp3',
		});
	});

	it('remove path/url do pdf e apaga o arquivo do storage', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			content: {
				pdfPath: 'old/file.pdf',
				keep: 'value',
			},
		} as never);

		await useCase.deletePdf({
			lessonId: 'lesson-1',
			userId: 'user-1',
		});

		expect(storage.deleteObject.mock.calls[0]?.[0]).toEqual({
			bucket: 'lesson-assets',
			path: 'old/file.pdf',
		});
		expect(lessonRepository.update.mock.calls[0]).toEqual([
			'lesson-1',
			{
				content: {
					keep: 'value',
				},
			},
			{ userId: 'user-1', role: 'authenticated' },
		]);
	});

	it('lança erro quando a aula não existir', async () => {
		lessonRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.uploadPdf({
				lessonId: 'lesson-1',
				userId: 'user-1',
				file: {
					originalname: 'file.pdf',
					mimetype: 'application/pdf',
					buffer: Buffer.from('pdf'),
				} as Express.Multer.File,
			})
		).rejects.toThrow(new NotFoundException('Aula não encontrada'));
	});

	it('converte falha de upload em PreconditionFailedException', async () => {
		lessonRepository.findById.mockResolvedValue({
			id: 'lesson-1',
			content: {},
		} as never);
		storage.upload.mockRejectedValue(new Error('upload failed'));

		await expect(
			useCase.uploadPdf({
				lessonId: 'lesson-1',
				userId: 'user-1',
				file: {
					originalname: 'file.pdf',
					mimetype: 'application/pdf',
					buffer: Buffer.from('pdf'),
				} as Express.Multer.File,
			})
		).rejects.toThrow(new PreconditionFailedException('upload failed'));
	});
});
