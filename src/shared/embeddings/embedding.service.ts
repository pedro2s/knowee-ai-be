import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { toSql } from 'pgvector/drizzle';
import { DrizzleService } from '../database/infrastructure/drizzle/drizzle.service';
import { documents } from '../database/infrastructure/drizzle/schema';
import { sql } from 'drizzle-orm';
import { TokenUsageService } from '../token-usage/token-usage.service';

@Injectable()
export class EmbeddingService {
	private readonly openai: OpenAI;
	private readonly logger = new Logger(EmbeddingService.name);

	constructor(
		private readonly drizzle: DrizzleService,
		@Inject(TokenUsageService)
		private readonly tokenUsageService: TokenUsageService,
	) {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	/**
	 * Inserts content and its embedding into the database.
	 * @param userId - The ID of the user.
	 * @param content - The text content to embed and store.
	 */
	async insertEmbedding(userId: string, content: string): Promise<void> {
		this.logger.log(`Generating embedding for content for user ${userId}`);
		const embedding = await this._embedText(userId, content);

		this.logger.log(`Inserting document for user ${userId}`);
		await this.drizzle.db.insert(documents).values({
			userId,
			content,
			embedding: toSql(embedding),
		});
	}

	/**
	 * Queries for documents with content similar to the query text.
	 * @param userId - The ID of the user.
	 * @param query - The query text to find similar content for.
	 * @returns An array of similar content strings.
	 */
	async querySimilar(userId: string, query: string): Promise<string[]> {
		this.logger.log(`Generating embedding for query for user ${userId}`);
		const embedding = await this._embedText(userId, query);

		this.logger.log(`Querying similar documents for user ${userId}`);
		const result = await this.drizzle.db.execute(sql`
			SELECT content FROM documents 
			WHERE user_id = ${userId} 
			ORDER BY embedding <-> ${toSql(embedding)}
			LIMIT 5
		`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return result.rows.map((row: any) => row.content as string);
	}

	/**
	 * Generates an embedding for a given text using OpenAI's API.
	 * @param userId - The ID of the user (for token tracking).
	 * @param text - The text to embed.
	 * @returns The embedding vector.
	 */
	private async _embedText(userId: string, text: string): Promise<number[]> {
		const response = await this.openai.embeddings.create({
			model: 'text-embedding-3-small',
			input: text.replace(/\n/g, ' '), // OpenAI recommends replacing newlines
		});

		const tokens = response.usage?.total_tokens;
		if (tokens) {
			await this.tokenUsageService.save(
				userId,
				tokens,
				'text-embedding-3-small',
			);
		}

		return response.data[0].embedding;
	}
}
