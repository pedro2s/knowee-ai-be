import { Injectable } from '@nestjs/common';
import { AnalysisOutput } from '../../domain/ports/ai-analyze.port';
import { OpenAIAnalyticsAdapter } from '../../infrastructure/providers/openai/openai-analytics.adapter';

@Injectable()
export class AnalyticsUseCase {
	constructor(
		private readonly openAIAnalyticsAdapter: OpenAIAnalyticsAdapter
	) {}

	async execute(input: {
		title: string;
		description: string;
	}): Promise<AnalysisOutput> {
		const analysis = await this.openAIAnalyticsAdapter.analyze(input);
		return analysis;
	}
}
