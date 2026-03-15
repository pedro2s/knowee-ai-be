import { AIUsageMetrics } from 'src/shared/types/interaction';

export interface AnalysisOutput {
	category: string;
	level: string;
	duration: string;
	analysis: {
		title: {
			status: string;
			message: string;
		};
		description: {
			status: string;
			message: string;
		};
	};
}

export interface AnalysisResult {
	analysis: AnalysisOutput;
	tokenUsage?: AIUsageMetrics;
}

export interface AIAnalyticsPort {
	analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisResult>;
}
