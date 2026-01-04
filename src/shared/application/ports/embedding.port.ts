export const EMBEDDING_SERVICE = 'EmbeddingService';

export interface EmbeddingPort {
	insertEmbedding(userId: string, content: string): Promise<void>;
	querySimilar(userId: string, query: string): Promise<string[]>;
}
