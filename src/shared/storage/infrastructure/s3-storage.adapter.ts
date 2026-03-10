import {
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
	type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	DeleteObjectParams,
	DownloadObjectParams,
	GetObjectUrlParams,
	StoragePort,
	UploadObjectParams,
	UploadObjectResult,
} from '../domain/ports/storage.port';

@Injectable()
export class S3StorageAdapter implements StoragePort {
	private static readonly DEFAULT_SIGNED_URL_TTL = 60 * 15;
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly region: string;
	private readonly logger = new Logger(S3StorageAdapter.name);

	constructor(private readonly configService: ConfigService) {
		this.bucketName =
			this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
		this.region = this.configService.getOrThrow<string>('AWS_REGION');

		this.s3Client = new S3Client(this.buildS3ClientConfig());
	}

	private buildS3ClientConfig(): S3ClientConfig {
		const profile = this.configService.get<string>('AWS_SDK_PROFILE')?.trim();
		const config: S3ClientConfig = {
			region: this.region,
		};

		if (profile) {
			this.logger.log(
				`Using AWS shared credentials profile "${profile}" for S3`
			);
			config.credentials = fromIni({ profile });
		} else {
			this.logger.debug('Using default AWS credential chain for S3');
		}

		return config;
	}

	async upload(params: UploadObjectParams): Promise<UploadObjectResult> {
		const key = this.buildObjectKey(params.bucket, params.path);

		try {
			await this.s3Client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: key,
					Body: params.buffer,
					ContentType: params.contentType,
				})
			);

			return {
				path: params.path,
				url: await this.getAccessUrl({
					bucket: params.bucket,
					path: params.path,
				}),
			};
		} catch (error) {
			this.logger.error(`Erro ao fazer upload para o S3: ${String(error)}`);
			throw new InternalServerErrorException(
				'Falha no upload do arquivo para o storage.'
			);
		}
	}

	async deleteObject(params: DeleteObjectParams): Promise<void> {
		const key = this.buildObjectKey(params.bucket, params.path);

		try {
			await this.s3Client.send(
				new DeleteObjectCommand({
					Bucket: this.bucketName,
					Key: key,
				})
			);
		} catch (error) {
			this.logger.error(`Erro ao remover arquivo do S3: ${String(error)}`);
			throw new InternalServerErrorException(
				'Falha ao remover arquivo do storage.'
			);
		}
	}

	async download(params: DownloadObjectParams): Promise<Buffer> {
		const key = this.buildObjectKey(params.bucket, params.path);

		try {
			const response = await this.s3Client.send(
				new GetObjectCommand({
					Bucket: this.bucketName,
					Key: key,
				})
			);

			if (!response.Body) {
				throw new InternalServerErrorException(
					'Arquivo não retornou conteúdo do storage.'
				);
			}

			return Buffer.from(await response.Body.transformToByteArray());
		} catch (error) {
			this.logger.error(`Erro ao baixar arquivo do S3: ${String(error)}`);
			if (error instanceof InternalServerErrorException) {
				throw error;
			}
			throw new InternalServerErrorException(
				'Falha ao baixar arquivo do storage.'
			);
		}
	}

	async getAccessUrl(params: GetObjectUrlParams): Promise<string> {
		const key = this.buildObjectKey(params.bucket, params.path);
		const disposition = params.disposition ?? 'inline';
		const filename = params.filename ?? this.extractFileName(params.path);
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			ResponseContentDisposition: this.buildContentDisposition(
				disposition,
				filename
			),
		});

		try {
			return await getSignedUrl(this.s3Client, command, {
				expiresIn:
					params.expiresInSeconds ?? S3StorageAdapter.DEFAULT_SIGNED_URL_TTL,
			});
		} catch (error) {
			this.logger.error(
				`Erro ao gerar URL assinada do S3 para ${key}: ${String(error)}`
			);
			throw new InternalServerErrorException(
				'Falha ao gerar URL de acesso do arquivo no storage.'
			);
		}
	}

	private buildObjectKey(bucket: string, path: string): string {
		const normalizedBucket = bucket.replace(/^\/+|\/+$/g, '');
		const normalizedPath = path.replace(/^\/+/, '');

		return `${normalizedBucket}/${normalizedPath}`;
	}

	private extractFileName(path: string): string {
		const segments = path.split('/');
		return segments[segments.length - 1] || 'arquivo';
	}

	private buildContentDisposition(
		disposition: 'inline' | 'attachment',
		filename: string
	): string {
		const sanitizedFileName = filename.replace(/["\\]/g, '_');
		return `${disposition}; filename="${sanitizedFileName}"`;
	}
}
