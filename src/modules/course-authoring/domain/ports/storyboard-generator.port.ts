export const STORYBOARD_GENERATOR = 'StoryboardGenerator';

export interface GenerateStoryboardInput {
	course: {
		title: string;
		description: string;
	};
	module: {
		title: string;
		description: string;
	};
	lesson: {
		title: string;
		description: string;
	};
	script: string;
}

export interface GeneratedStoryboardOutput {
	storyboard: Array<{
		scene: number;
		audioText: string;
		visual: {
			type: 'stock_video' | 'generated_image' | 'title_card';
			searchQuery: string;
		};
		textOverlay: string;
	}>;
}

export interface StoryboardGeneratorPort {
	generate(input: GenerateStoryboardInput): Promise<GeneratedStoryboardOutput>;
}
