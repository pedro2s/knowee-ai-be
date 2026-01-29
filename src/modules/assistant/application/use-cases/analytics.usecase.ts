import { Injectable } from '@nestjs/common';
import { AnalysisOutput } from '../../domain/ports/ai-analyze.port';
import { GenAIAnalyticsAdapter } from '../../infrastructure/providers/genai/gemini-analytics.adapter';

@Injectable()
export class AnalyticsUseCase {
	constructor(private readonly genAIAnalyticsAdapter: GenAIAnalyticsAdapter) {}

	async execute(input: {
		title: string;
		description: string;
	}): Promise<AnalysisOutput> {
		const analysis = await this.genAIAnalyticsAdapter.analyze(input);
		return analysis;
	}
}
