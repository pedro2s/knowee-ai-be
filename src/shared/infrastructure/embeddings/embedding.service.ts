import { Inject, Injectable, Logger } from '@nestjs/common';
import { toSql } from 'pgvector';
import { DrizzleService } from '../database/drizzle/drizzle.service';
import { documents } from '../database/drizzle/schema';
import { l2Distance, desc, eq } from 'drizzle-orm';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from '../../application/ports/token-usage.port';
import { OPENAI_CLIENT } from '../ai/ai.constants';
import OpenAI from 'openai';
import { EmbeddingPort } from '../../application/ports/embedding.port';

@Injectable()
export class EmbeddingService implements EmbeddingPort {
	private readonly logger = new Logger(EmbeddingService.name);
	private readonly CHUNK_SIZE = 1000;
	private readonly CHUNK_OVERLAP = 200;

	constructor(
		@Inject(OPENAI_CLIENT)
		private readonly openai: OpenAI,
		private readonly drizzle: DrizzleService,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort
	) {}

	/**
	 * Splits text into chunks, generates embeddings for each chunk in a batch,
	 * and inserts them into the database.
	 * @param userId - The ID of the user.
	 * @param content - The text content to embed and store.
	 */
	async insertEmbedding(userId: string, content: string): Promise<void> {
		this.logger.log(`Dividindo o conteúdo em blocos para o usuário ${userId}`);
		const chunks = this._splitText(
			content,
			this.CHUNK_SIZE,
			this.CHUNK_OVERLAP
		);
		this.logger.log(`Gerados ${chunks.length} blocos.`);

		if (chunks.length === 0) {
			this.logger.log('Nenhum conteúdo para inserir.');
			return;
		}

		this.logger.log('Gerando embeddings para todos os blocos...');
		const embeddings = await this._embedBatch(userId, chunks);

		const documentsToInsert = chunks.map((chunk, i) => ({
			userId,
			content: chunk,
			embedding: embeddings[i],
		}));

		this.logger.log(
			`Inserindo ${documentsToInsert.length} documentos para o usuário ${userId}`
		);
		await this.drizzle.db.insert(documents).values(documentsToInsert);
		this.logger.log('Todos os blocos inseridos com sucesso.');
	}

	/**
	 * Queries for document chunks with content similar to the query text.
	 * @param userId - The ID of the user.
	 * @param query - The query text to find similar content for.
	 * @returns An array of similar content strings.
	 */
	async querySimilar(userId: string, query: string): Promise<string[]> {
		this.logger.log(`Gerando embedding para a consulta do usuário ${userId}`);
		const embedding = await this._embedText(userId, query);

		this.logger.log(
			`Consultando documentos semelhantes para o usuário ${userId}`
		);

		const similarDocs = await this.drizzle.db
			.select({ content: documents.content })
			.from(documents)
			.where(eq(documents.userId, userId))
			.orderBy(desc(l2Distance(documents.embedding, toSql(embedding))))
			.limit(5);

		return similarDocs.map((doc) => doc.content as string);
	}

	/**
	 * Splits a text into overlapping chunks.
	 * @param text The text to split.
	 * @param chunkSize The maximum size of each chunk.
	 * @param chunkOverlap The overlap between consecutive chunks.
	 * @returns An array of text chunks.
	 */
	private _splitText(
		text: string,
		chunkSize: number,
		chunkOverlap: number
	): string[] {
		if (text.length <= chunkSize) {
			return [text];
		}

		const chunks: string[] = [];
		let startIndex = 0;
		while (startIndex < text.length) {
			const endIndex = Math.min(startIndex + chunkSize, text.length);
			chunks.push(text.substring(startIndex, endIndex));
			startIndex += chunkSize - chunkOverlap;
		}

		return chunks;
	}

	/**
	 * Generates an embedding for a single text. Convenience wrapper for _embedBatch.
	 */
	private async _embedText(userId: string, text: string): Promise<number[]> {
		const embeddings = await this._embedBatch(userId, [text]);
		return embeddings[0];
	}

	/**
	 * Generates embeddings for a batch of texts using OpenAI's API.
	 * @param userId - The ID of the user (for token tracking).
	 * @param texts - The array of texts to embed.
	 * @returns An array of embedding vectors.
	 */
	private async _embedBatch(
		userId: string,
		texts: string[]
	): Promise<number[][]> {
		const cleanTexts = texts.map((text) => text.replace(/\n/g, ' '));

		const response = await this.openai.embeddings.create({
			model: 'text-embedding-3-small',
			input: cleanTexts,
		});

		const tokens = response.usage?.total_tokens;
		if (tokens) {
			await this.tokenUsageService.save(
				userId,
				tokens,
				'text-embedding-3-small'
			);
		}

		return response.data.map((item) => item.embedding);
	}
}
