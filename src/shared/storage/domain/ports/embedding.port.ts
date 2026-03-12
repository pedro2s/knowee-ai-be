export abstract class EmbeddingPort {
	abstract insertEmbedding(userId: string, content: string): Promise<void>;
	abstract querySimilar(userId: string, query: string): Promise<string[]>;
}
