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
} from '@aws-sdk/client-s3';
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
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly region: string;
	private readonly logger = new Logger(S3StorageAdapter.name);

	constructor(private readonly configService: ConfigService) {
		this.bucketName =
			this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
		this.region = this.configService.getOrThrow<string>('AWS_REGION');

		this.s3Client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
				secretAccessKey: this.configService.getOrThrow<string>(
					'AWS_SECRET_ACCESS_KEY'
				),
			},
		});
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
				url: this.getPublicUrl({ bucket: params.bucket, path: params.path }),
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

	getPublicUrl(params: GetObjectUrlParams): string {
		const key = this.buildObjectKey(params.bucket, params.path);
		const encodedKey = key
			.split('/')
			.map((segment) => encodeURIComponent(segment))
			.join('/');

		return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodedKey}`;
	}

	private buildObjectKey(bucket: string, path: string): string {
		const normalizedBucket = bucket.replace(/^\/+|\/+$/g, '');
		const normalizedPath = path.replace(/^\/+/, '');

		return `${normalizedBucket}/${normalizedPath}`;
	}
}
