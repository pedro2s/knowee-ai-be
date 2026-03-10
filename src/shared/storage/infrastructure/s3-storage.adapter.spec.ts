import { InternalServerErrorException, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageAdapter } from './s3-storage.adapter';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
	getSignedUrl: jest.fn(),
}));
jest.mock('@aws-sdk/credential-provider-ini', () => ({
	fromIni: jest.fn(),
}));

describe('S3StorageAdapter', () => {
	let adapter: S3StorageAdapter;
	let configService: jest.Mocked<ConfigService>;
	let sendMock: jest.Mock;
	let getSignedUrlMock: jest.MockedFunction<typeof getSignedUrl>;
	let fromIniMock: jest.MockedFunction<typeof fromIni>;
	let env: Record<string, string>;
	let loggerDebugSpy: jest.SpyInstance;
	let loggerLogSpy: jest.SpyInstance;

	beforeEach(() => {
		env = {
			AWS_S3_BUCKET_NAME: 'app-bucket',
			AWS_REGION: 'us-east-2',
		};
		configService = {
			get: jest.fn((key: string) => env[key]),
			getOrThrow: jest.fn((key: string) => {
				return env[key];
			}),
		} as never;

		fromIniMock = fromIni as jest.MockedFunction<typeof fromIni>;
		fromIniMock.mockReset();
		loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
		loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
		adapter = new S3StorageAdapter(configService);
		sendMock = jest.fn();
		getSignedUrlMock = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;
		getSignedUrlMock.mockReset();
		getSignedUrlMock.mockResolvedValue(
			'https://app-bucket.s3.us-east-2.amazonaws.com/lesson-audios/user-1/lesson-1/audio.mp3?X-Amz-SignedHeaders=host&X-Amz-Expires=900'
		);
		Object.defineProperty(adapter as object, 's3Client', {
			value: {
				send: sendMock,
			},
		});
	});

	afterEach(() => {
		loggerDebugSpy.mockRestore();
		loggerLogSpy.mockRestore();
	});

	it('usa a default credential chain quando AWS_SDK_PROFILE nao esta definido', () => {
		expect(configService.get.mock.calls).toContainEqual(['AWS_SDK_PROFILE']);
		expect(fromIniMock).not.toHaveBeenCalled();
		expect(loggerDebugSpy).toHaveBeenCalledWith(
			'Using default AWS credential chain for S3'
		);
	});

	it('usa o shared credentials profile configurado para S3', () => {
		const credentialProvider = jest.fn();
		fromIniMock.mockReturnValue(credentialProvider);
		env.AWS_SDK_PROFILE = 'dev-profile';

		new S3StorageAdapter(configService);

		expect(fromIniMock).toHaveBeenCalledWith({ profile: 'dev-profile' });
		expect(loggerLogSpy).toHaveBeenCalledWith(
			'Using AWS shared credentials profile "dev-profile" for S3'
		);
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
		expect(result.url).toContain('X-Amz-SignedHeaders=host');
		expect(result.url).toContain('X-Amz-Expires=900');
		expect(getSignedUrlMock.mock.calls[0]?.[2]).toEqual({ expiresIn: 900 });
	});

	it('gera URL assinada com a key prefixada pelo bucket lógico', async () => {
		getSignedUrlMock.mockResolvedValue(
			'https://app-bucket.s3.us-east-2.amazonaws.com/lesson-assets/user%201/file%20name.pdf?X-Amz-SignedHeaders=host&X-Amz-Expires=900&response-content-disposition=attachment%3B%20filename%3D%22arquivo%20final.pdf%22'
		);
		const url = await adapter.getAccessUrl({
			bucket: 'lesson-assets',
			path: 'user 1/file name.pdf',
			disposition: 'attachment',
			filename: 'arquivo final.pdf',
		});

		expect(url).toContain(
			'https://app-bucket.s3.us-east-2.amazonaws.com/lesson-assets/user%201/file%20name.pdf?'
		);
		expect(url).toContain('X-Amz-SignedHeaders=host');
		expect(url).toContain('response-content-disposition=');
		expect(decodeURIComponent(url)).toContain(
			'attachment; filename="arquivo final.pdf"'
		);
		expect(getSignedUrlMock.mock.calls[0]?.[1]).toEqual(
			expect.objectContaining<Partial<GetObjectCommand>>({
				input: expect.objectContaining({
					Bucket: 'app-bucket',
					Key: 'lesson-assets/user 1/file name.pdf',
					ResponseContentDisposition:
						'attachment; filename="arquivo final.pdf"',
				}),
			})
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
