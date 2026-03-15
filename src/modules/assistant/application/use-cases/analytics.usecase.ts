import { Injectable } from '@nestjs/common';
import { AnalysisOutput } from '../../domain/ports/ai-analyze.port';
import { OpenAIAnalyticsAdapter } from '../../infrastructure/providers/openai/openai-analytics.adapter';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

@Injectable()
export class AnalyticsUseCase {
	constructor(
		private readonly openAIAnalyticsAdapter: OpenAIAnalyticsAdapter,
		private readonly tokenUsageService: TokenUsagePort
	) {}

	async execute(input: {
		title: string;
		description: string;
		userId?: string;
	}): Promise<AnalysisOutput> {
		const result = await this.openAIAnalyticsAdapter.analyze(input);
		if (input.userId && result.tokenUsage) {
			await this.tokenUsageService.record({
				userId: input.userId,
				...result.tokenUsage,
			});
		}
		return result.analysis;
	}
}
