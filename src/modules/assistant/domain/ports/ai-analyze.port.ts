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

export interface AIAnalyticsPort {
	analyze(input: {
		title: string;
		description: string;
	}): Promise<AnalysisOutput>;
}
