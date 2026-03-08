import { InternalServerErrorException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3';
import { S3StorageAdapter } from './s3-storage.adapter';

describe('S3StorageAdapter', () => {
	let adapter: S3StorageAdapter;
	let configService: jest.Mocked<ConfigService>;
	let sendMock: jest.Mock;

	beforeEach(() => {
		configService = {
			getOrThrow: jest.fn((key: string) => {
				const env: Record<string, string> = {
					AWS_S3_BUCKET_NAME: 'app-bucket',
					AWS_REGION: 'us-east-2',
					AWS_ACCESS_KEY_ID: 'key',
					AWS_SECRET_ACCESS_KEY: 'secret',
				};

				return env[key];
			}),
		} as never;

		adapter = new S3StorageAdapter(configService);
		sendMock = jest.fn();
		Object.defineProperty(adapter as object, 's3Client', {
			value: {
				send: sendMock,
				config: {
					credentials: () =>
						Promise.resolve({
							accessKeyId: 'key',
							secretAccessKey: 'secret',
						}),
				},
			},
		});
	});

	it('faz upload usando o prefixo do bucket lógico e retorna path/url assinados', async () => {
		sendMock.mockResolvedValue({});

		const result = await adapter.upload({
			bucket: 'lesson-audios',
			path: 'user-1/lesson-1/audio.mp3',
			buffer: Buffer.from('audio'),
			contentType: 'audio/mpeg',
			upsert: true,
		});

		expect(sendMock).toHaveBeenCalledWith(
			expect.objectContaining<Partial<PutObjectCommand>>({
				input: expect.objectContaining({
					Bucket: 'app-bucket',
					Key: 'lesson-audios/user-1/lesson-1/audio.mp3',
					ContentType: 'audio/mpeg',
				}),
			})
		);
		expect(result).toEqual({
			path: 'user-1/lesson-1/audio.mp3',
			url: expect.stringContaining(
				'https://app-bucket.s3.us-east-2.amazonaws.com/lesson-audios/user-1/lesson-1/audio.mp3?'
			),
		});
	});

	it('gera URL assinada com a key prefixada pelo bucket lógico', async () => {
		await expect(
			adapter.getAccessUrl({
				bucket: 'lesson-assets',
				path: 'user 1/file name.pdf',
				disposition: 'attachment',
			})
		).resolves.toEqual(
			expect.stringContaining(
				'https://app-bucket.s3.us-east-2.amazonaws.com/lesson-assets/user%201/file%20name.pdf?'
			)
		);
	});

	it('remove objeto usando a key prefixada pelo bucket lógico', async () => {
		sendMock.mockResolvedValue({});

		await adapter.deleteObject({
			bucket: 'lesson-videos',
			path: 'user-1/lesson-1/video.mp4',
		});

		expect(sendMock).toHaveBeenCalledWith(
			expect.objectContaining<Partial<DeleteObjectCommand>>({
				input: expect.objectContaining({
					Bucket: 'app-bucket',
					Key: 'lesson-videos/user-1/lesson-1/video.mp4',
				}),
			})
		);
	});

	it('baixa objeto e converte o corpo para Buffer', async () => {
		sendMock.mockResolvedValue({
			Body: {
				transformToByteArray: jest
					.fn()
					.mockResolvedValue(Uint8Array.from([65, 66, 67])),
			},
		});

		const result = await adapter.download({
			bucket: 'lesson-videos',
			path: 'user-1/lesson-1/video.mp4',
		});

		expect(sendMock).toHaveBeenCalledWith(
			expect.objectContaining<Partial<GetObjectCommand>>({
				input: expect.objectContaining({
					Bucket: 'app-bucket',
					Key: 'lesson-videos/user-1/lesson-1/video.mp4',
				}),
			})
		);
		expect(result).toEqual(Buffer.from('ABC'));
	});

	it('lança erro interno quando upload falha', async () => {
		sendMock.mockRejectedValue(new Error('boom'));

		await expect(
			adapter.upload({
				bucket: 'lesson-assets',
				path: 'file.pdf',
				buffer: Buffer.from('x'),
				contentType: 'application/pdf',
			})
		).rejects.toThrow(InternalServerErrorException);
	});
});
