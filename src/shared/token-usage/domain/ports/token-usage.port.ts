export abstract class TokenUsagePort {
	abstract save(
		userId: string,
		totalTokens: number,
		model: string
	): Promise<void>;
}
