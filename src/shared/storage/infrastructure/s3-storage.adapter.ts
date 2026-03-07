import { Injectable, Logger } from '@nestjs/common';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SaveFileParams, StoragePort } from '../domain/ports/storage.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageAdapter implements StoragePort {
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly logger = new Logger(S3StorageAdapter.name);

	constructor(private configService: ConfigService) {
		this.bucketName =
			this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');

		this.s3Client = new S3Client({
			region: this.configService.getOrThrow<string>('AWS_REGION'),
			credentials: {
				accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
				secretAccessKey: this.configService.getOrThrow<string>(
					'AWS_SECRET_ACCESS_KEY'
				),
			},
		});
	}

	async save({
		buffer,
		fileName,
		mimetype,
		folder,
	}: SaveFileParams): Promise<string> {
		const key = folder ? `${folder}/${fileName}` : fileName;

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: mimetype,
			// ACL: 'public-read', // Descomente se os arquivos forem públicos
		});

		try {
			await this.s3Client.send(command);

			// Se for público, você pode retornar a URL direta do S3/CloudFront
			return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
		} catch (error) {
			this.logger.error(`Erro ao fazer upload para o S3: ${error.message}`);
			throw new Error('Falha no upload do arquivo de mídia.');
		}
	}

	async delete(fileUrl: string): Promise<void> {
		// Lógica simples para extrair a Key da URL
		const key = fileUrl.split('.amazonaws.com/')[1];
		if (!key) return;

		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		await this.s3Client.send(command);
	}

	async getSignedUrl(
		fileName: string,
		expiresInSeconds?: number
	): Promise<string> {
		// ... implementação omitida por brevidade, usaria o getSignedUrl do aws-sdk
		return Promise.resolve('url-assinata');
	}
}
