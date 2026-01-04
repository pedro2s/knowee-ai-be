export const TOKEN_USAGE_SERVICE = 'TokenUsageService';

export interface TokenUsagePort {
	save(userId: string, totalTokens: number, model: string): Promise<void>;
}
