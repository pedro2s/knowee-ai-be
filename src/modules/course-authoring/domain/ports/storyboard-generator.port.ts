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

export interface Scene {
	id: number;
	narration: string;
	visualConcept: string;
	textOverlay: string;
}
export interface GeneratedStoryboardOutput {
	storyboard: Array<Scene>;
}

export interface StoryboardGeneratorPort {
	generate(input: GenerateStoryboardInput): Promise<GeneratedStoryboardOutput>;
}
