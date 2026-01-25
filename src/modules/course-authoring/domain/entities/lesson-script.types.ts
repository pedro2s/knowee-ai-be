export interface ScriptSection {
	id: string;
	content: string;
	isRecord: boolean;
	status: string;
	notes: string;
	time: number;
	timerActive: boolean;
	videoUrl?: string;
	videoPath?: string;
	videoDuration?: number;
}

export interface GenerateLessonScriptInput {
	title: string;
	description: string;
}

export interface GeneratedLessonScript {
	scriptSections: Array<ScriptSection>;
}
